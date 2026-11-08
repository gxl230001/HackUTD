"""Human-readable labels shared by insights, recommendations and API responses."""

CATEGORY_LABELS = {
    "bank_impersonation": "Bank impersonation",
    "car_warranty": "Car warranty",
    "government_impersonation": "Government impersonation",
    "utility_shutoff": "Utility shutoff",
    "delivery": "Package delivery",
    "medicare_benefits": "Medicare / benefits",
    "tech_support": "Tech support",
    "family_emergency": "Family emergency",
    "prize_lottery": "Prize or lottery",
    "job_offer": "Job offer",
    "crypto_investment": "Crypto investment",
    "toll_payment": "Unpaid toll",
}


def category_label(key: str | None) -> str:
    if not key:
        return "Uncategorized"
    return CATEGORY_LABELS.get(key, key.replace("_", " ").capitalize())


def plural(n: int, singular: str, plural_form: str | None = None) -> str:
    return f"{n} {singular if n == 1 else (plural_form or singular + 's')}"
