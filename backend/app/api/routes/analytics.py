from collections.abc import Callable
from typing import Annotated, TypeVar
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.config import Settings, get_settings
from app.deps import Events, FamilyId, Repo
from app.schemas.analytics import DashboardSummary, MemberInsights, Trends
from app.schemas.recommendations import Category, Explanation, MemberRecommendations
from app.services import advice, analytics
from app.services.family import NotFoundError
from app.services.periods import DEFAULT_PERIOD, InvalidPeriodError

router = APIRouter(tags=["analytics"])

Period = Annotated[str, Query(description="Reporting period: 7d, 30d or 90d")]
Tz = Annotated[str | None, Query(max_length=64, description="IANA timezone for day boundaries, e.g. America/Chicago")]
T = TypeVar("T")


def _run(fn: Callable[[], T]) -> T:
    try:
        return fn()
    except InvalidPeriodError as exc:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, str(exc)) from exc
    except NotFoundError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(exc)) from exc


@router.get("/dashboard/summary", response_model=DashboardSummary)
def dashboard_summary(family_id: FamilyId, repo: Repo, events: Events,
                      period: Period = DEFAULT_PERIOD, tz: Tz = None) -> DashboardSummary:
    return _run(lambda: analytics.dashboard_summary(repo, events, family_id, period, tz))


@router.get("/dashboard/trends", response_model=Trends)
def dashboard_trends(family_id: FamilyId, repo: Repo, events: Events,
                     period: Period = DEFAULT_PERIOD, tz: Tz = None) -> Trends:
    return _run(lambda: analytics.dashboard_trends(repo, events, family_id, period, tz))


@router.get("/members/{member_id}/insights", response_model=MemberInsights)
def member_insights(member_id: UUID, family_id: FamilyId, repo: Repo, events: Events,
                    period: Period = DEFAULT_PERIOD, tz: Tz = None) -> MemberInsights:
    return _run(lambda: analytics.member_insights(repo, events, family_id, member_id, period, tz))


@router.get("/members/{member_id}/recommendations", response_model=MemberRecommendations)
def member_recommendations(member_id: UUID, family_id: FamilyId, repo: Repo, events: Events,
                           period: Period = DEFAULT_PERIOD, tz: Tz = None) -> MemberRecommendations:
    return _run(lambda: advice.member_recommendations(repo, events, family_id, member_id, period, tz))


@router.get("/members/{member_id}/recommendations/{category}/explanation", response_model=Explanation)
def recommendation_explanation(member_id: UUID, category: Category, family_id: FamilyId, repo: Repo, events: Events,
                               settings: Annotated[Settings, Depends(get_settings)],
                               period: Period = DEFAULT_PERIOD, tz: Tz = None) -> Explanation:
    # The only endpoint that may call Gemini.
    return _run(lambda: advice.explain(settings, repo, events, family_id, member_id, category, period, tz))
