from datetime import timedelta
from uuid import uuid4

from app.integrations.capabilities import ALL_SIGNALS
from app.services.metrics import compute_metrics, compute_trends
from app.services.periods import build_window
from tests.factories import NOW, blocked, message, reached, reported, returned

M = uuid4()


def test_exposure_excludes_call_backs_and_reports():
    events = [blocked(M), blocked(M), reached(M, "answered"), reached(M), returned(M), reported(M)]
    m = compute_metrics(events, ALL_SIGNALS)
    assert m.calls_received.value == 4  # 2 blocked + 2 reached; call-back and report are not exposure
    assert m.calls_blocked.value == 2
    assert m.calls_reached_device.value == 2
    assert m.calls_answered.value == 1
    assert m.calls_returned.value == 1
    assert m.numbers_reported.value == 1
    assert m.interactions.value == 2
    assert m.block_share.value == 0.5


def test_unanswered_call_is_not_blocked():
    m = compute_metrics([reached(M, "not_answered")], ALL_SIGNALS)
    assert m.calls_blocked.value == 0
    assert m.calls_reached_device.value == 1


def test_duplicate_events_are_counted_once():
    event = blocked(M)
    m = compute_metrics([event, event, event], ALL_SIGNALS)
    assert m.calls_received.value == 1


def test_unavailable_signals_are_null_not_zero():
    m = compute_metrics([blocked(M), message(M)], frozenset({"calls", "blocked", "answered", "returned"}))
    assert m.messages_received.value is None and m.messages_received.status == "unavailable"
    assert m.messages_replied.value is None
    assert m.numbers_reported.value is None
    assert m.calls_received.value == 1  # message never counts as a call


def test_nothing_available_means_everything_unavailable():
    m = compute_metrics([], frozenset())
    assert all(getattr(m, f).value is None for f in ("calls_received", "calls_blocked", "interactions"))
    assert m.block_share.value is None


def test_zero_denominator_rate_is_null():
    m = compute_metrics([], ALL_SIGNALS)
    assert m.calls_received.value == 0
    assert m.block_share.value is None
    assert m.answered_share_of_reached.value is None


def test_replies_count_as_interactions():
    m = compute_metrics([message(M, "replied"), message(M)], ALL_SIGNALS)
    assert m.messages_received.value == 2
    assert m.interactions.value == 1


def test_trend_buckets_sum_to_period_total_and_exclude_outside_window():
    window = build_window("7d", "UTC", NOW)
    inside = [blocked(M, days_ago=d) for d in (0.1, 1, 2, 6)]
    outside = [blocked(M, days_ago=8), blocked(M, days_ago=30)]
    points = compute_trends(inside + outside, window, ALL_SIGNALS)
    assert len(points) == 7
    assert sum(p.calls_received for p in points) == 4


def test_weekly_buckets_for_90_days_cover_window():
    window = build_window("90d", "America/Chicago", NOW)
    assert window.bucket_days == 7
    assert window.buckets[0].start_date == window.start_date
    assert window.buckets[-1].end_date == window.today + timedelta(days=1)
    assert sum((b.end_date - b.start_date).days for b in window.buckets) == 90
