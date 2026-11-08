from uuid import UUID

import pytest

from app.deps import get_event_repository
from app.main import app
from app.services import explanations
from tests.conftest import MEMBER_A1, MEMBER_B1, auth
from tests.factories import blocked, reached, reported, returned


class FakeEvents:
    def __init__(self, events):
        self.events = events
        self.calls = []

    def list_events(self, member_ids, start, end):
        self.calls.append((tuple(member_ids), start, end))
        return [e for e in self.events if e.member_id in set(member_ids) and start <= e.timestamp < end]


@pytest.fixture
def events_repo(client):
    from datetime import UTC, datetime, timedelta
    from dataclasses import replace

    # Shift factory events (anchored to a fixed NOW) to be relative to the real clock.
    now = datetime.now(UTC)
    from tests.factories import NOW
    shift = now - NOW
    base = [blocked(MEMBER_A1), blocked(MEMBER_A1), reached(MEMBER_A1, "answered"), returned(MEMBER_A1),
            reported(MEMBER_A1), blocked(MEMBER_B1)]
    repo = FakeEvents([replace(e, timestamp=e.timestamp + shift - timedelta(minutes=1)) for e in base])
    app.dependency_overrides[get_event_repository] = lambda: repo
    explanations.cache.clear()
    return repo


def test_summary_counts_only_own_family(client, events_repo):
    r = client.get("/api/dashboard/summary?period=7d&tz=America/Chicago", headers=auth())
    assert r.status_code == 200
    body = r.json()
    assert body["totals"]["calls_received"]["value"] == 3
    assert body["totals"]["calls_returned"]["value"] == 1
    assert [m["member"]["id"] for m in body["members"]] == [str(MEMBER_A1)]
    assert {e["member_id"] for e in body["recent_activity"]} == {str(MEMBER_A1)}
    assert {s["status"] for s in body["data_sources"]} == {"active", "not_connected"}
    # Only family A's member ids were requested from the repository.
    assert all(UUID(str(MEMBER_B1)) not in ids for ids, _, _ in events_repo.calls)


def test_trends_have_one_point_per_day(client, events_repo):
    r = client.get("/api/dashboard/trends?period=7d", headers=auth())
    assert r.status_code == 200
    assert len(r.json()["points"]) == 7


@pytest.mark.parametrize("query", ["period=14d", "period=7d&tz=Not/AZone"])
def test_invalid_period_or_timezone_is_422(client, events_repo, query):
    assert client.get(f"/api/dashboard/summary?{query}", headers=auth()).status_code == 422


def test_insights_for_other_family_member_is_404(client, events_repo):
    assert client.get(f"/api/members/{MEMBER_B1}/insights", headers=auth()).status_code == 404


def test_insights(client, events_repo):
    r = client.get(f"/api/members/{MEMBER_A1}/insights?period=30d", headers=auth())
    assert r.status_code == 200
    body = r.json()
    assert body["metrics"]["calls_answered"]["value"] == 1
    assert {b["key"] for b in body["protection_behaviors"]} >= {"network_blocking", "reporting"}


def test_short_period_recommendations_use_30_days(client, events_repo):
    r = client.get(f"/api/members/{MEMBER_A1}/recommendations?period=7d", headers=auth())
    assert r.status_code == 200
    assert r.json()["period"]["key"] == "30d"
    assert r.json()["recommendations"][0]["category"] == "review_call_protection"  # returned >= 1


def test_explanation_falls_back_without_gemini_key(client, events_repo, settings):
    settings.gemini_api_key = ""
    r = client.get(f"/api/members/{MEMBER_A1}/recommendations/review_call_protection/explanation", headers=auth())
    assert r.status_code == 200
    body = r.json()
    assert body["source"] == "fallback" and body["model"] is None
    assert body["next_steps"]


def test_explanation_falls_back_when_gemini_fails(client, events_repo, settings, monkeypatch):
    settings.gemini_api_key = "fake-key"

    def boom(*_args, **_kwargs):
        raise TimeoutError("simulated timeout")

    monkeypatch.setattr(explanations, "_call_gemini", boom)
    r = client.get(f"/api/members/{MEMBER_A1}/recommendations/review_call_protection/explanation", headers=auth())
    assert r.status_code == 200 and r.json()["source"] == "fallback"


def test_explanation_uses_valid_ai_output_and_caches(client, events_repo, settings, monkeypatch):
    from app.schemas.recommendations import ExplanationText

    settings.gemini_api_key = "fake-key"
    calls = []

    def fake(_settings, payload):
        calls.append(payload)
        return ExplanationText(
            summary="Mom answered a call labeled as a likely scam and called back a suspicious number.",
            why_it_matters="Scam callers often rely on live conversations to build trust quickly.",
            next_steps=["Check that Scam Block is turned on for this line."],
        )

    monkeypatch.setattr(explanations, "_call_gemini", fake)
    url = f"/api/members/{MEMBER_A1}/recommendations/review_call_protection/explanation"
    first = client.get(url, headers=auth()).json()
    second = client.get(url, headers=auth()).json()
    assert first["source"] == "ai" and second["source"] == "ai"
    assert len(calls) == 1  # second request served from cache
    # Gemini only receives aggregate metrics, never raw events or phone labels.
    assert set(calls[0]) == {"member_display_name", "reporting_period_days", "recommendation_category", "recommendation_title",
                             "reasons", "supporting_metrics", "relevant_features", "may_mention_premium", "data_note"}
    assert "Ending in" not in str(calls[0])


def test_ai_output_with_invented_numbers_falls_back(client, events_repo, settings, monkeypatch):
    from app.schemas.recommendations import ExplanationText

    settings.gemini_api_key = "fake-key"
    monkeypatch.setattr(explanations, "_call_gemini", lambda *_: ExplanationText(
        summary="Mom answered 47 scam calls this month, far more than average.",
        why_it_matters="Scam callers often rely on live conversations to build trust quickly.",
        next_steps=["Check that Scam Block is turned on."],
    ))
    r = client.get(f"/api/members/{MEMBER_A1}/recommendations/review_call_protection/explanation", headers=auth())
    assert r.json()["source"] == "fallback"


def test_explanation_for_category_that_does_not_apply_is_404(client, events_repo):
    r = client.get(f"/api/members/{MEMBER_A1}/recommendations/maintain_current_practices/explanation", headers=auth())
    assert r.status_code == 404


def test_unknown_category_is_422(client, events_repo):
    assert client.get(f"/api/members/{MEMBER_A1}/recommendations/buy_stuff/explanation", headers=auth()).status_code == 422

