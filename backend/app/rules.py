"""Recommendation thresholds.

These are DEMO HEURISTICS chosen to illustrate the product, not scientifically
validated cut-offs. Rates are normalized to a 30-day equivalent so the same
thresholds apply to every reporting period. Recommendations always look at
no less than MIN_EVALUATION_PERIOD so one quiet or busy week doesn't swing
them. Adjust freely.
"""

THRESHOLDS = {
    # scam_awareness_education: lots of exposure, few interactions
    "awareness_min_exposure_per_30d": 15,
    "awareness_max_interactions_per_30d": 3,
    # review_call_protection: repeated interactions, or any call-back
    "review_min_answered_plus_returned_per_30d": 3,
    "review_min_returned": 1,
    # explore_additional_protection: recurring interactions AND a protection gap
    "explore_min_interaction_weeks": 3,  # of the last 6 weeks
    "explore_max_block_share": 0.5,
    # encourage_reporting: steady exposure, no reports
    "reporting_min_exposure": 5,
}

# Shorter selected periods are evaluated over this period instead.
MIN_EVALUATION_PERIOD = "30d"
