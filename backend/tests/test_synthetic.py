from collections import Counter
from datetime import UTC, datetime

from app.domain import ScamEvent
from app.integrations.synthetic import PROFILES, generate_family_events

ANCHOR = datetime(2026, 11, 8, 18, 0, tzinfo=UTC)
MEMBERS = {"mom": "00000000-0000-0000-0000-000000000001", "grandpa": "00000000-0000-0000-0000-000000000002",
           "daughter": "00000000-0000-0000-0000-000000000003"}


def rows():
    return generate_family_events(MEMBERS, ANCHOR)


def test_deterministic():
    assert rows() == rows()


def test_all_records_are_marked_synthetic():
    assert all(r["source"] == "synthetic_demo" and r["metadata"]["synthetic"] is True for r in rows())


def test_ids_and_external_refs_are_unique():
    data = rows()
    assert len({r["id"] for r in data}) == len(data)
    assert len({r["metadata"]["external_ref"] for r in data}) == len(data)


def test_timestamps_within_90_days_before_anchor():
    for r in rows():
        ts = datetime.fromisoformat(r["timestamp"])
        assert ts < ANCHOR
        assert (ANCHOR - ts).days < 91


def test_blocked_calls_have_no_other_interaction():
    for r in rows():
        assert (r["event_type"] == "blocked_call") == (r["interaction_type"] == "blocked")


def test_call_backs_and_reports_link_to_an_earlier_reached_call():
    data = rows()
    by_id = {r["id"]: r for r in data}
    for r in data:
        if r["interaction_type"] in ("returned", "reported"):
            original = by_id[r["metadata"]["related_event_id"]]
            assert original["event_type"] == "scam_likely_call"
            assert original["metadata"]["direction"] == "inbound"
            assert original["family_member_id"] == r["family_member_id"]
            assert original["timestamp"] <= r["timestamp"]


def test_exact_counts_per_profile():
    events = [ScamEvent.from_row(r) for r in rows()]
    for key, profile in PROFILES.items():
        mine = [e for e in events if str(e.member_id) == MEMBERS[key]]
        c = Counter((e.event_type, e.interaction_type) for e in mine)
        assert c[("blocked_call", "blocked")] == 3 * profile.blocked
        assert c[("scam_likely_call", "answered")] == 3 * profile.answered
        assert c[("scam_likely_call", "returned")] == 3 * profile.returned
        assert c[("reported_number", "reported")] == 3 * profile.reported
