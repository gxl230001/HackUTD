"""Assembles dashboard, trend and member-insight responses from repositories."""

from datetime import datetime
from uuid import UUID

from app.domain import ScamEvent
from app.integrations.capabilities import available_signals, data_sources
from app.repositories.events import EventRepository
from app.repositories.families import FamilyRepository
from app.schemas.analytics import (
    DashboardSummary, DataSource, MemberComparison, MemberInsights, PeriodInfo, RecentEvent, Trends,
)
from app.schemas.family import Member
from app.services import family as family_service
from app.services.insights import build_patterns, build_protection_behaviors, lookback_start
from app.services.labels import category_label
from app.services.metrics import compute_metrics, compute_trends, dedupe
from app.services.periods import Window, build_window

RECENT_LIMIT = 10


def period_info(window: Window) -> PeriodInfo:
    return PeriodInfo(key=window.period, days=window.days, start=window.start, end=window.end,
                      timezone=window.tz.key, bucket_days=window.bucket_days)


def _sources() -> list[DataSource]:
    return [DataSource.model_validate(s) for s in data_sources()]


def _family_events(family: FamilyRepository, events: EventRepository, family_id: UUID,
                   start: datetime, end: datetime) -> tuple[list[Member], list[ScamEvent]]:
    members = family_service.list_members(family, family_id)
    return members, dedupe(events.list_events([m.id for m in members], start, end))


def dashboard_summary(family: FamilyRepository, events: EventRepository, family_id: UUID,
                      period: str, tz: str | None, now: datetime | None = None) -> DashboardSummary:
    window = build_window(period, tz, now)
    signals = available_signals()
    members, all_events = _family_events(family, events, family_id, window.start, window.end)
    names = {m.id: m.display_name for m in members}

    recent = sorted(all_events, key=lambda e: e.timestamp, reverse=True)[:RECENT_LIMIT]
    return DashboardSummary(
        period=period_info(window),
        data_sources=_sources(),
        totals=compute_metrics(all_events, signals),
        members=[
            MemberComparison(member=m, metrics=compute_metrics([e for e in all_events if e.member_id == m.id], signals))
            for m in members
        ],
        recent_activity=[
            RecentEvent(
                id=e.id, member_id=e.member_id, member_name=names.get(e.member_id, "Unknown"),
                event_type=e.event_type, interaction_type=e.interaction_type,
                scam_category=e.scam_category, scam_category_label=category_label(e.scam_category) if e.scam_category else None,
                timestamp=e.timestamp, source=e.source,
            )
            for e in recent
        ],
    )


def dashboard_trends(family: FamilyRepository, events: EventRepository, family_id: UUID,
                     period: str, tz: str | None, now: datetime | None = None) -> Trends:
    window = build_window(period, tz, now)
    _, all_events = _family_events(family, events, family_id, window.start, window.end)
    return Trends(period=period_info(window), points=compute_trends(all_events, window, available_signals()))


def member_events(family: FamilyRepository, events: EventRepository, family_id: UUID, member_id: UUID,
                  window: Window) -> tuple[Member, list[ScamEvent], list[ScamEvent]]:
    """Returns (member, events in the period, events in the insight lookback)."""
    member = family_service.get_member(family, family_id, member_id)  # raises NotFoundError
    lookback = dedupe(events.list_events([member.id], lookback_start(window), window.end))
    in_period = [e for e in lookback if window.contains(e.timestamp)]
    return member, in_period, lookback


def member_insights(family: FamilyRepository, events: EventRepository, family_id: UUID, member_id: UUID,
                    period: str, tz: str | None, now: datetime | None = None) -> MemberInsights:
    window = build_window(period, tz, now)
    signals = available_signals()
    member, in_period, lookback = member_events(family, events, family_id, member_id, window)
    metrics = compute_metrics(in_period, signals)
    return MemberInsights(
        member=member,
        period=period_info(window),
        data_sources=_sources(),
        metrics=metrics,
        trends=compute_trends(in_period, window, signals),
        patterns=build_patterns(in_period, lookback, metrics, window),
        protection_behaviors=build_protection_behaviors(metrics),
    )
