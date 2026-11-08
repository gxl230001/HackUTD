from datetime import date, datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel

from app.schemas.family import Member


class Metric(BaseModel):
    """A count that is either known or explicitly unavailable (never a fake zero)."""

    value: int | None
    status: Literal["available", "unavailable"]


class Rate(BaseModel):
    """numerator / denominator. value is null when unavailable or the denominator is 0."""

    value: float | None
    numerator: int | None
    denominator: int | None


class MemberMetrics(BaseModel):
    # Exposure
    calls_received: Metric
    messages_received: Metric
    # Protection activity
    calls_blocked: Metric
    calls_reached_device: Metric
    numbers_reported: Metric
    # Suspicious interactions (observed activity, not proof of harm)
    calls_answered: Metric
    calls_returned: Metric
    messages_replied: Metric
    interactions: Metric
    block_share: Rate
    answered_share_of_reached: Rate


class PeriodInfo(BaseModel):
    key: str
    days: int
    start: datetime
    end: datetime
    timezone: str
    bucket_days: int


class DataSource(BaseModel):
    source: str
    label: str
    status: Literal["active", "not_connected"]


class TrendPoint(BaseModel):
    start_date: date
    end_date: date  # exclusive
    calls_received: int | None
    calls_blocked: int | None
    interactions: int | None
    numbers_reported: int | None


class RecentEvent(BaseModel):
    id: UUID
    member_id: UUID
    member_name: str
    event_type: str
    interaction_type: str | None
    scam_category: str | None
    scam_category_label: str | None
    timestamp: datetime
    source: str


class MemberComparison(BaseModel):
    member: Member
    metrics: MemberMetrics


class DashboardSummary(BaseModel):
    period: PeriodInfo
    data_sources: list[DataSource]
    totals: MemberMetrics
    members: list[MemberComparison]
    recent_activity: list[RecentEvent]


class Trends(BaseModel):
    period: PeriodInfo
    points: list[TrendPoint]


class Observation(BaseModel):
    key: str
    text: str


class ProtectionBehavior(BaseModel):
    key: str
    label: str
    observed: bool | None  # None = data unavailable
    detail: str


class MemberInsights(BaseModel):
    member: Member
    period: PeriodInfo
    data_sources: list[DataSource]
    metrics: MemberMetrics
    trends: list[TrendPoint]
    patterns: list[Observation]
    protection_behaviors: list[ProtectionBehavior]
