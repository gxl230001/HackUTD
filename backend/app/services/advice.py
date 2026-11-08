"""Member recommendations and their explanations."""

from datetime import datetime
from uuid import UUID

from app.config import Settings
from app.integrations.capabilities import available_signals
from app.rules import MIN_EVALUATION_PERIOD
from app.repositories.events import EventRepository
from app.repositories.families import FamilyRepository
from app.schemas.recommendations import Explanation, MemberRecommendations
from app.services import explanations
from app.services.analytics import member_events, period_info
from app.services.family import NotFoundError
from app.services.insights import interaction_weeks
from app.services.metrics import compute_metrics
from app.services.periods import PERIOD_DAYS, build_window
from app.services.recommendations import DISCLAIMER, RuleInputs, evaluate


def member_recommendations(family: FamilyRepository, events: EventRepository, family_id: UUID, member_id: UUID,
                           period: str, tz: str | None, now: datetime | None = None) -> MemberRecommendations:
    build_window(period, tz, now)  # validates the requested period
    if PERIOD_DAYS[period] < PERIOD_DAYS[MIN_EVALUATION_PERIOD]:
        period = MIN_EVALUATION_PERIOD
    window = build_window(period, tz, now)
    member, in_period, lookback = member_events(family, events, family_id, member_id, window)
    inputs = RuleInputs(
        metrics=compute_metrics(in_period, available_signals()),
        days=window.days,
        interaction_weeks=interaction_weeks(lookback, window.end),
    )
    return MemberRecommendations(
        member_id=member.id,
        member_name=member.display_name,
        period=period_info(window),
        recommendations=evaluate(inputs, member.display_name),
        disclaimer=DISCLAIMER,
    )


def explain(settings: Settings, family: FamilyRepository, events: EventRepository, family_id: UUID, member_id: UUID,
            category: str, period: str, tz: str | None, now: datetime | None = None) -> Explanation:
    recs = member_recommendations(family, events, family_id, member_id, period, tz, now)
    rec = next((r for r in recs.recommendations if r.category == category), None)
    if rec is None:
        raise NotFoundError("That recommendation doesn’t apply to this member for the selected period.")

    ai = explanations.generate(settings, rec, str(recs.member_id), recs.member_name, recs.period.key, recs.period.days)
    return Explanation(
        member_id=recs.member_id,
        member_name=recs.member_name,
        period=recs.period,
        category=rec.category,
        title=rec.title,
        source="ai" if ai else "fallback",
        model=settings.gemini_model if ai else None,
        summary=ai.summary if ai else rec.summary,
        why_it_matters=ai.why_it_matters if ai else rec.why_it_matters,
        next_steps=ai.next_steps if ai else rec.next_steps,
        evidence=rec.evidence,
        features=rec.features,
    )
