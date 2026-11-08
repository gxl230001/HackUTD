"""Deterministic, non-judgmental observations about one member's activity.

Everything here describes *observed* activity. Nothing infers that a member was
scammed, lost money, or behaved carelessly.
"""

from collections import Counter
from datetime import datetime, timedelta

from app.domain import ScamEvent
from app.schemas.analytics import MemberMetrics, Observation, ProtectionBehavior
from app.services.labels import category_label, plural
from app.services.periods import Window

RECURRENCE_WEEKS = 6
MIN_EVENTS_FOR_TIME_PATTERN = 5


def _time_of_day(hour: int) -> str:
    if 5 <= hour < 12:
        return "morning"
    if 12 <= hour < 17:
        return "afternoon"
    if 17 <= hour < 22:
        return "evening"
    return "overnight"


def interaction_weeks(events: list[ScamEvent], now: datetime, weeks: int = RECURRENCE_WEEKS) -> int:
    """Number of the last `weeks` 7-day spans (ending now) containing a suspicious interaction."""
    hit: set[int] = set()
    for e in events:
        if e.is_answered or e.is_returned or e.is_reply:
            age_days = (now - e.timestamp).total_seconds() / 86400
            if 0 <= age_days < weeks * 7:
                hit.add(int(age_days // 7))
    return len(hit)


def build_patterns(period_events: list[ScamEvent], recent_events: list[ScamEvent], metrics: MemberMetrics,
                   window: Window) -> list[Observation]:
    patterns: list[Observation] = []
    exposure = [e for e in period_events if e.is_inbound_call or e.is_message]

    categories = Counter(e.scam_category for e in exposure if e.scam_category)
    if categories:
        top, n = categories.most_common(1)[0]
        patterns.append(Observation(
            key="top_category",
            text=f"Most common scam type: {category_label(top)} ({n} of {plural(len(exposure), 'suspicious call or message', 'suspicious calls and messages')}).",
        ))

    calls = [e for e in period_events if e.is_inbound_call]
    if len(calls) >= MIN_EVENTS_FOR_TIME_PATTERN:
        slots = Counter(_time_of_day(e.timestamp.astimezone(window.tz).hour) for e in calls)
        slot, n = slots.most_common(1)[0]
        patterns.append(Observation(key="peak_time", text=f"Suspicious calls most often arrive in the {slot} ({n} of {len(calls)})."))

    weeks = interaction_weeks(recent_events, window.end)
    if weeks:
        patterns.append(Observation(
            key="recurring_interactions",
            text=f"Suspicious interactions were observed in {weeks} of the last {RECURRENCE_WEEKS} weeks.",
        ))
    elif metrics.interactions.value is not None:
        patterns.append(Observation(key="recurring_interactions", text=f"No suspicious interactions were observed in the last {RECURRENCE_WEEKS} weeks."))

    returned = metrics.calls_returned.value
    if returned:
        patterns.append(Observation(
            key="call_backs",
            text=f"Called back {plural(returned, 'number')} labeled as a likely scam. A call-back alone doesn’t mean anything was shared.",
        ))
    return patterns


def build_protection_behaviors(metrics: MemberMetrics) -> list[ProtectionBehavior]:
    m = metrics
    behaviors: list[ProtectionBehavior] = []

    if m.calls_blocked.value is None or m.calls_received.value is None:
        behaviors.append(ProtectionBehavior(key="network_blocking", label="Network scam blocking", observed=None, detail="Data unavailable"))
    else:
        behaviors.append(ProtectionBehavior(
            key="network_blocking", label="Network scam blocking",
            observed=m.calls_blocked.value > 0,
            detail=(f"{m.calls_blocked.value} of {m.calls_received.value} suspicious calls were blocked before reaching the phone."
                    if m.calls_received.value else "No suspicious calls in this period."),
        ))

    if m.calls_answered.value is None or m.calls_reached_device.value is None:
        behaviors.append(ProtectionBehavior(key="unanswered_labeled_calls", label="Letting labeled calls go unanswered", observed=None, detail="Data unavailable"))
    elif m.calls_reached_device.value == 0:
        behaviors.append(ProtectionBehavior(key="unanswered_labeled_calls", label="Letting labeled calls go unanswered", observed=None, detail="No labeled calls reached the phone in this period."))
    else:
        not_answered = m.calls_reached_device.value - m.calls_answered.value
        behaviors.append(ProtectionBehavior(
            key="unanswered_labeled_calls", label="Letting labeled calls go unanswered",
            observed=m.calls_answered.value <= m.calls_reached_device.value * 0.25,
            detail=f"{not_answered} of {m.calls_reached_device.value} Scam Likely calls that reached the phone were not answered.",
        ))

    if m.calls_returned.value is None:
        behaviors.append(ProtectionBehavior(key="no_call_backs", label="Not calling back suspicious numbers", observed=None, detail="Data unavailable"))
    else:
        behaviors.append(ProtectionBehavior(
            key="no_call_backs", label="Not calling back suspicious numbers",
            observed=m.calls_returned.value == 0,
            detail="No call-backs to numbers labeled as likely scams." if m.calls_returned.value == 0
            else f"{plural(m.calls_returned.value, 'call-back')} to numbers labeled as likely scams.",
        ))

    if m.numbers_reported.value is None:
        behaviors.append(ProtectionBehavior(key="reporting", label="Reporting suspicious numbers", observed=None, detail="Data unavailable"))
    else:
        behaviors.append(ProtectionBehavior(
            key="reporting", label="Reporting suspicious numbers",
            observed=m.numbers_reported.value > 0,
            detail=f"Reported {plural(m.numbers_reported.value, 'suspicious number')}." if m.numbers_reported.value
            else "No reports in this period.",
        ))
    return behaviors


def lookback_start(window: Window) -> datetime:
    """Insights need at least RECURRENCE_WEEKS of history regardless of the selected period."""
    return min(window.start, window.end - timedelta(weeks=RECURRENCE_WEEKS))
