"""Phase 3 edge cases: error shapes, outages, empty data, duplicates, boundaries."""

from dataclasses import replace
from datetime import UTC, datetime, timedelta

import jwt
import pytest
from fastapi.testclient import TestClient
from postgrest.exceptions import APIError as PostgrestAPIError

from app import auth as auth_module
from app.deps import get_event_repository, get_family_repository
from app.integrations.capabilities import ALL_SIGNALS
from app.main import app
from app.services.metrics import compute_metrics, compute_trends
from app.services.periods import build_window
from tests.conftest import MEMBER_A1, FakeRepository, auth
from tests.factories import NOW, blocked, reached


class Events:
    def __init__(self, events=None, error: Exception | None = None):
        self.events, self.error = events or [], error

    def list_events(self, member_ids, start, end):
        if self.error:
            raise self.error
        return [e for e in self.events if e.member_id in set(member_ids) and start <= e.timestamp < end]


def use_events(repo):
    app.dependency_overrides[get_event_repository] = lambda: repo


def now_relative(events):
    shift = datetime.now(UTC) - NOW - timedelta(minutes=1)
    return [replace(e, timestamp=e.timestamp + shift) for e in events]


# --- Error responses -----------------------------------------------------------

def test_validation_errors_have_readable_detail(client):
    r = client.get("/api/members/not-a-uuid", headers=auth())
    assert r.status_code == 422
    body = r.json()
    assert isinstance(body["detail"], str) and body["detail"].startswith("Invalid member_id")
    assert body["errors"][0]["field"] == "member_id"


def test_overlong_timezone_rejected(client):
    use_events(Events())
    r = client.get(f"/api/dashboard/summary?tz={'A' * 65}", headers=auth())
    assert r.status_code == 422 and isinstance(r.json()["detail"], str)


def test_database_error_becomes_503(client):
    use_events(Events(error=PostgrestAPIError({"message": "relation does not exist", "code": "42P01"})))
    r = client.get("/api/dashboard/summary", headers=auth())
    assert r.status_code == 503
    assert "relation" not in r.json()["detail"]  # internals are not leaked


def test_unexpected_error_becomes_generic_500(settings):
    class Broken(FakeRepository):
        def get_profile_family_id(self, user_id):
            raise RuntimeError("secret internal detail")

    app.dependency_overrides[get_family_repository] = Broken
    from app.config import get_settings
    app.dependency_overrides[get_settings] = lambda: settings
    try:
        r = TestClient(app, raise_server_exceptions=False).get("/api/family", headers=auth())
    finally:
        app.dependency_overrides.clear()
    assert r.status_code == 500
    assert "secret" not in r.text
    assert r.json()["detail"].startswith("Something went wrong")


def test_jwks_outage_is_503_not_401(client, settings, monkeypatch):
    class Unreachable:
        def get_signing_key_from_jwt(self, _token):
            raise jwt.PyJWKClientConnectionError("connection refused")

    monkeypatch.setattr(auth_module, "_jwks_client", lambda _url: Unreachable())
    r = client.get("/api/family", headers={"Authorization": "Bearer " + _es256_shaped_token()})
    assert r.status_code == 503


def _es256_shaped_token() -> str:
    from cryptography.hazmat.primitives.asymmetric import ec

    key = ec.generate_private_key(ec.SECP256R1())
    return jwt.encode({"sub": "00000000-0000-0000-0000-000000000001", "exp": 9999999999}, key, algorithm="ES256", headers={"kid": "k1"})


def test_responses_carry_request_id(client, monkeypatch):
    from app.api.routes import health

    monkeypatch.setattr(health, "get_supabase", lambda: None)  # never touch the real database in tests
    r = client.get("/api/health")
    assert r.headers.get("X-Request-ID")


# --- Empty and unavailable data ----------------------------------------------

def test_member_with_no_events(client):
    use_events(Events())
    insights = client.get(f"/api/members/{MEMBER_A1}/insights?period=30d", headers=auth()).json()
    assert insights["metrics"]["calls_received"] == {"value": 0, "status": "available"}
    assert insights["metrics"]["block_share"]["value"] is None
    assert all(p["calls_received"] == 0 for p in insights["trends"])
    assert any("No suspicious interactions" in p["text"] for p in insights["patterns"])
    recs = client.get(f"/api/members/{MEMBER_A1}/recommendations", headers=auth()).json()
    assert [r["category"] for r in recs["recommendations"]] == ["maintain_current_practices"]


def test_family_with_no_events_summary(client):
    use_events(Events())
    body = client.get("/api/dashboard/summary", headers=auth()).json()
    assert body["totals"]["calls_received"]["value"] == 0
    assert body["recent_activity"] == []


def test_unavailable_messages_stay_null_through_api(client, monkeypatch):
    from app.services import analytics

    monkeypatch.setattr(analytics, "available_signals", lambda: frozenset({"calls", "blocked", "answered", "returned", "reported"}))
    use_events(Events(now_relative([blocked(MEMBER_A1)])))
    totals = client.get("/api/dashboard/summary", headers=auth()).json()["totals"]
    assert totals["messages_received"] == {"value": None, "status": "unavailable"}
    assert totals["calls_received"]["value"] == 1


# --- Duplicates and boundaries ------------------------------------------------

def test_duplicate_rows_from_storage_are_counted_once(client):
    event = now_relative([blocked(MEMBER_A1)])[0]
    use_events(Events([event, event]))
    body = client.get("/api/dashboard/summary?period=7d", headers=auth()).json()
    assert body["totals"]["calls_received"]["value"] == 1
    assert len(body["recent_activity"]) == 1


def test_window_start_inclusive_end_exclusive():
    window = build_window("7d", "UTC", NOW)
    at_start = replace(blocked(MEMBER_A1), timestamp=window.start)
    before_start = replace(blocked(MEMBER_A1), timestamp=window.start - timedelta(microseconds=1))
    at_end = replace(blocked(MEMBER_A1), timestamp=window.end)
    points = compute_trends([at_start, before_start, at_end], window, ALL_SIGNALS)
    assert sum(p.calls_received for p in points) == 1
    assert points[0].calls_received == 1


@pytest.mark.parametrize("period", ["7d", "30d", "90d"])
def test_trend_totals_match_summary_metrics(period):
    window = build_window(period, "America/Chicago", NOW)
    events = [blocked(MEMBER_A1, days_ago=d) for d in range(0, 95, 3)] + [reached(MEMBER_A1, "answered", days_ago=d) for d in range(1, 95, 7)]
    in_window = [e for e in events if window.contains(e.timestamp)]
    total = compute_metrics(in_window, ALL_SIGNALS)
    points = compute_trends(events, window, ALL_SIGNALS)
    assert sum(p.calls_received for p in points) == total.calls_received.value
    assert sum(p.interactions for p in points) == total.interactions.value
