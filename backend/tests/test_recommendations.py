from datetime import timedelta
from uuid import UUID

import pytest

from app.domain import ScamEvent
from app.integrations.capabilities import ALL_SIGNALS
from app.integrations.synthetic import generate_family_events
from app.schemas.recommendations import ExplanationText
from app.services.explanations import build_payload, validate_output
from app.services.insights import interaction_weeks
from app.services.metrics import compute_metrics
from app.services.periods import build_window
from app.services.recommendations import RuleInputs, evaluate
from tests.factories import NOW
from tests.test_synthetic import MEMBERS


def categories_for(key: str, days_after_seed: int = 0, period: str = "30d") -> list[str]:
    now = NOW + timedelta(days=days_after_seed)
    events = [ScamEvent.from_row(r) for r in generate_family_events(MEMBERS, NOW)]
    mine = [e for e in events if e.member_id == UUID(MEMBERS[key])]
    window = build_window(period, "America/Chicago", now)
    in_period = [e for e in mine if window.contains(e.timestamp)]
    inputs = RuleInputs(compute_metrics(in_period, ALL_SIGNALS), window.days, interaction_weeks(mine, now))
    return [r.category for r in evaluate(inputs, key.title())]


@pytest.mark.parametrize("lag", [0, 3])
@pytest.mark.parametrize("period", ["30d", "90d"])
def test_persona_recommendations(lag, period):
    assert categories_for("mom", lag, period) == ["scam_awareness_education"]
    grandpa = categories_for("grandpa", lag, period)
    assert grandpa[:2] == ["review_call_protection", "explore_additional_protection"]
    assert categories_for("daughter", lag, period) == ["maintain_current_practices"]


def test_premium_only_in_explore_category():
    events = [ScamEvent.from_row(r) for r in generate_family_events(MEMBERS, NOW)]
    for key in MEMBERS:
        mine = [e for e in events if e.member_id == UUID(MEMBERS[key])]
        window = build_window("30d", "UTC", NOW)
        inputs = RuleInputs(compute_metrics([e for e in mine if window.contains(e.timestamp)], ALL_SIGNALS), 30, interaction_weeks(mine, NOW))
        for rec in evaluate(inputs, key):
            assert rec.mentions_premium == (rec.category == "explore_additional_protection")
            if not rec.mentions_premium:
                assert "premium" not in (rec.summary + " ".join(rec.next_steps)).lower()


def test_high_volume_alone_never_suggests_premium():
    from tests.factories import blocked, reached
    m = UUID(int=1)
    events = [blocked(m, days_ago=d % 29) for d in range(80)] + [reached(m, days_ago=1)]
    inputs = RuleInputs(compute_metrics(events, ALL_SIGNALS), 30, interaction_weeks(events, NOW))
    assert all(not r.mentions_premium for r in evaluate(inputs, "Test"))


def test_unavailable_metrics_do_not_trigger_rules():
    inputs = RuleInputs(compute_metrics([], frozenset()), 30, 0)
    assert [r.category for r in evaluate(inputs, "Test")] == ["maintain_current_practices"]


# --- AI output validation -----------------------------------------------------

def _payload(premium=False):
    events = [ScamEvent.from_row(r) for r in generate_family_events(MEMBERS, NOW)]
    grandpa = [e for e in events if e.member_id == UUID(MEMBERS["grandpa"])]
    window = build_window("30d", "UTC", NOW)
    inputs = RuleInputs(compute_metrics([e for e in grandpa if window.contains(e.timestamp)], ALL_SIGNALS), 30, interaction_weeks(grandpa, NOW))
    rec = next(r for r in evaluate(inputs, "Grandpa") if r.mentions_premium == premium)
    return rec, build_payload(rec, "Grandpa", 30)


def _text(summary, why="Fewer of these calls reaching the phone means fewer chances for pressure tactics.", steps=("Check that Scam Block is turned on.",)):
    return ExplanationText(summary=summary, why_it_matters=why, next_steps=list(steps))


def test_valid_output_passes():
    rec, payload = _payload()
    answered = next(e.value for e in rec.evidence if e.key == "calls_answered").split(" of ")[0]
    assert validate_output(_text(f"Grandpa answered {answered} calls labeled as likely scams recently."), payload) is None


def test_invented_number_rejected():
    _, payload = _payload()
    assert "numbers" in validate_output(_text("Grandpa answered 9999 calls labeled as likely scams."), payload)


@pytest.mark.parametrize("phrase", ["Grandpa was scammed last week by a caller.", "Grandpa may have fallen victim to a caller.",
                                    "Grandpa seems confused by these calls lately.", "Grandpa lost money to a scam caller."])
def test_harmful_claims_rejected(phrase):
    _, payload = _payload()
    assert validate_output(_text(phrase), payload) is not None


def test_premium_mention_rejected_when_not_allowed():
    _, payload = _payload(premium=False)
    assert "Premium" in validate_output(_text("Grandpa should consider Scam Shield Premium for better coverage."), payload)


def test_premium_mention_allowed_for_explore_category():
    _, payload = _payload(premium=True)
    assert validate_output(_text("Grandpa could compare Scam Shield Premium if it isn’t already part of your plan."), payload) is None
