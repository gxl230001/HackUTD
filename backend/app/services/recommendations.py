"""Deterministic recommendation engine.

Categories are chosen by fixed rules over computed metrics (see app/rules.py).
The AI layer may only reword a category's explanation; it never chooses or
changes categories or numbers.
"""

from dataclasses import dataclass

from app.rules import THRESHOLDS
from app.schemas.analytics import MemberMetrics
from app.schemas.recommendations import Evidence, Feature, Recommendation

DISCLAIMER = (
    "Recommendations are based on simulated activity and demo thresholds. Answering or returning a "
    "suspicious call does not mean someone was scammed."
)

SCAM_ID = Feature(name="Scam ID", description="Labels likely scam calls as “Scam Likely” so they’re easy to spot before answering.")
SCAM_BLOCK = Feature(name="Scam Block", description="When turned on, stops calls identified as likely scams at the network level, before the phone rings.")
REPORTING = Feature(name="Scam reporting", description="Report suspicious numbers in the T-Mobile Scam Shield app to help improve scam detection.")
PREMIUM = Feature(
    name="Scam Shield Premium",
    description="A paid tier with additional protection features. Check T-Mobile for current features, pricing, and whether your plan already includes it.",
)


@dataclass(frozen=True)
class RuleInputs:
    metrics: MemberMetrics
    days: int
    interaction_weeks: int  # of the last 6 weeks

    def per_30d(self, value: int | None) -> float | None:
        return None if value is None else value * 30 / self.days


def _v(metric) -> int:
    return metric.value or 0


def _evidence(inputs: RuleInputs, *keys: str) -> list[Evidence]:
    m = inputs.metrics
    available = {
        "calls_received": ("Suspicious calls received", m.calls_received.value, None),
        "calls_blocked": ("Blocked before ringing", m.calls_blocked.value, m.calls_received.value),
        "calls_answered": ("Labeled calls answered", m.calls_answered.value, m.calls_reached_device.value),
        "calls_returned": ("Call-backs to suspicious numbers", m.calls_returned.value, None),
        "numbers_reported": ("Numbers reported", m.numbers_reported.value, None),
        "interactions": ("Suspicious interactions", m.interactions.value, None),
        "messages_received": ("Suspicious messages", m.messages_received.value, None),
    }
    out: list[Evidence] = []
    for key in keys:
        if key == "interaction_weeks":
            out.append(Evidence(key=key, label="Weeks with interactions", value=f"{inputs.interaction_weeks} of last 6"))
            continue
        label, value, of = available[key]
        if value is None:
            out.append(Evidence(key=key, label=label, value="Data unavailable"))
        else:
            out.append(Evidence(key=key, label=label, value=f"{value} of {of}" if of else str(value)))
    return out


def evaluate(inputs: RuleInputs, member_name: str) -> list[Recommendation]:
    t = THRESHOLDS
    m = inputs.metrics
    period = f"the last {inputs.days} days"
    recs: list[Recommendation] = []

    answered, returned = m.calls_answered.value, m.calls_returned.value
    if answered is not None and returned is not None and (
        (inputs.per_30d(answered + returned) or 0) >= t["review_min_answered_plus_returned_per_30d"]
        or returned >= t["review_min_returned"]
    ):
        recs.append(Recommendation(
            category="review_call_protection",
            title="Review call protection settings",
            reasons=[f"{member_name} answered {answered} labeled scam calls and called back {returned} suspicious numbers in {period}."],
            evidence=_evidence(inputs, "calls_answered", "calls_returned", "calls_blocked"),
            summary=f"{member_name} has been answering or returning calls that were labeled as likely scams. Reviewing call protection settings together can reduce how often these calls get through.",
            why_it_matters="Scam callers often rely on a live conversation or a call-back to build trust. Fewer of these calls reaching the phone means fewer chances for pressure tactics.",
            next_steps=[
                "Check that Scam Block is turned on for this line in the T-Mobile Scam Shield app.",
                "Talk through common tactics, like urgent requests or callers asking for codes or payment, and agree it’s okay to hang up and call back on a known number.",
            ],
            features=[SCAM_BLOCK, SCAM_ID],
            mentions_premium=False,
        ))

    share = m.block_share.value
    if inputs.interaction_weeks >= t["explore_min_interaction_weeks"] and share is not None and share < t["explore_max_block_share"]:
        recs.append(Recommendation(
            category="explore_additional_protection",
            title="Explore additional protection options",
            reasons=[
                f"Suspicious interactions were observed in {inputs.interaction_weeks} of the last 6 weeks.",
                f"Only {_v(m.calls_blocked)} of {_v(m.calls_received)} suspicious calls were blocked in {period}.",
            ],
            evidence=_evidence(inputs, "interaction_weeks", "calls_blocked", "interactions"),
            summary=f"{member_name}’s suspicious interactions are recurring week to week, and most suspicious calls are still reaching the phone. Additional protection options may help close that gap.",
            why_it_matters="Recurring exposure combined with calls getting through suggests current settings may not be catching enough. More filtering means fewer opportunities for scammers to make contact.",
            next_steps=[
                "Confirm Scam Block is on, then compare the extra features in Scam Shield Premium if it isn’t already part of your plan.",
                "Revisit this view in a few weeks to see whether interactions decrease.",
            ],
            features=[SCAM_BLOCK, PREMIUM],
            mentions_premium=True,
        ))

    exposure, interactions = inputs.per_30d(m.calls_received.value), inputs.per_30d(m.interactions.value)
    if exposure is not None and interactions is not None and (
        exposure >= t["awareness_min_exposure_per_30d"] and interactions <= t["awareness_max_interactions_per_30d"]
    ):
        recs.append(Recommendation(
            category="scam_awareness_education",
            title="Keep scam awareness sharp",
            reasons=[f"{member_name} received {_v(m.calls_received)} suspicious calls in {period} but had only {_v(m.interactions)} suspicious interactions."],
            evidence=_evidence(inputs, "calls_received", "calls_blocked", "interactions"),
            summary=f"{member_name} is targeted often but rarely engages with suspicious calls. Staying aware of new scam tactics helps keep it that way.",
            why_it_matters="High exposure means more attempts, and scam scripts change over time. Knowing the latest tactics makes it easier to recognize a new approach.",
            next_steps=[
                f"Share a quick rundown of the most common scam types {member_name} is seeing.",
                "Keep letting “Scam Likely” calls go to voicemail.",
            ],
            features=[SCAM_ID, REPORTING],
            mentions_premium=False,
        ))

    if m.calls_received.value is not None and m.numbers_reported.value is not None and (
        m.calls_received.value >= t["reporting_min_exposure"] and m.numbers_reported.value == 0
    ):
        recs.append(Recommendation(
            category="encourage_reporting",
            title="Try reporting suspicious numbers",
            reasons=[f"{member_name} received {m.calls_received.value} suspicious calls in {period} and reported none."],
            evidence=_evidence(inputs, "calls_received", "numbers_reported"),
            summary=f"{member_name} hasn’t reported any of the suspicious numbers that reached them. Reporting takes a few seconds and helps protect others.",
            why_it_matters="Reports help improve scam detection for everyone, including the rest of your family.",
            next_steps=["Show how to report a number from the T-Mobile Scam Shield app after a suspicious call."],
            features=[REPORTING],
            mentions_premium=False,
        ))

    if not recs:
        recs.append(Recommendation(
            category="maintain_current_practices",
            title="Current habits look protective",
            reasons=[f"No rule flagged additional action for {member_name} in {period}."],
            evidence=_evidence(inputs, "calls_received", "calls_blocked", "numbers_reported", "interactions"),
            summary=f"{member_name}’s observed activity shows protective habits, like blocking and reporting suspicious numbers. No extra steps are suggested right now.",
            why_it_matters="Consistent habits are one of the best defenses against scams, and they’re worth recognizing.",
            next_steps=["Keep reporting suspicious numbers and check back if activity changes."],
            features=[REPORTING, SCAM_BLOCK],
            mentions_premium=False,
        ))
    return recs
