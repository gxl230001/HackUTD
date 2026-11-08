from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.analytics import PeriodInfo

Category = Literal[
    "review_call_protection",
    "explore_additional_protection",
    "scam_awareness_education",
    "encourage_reporting",
    "maintain_current_practices",
]


class Evidence(BaseModel):
    key: str
    label: str
    value: str  # display value, e.g. "6 of 8"


class Feature(BaseModel):
    name: str
    description: str


class Recommendation(BaseModel):
    category: Category
    title: str
    reasons: list[str]
    evidence: list[Evidence]
    summary: str
    why_it_matters: str
    next_steps: list[str]
    features: list[Feature]
    mentions_premium: bool


class MemberRecommendations(BaseModel):
    member_id: UUID
    member_name: str
    period: PeriodInfo
    recommendations: list[Recommendation]
    disclaimer: str


class ExplanationText(BaseModel):
    """What the AI is allowed to produce. Validated before it reaches the client."""

    summary: str = Field(min_length=20, max_length=500)
    why_it_matters: str = Field(min_length=20, max_length=500)
    next_steps: list[str] = Field(min_length=1, max_length=2)


class Explanation(BaseModel):
    member_id: UUID
    member_name: str
    period: PeriodInfo
    category: Category
    title: str
    source: Literal["ai", "fallback"]
    model: str | None
    summary: str
    why_it_matters: str
    next_steps: list[str]
    evidence: list[Evidence]
    features: list[Feature]
