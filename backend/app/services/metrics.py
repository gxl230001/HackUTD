"""Deterministic metric aggregation. Pure functions over normalized events.

Rules:
- Each event is counted at most once (deduplicated by id).
- Exposure (calls received) = blocked calls + labeled calls that reached the
  phone. Outbound call-backs and reports are never counted as exposure.
- A metric whose signal is not provided by an active source is "unavailable",
  never zero.
"""

from collections.abc import Iterable

from app.domain import ScamEvent
from app.schemas.analytics import Metric, MemberMetrics, Rate, TrendPoint
from app.services.periods import Window


def dedupe(events: Iterable[ScamEvent]) -> list[ScamEvent]:
    seen: set = set()
    unique: list[ScamEvent] = []
    for event in events:
        if event.id not in seen:
            seen.add(event.id)
            unique.append(event)
    return unique


def _metric(value: int, available: bool) -> Metric:
    return Metric(value=value, status="available") if available else Metric(value=None, status="unavailable")


def _rate(numerator: Metric, denominator: Metric) -> Rate:
    if numerator.value is None or denominator.value is None:
        return Rate(value=None, numerator=numerator.value, denominator=denominator.value)
    value = round(numerator.value / denominator.value, 3) if denominator.value else None
    return Rate(value=value, numerator=numerator.value, denominator=denominator.value)


def compute_metrics(events: Iterable[ScamEvent], signals: frozenset[str]) -> MemberMetrics:
    events = dedupe(events)
    has_calls = "calls" in signals
    count = lambda predicate: sum(1 for e in events if predicate(e))  # noqa: E731

    received = _metric(count(lambda e: e.is_inbound_call), has_calls and "blocked" in signals)
    reached = _metric(count(lambda e: e.is_reached_call), has_calls)
    blocked = _metric(count(lambda e: e.is_blocked_call), "blocked" in signals)
    answered = _metric(count(lambda e: e.is_answered), has_calls and "answered" in signals)
    returned = _metric(count(lambda e: e.is_returned), has_calls and "returned" in signals)
    reported = _metric(count(lambda e: e.is_report), "reported" in signals)
    messages = _metric(count(lambda e: e.is_message), "messages" in signals)
    replied = _metric(count(lambda e: e.is_reply), "messages" in signals)

    # Interactions sum whichever interaction signals are available; unavailable
    # only if none of them are.
    parts = [m for m in (answered, returned, replied) if m.value is not None]
    interactions = Metric(value=sum(m.value for m in parts), status="available") if parts else Metric(value=None, status="unavailable")  # type: ignore[misc]

    return MemberMetrics(
        calls_received=received,
        messages_received=messages,
        calls_blocked=blocked,
        calls_reached_device=reached,
        numbers_reported=reported,
        calls_answered=answered,
        calls_returned=returned,
        messages_replied=replied,
        interactions=interactions,
        block_share=_rate(blocked, received),
        answered_share_of_reached=_rate(answered, reached),
    )


def compute_trends(events: Iterable[ScamEvent], window: Window, signals: frozenset[str]) -> list[TrendPoint]:
    events = [e for e in dedupe(events) if window.contains(e.timestamp)]
    buckets: list[list[ScamEvent]] = [[] for _ in window.buckets]
    for event in events:
        index = window.bucket_index(event.timestamp)
        if index is not None:
            buckets[index].append(event)

    points: list[TrendPoint] = []
    for bucket, bucket_events in zip(window.buckets, buckets):
        m = compute_metrics(bucket_events, signals)
        points.append(TrendPoint(
            start_date=bucket.start_date,
            end_date=bucket.end_date,
            calls_received=m.calls_received.value,
            calls_blocked=m.calls_blocked.value,
            interactions=m.interactions.value,
            numbers_reported=m.numbers_reported.value,
        ))
    return points
