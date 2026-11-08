"""Seed the CloseGuard demo account, family and members.

Phase 1 scope: creates (or reuses) the demo auth user, one fictional family,
three fictional members, and the profile linking the user to the family.
It does NOT create scam events.

Idempotent: fixed UUIDs + upserts, so it is safe to run repeatedly.

    cd backend && .venv/bin/python -m scripts.seed_demo
"""

import os
import sys
from pathlib import Path
from uuid import UUID, uuid5

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.config import get_settings  # noqa: E402
from app.db import get_supabase  # noqa: E402

NAMESPACE = UUID("6f1c2b7e-0d4a-4c3e-9a51-3c1e2f0a9b10")
FAMILY_ID = uuid5(NAMESPACE, "family:demo")

FAMILY = {"id": str(FAMILY_ID), "name": "The Rivera Family (Demo)"}
# Fictional people. Phone labels are made up and not real numbers.
MEMBERS = [
    {"key": "mom", "display_name": "Mom", "relationship": "Parent", "phone_label": "Ending in 0142"},
    {"key": "grandpa", "display_name": "Grandpa", "relationship": "Grandparent", "phone_label": "Ending in 0177"},
    {"key": "daughter", "display_name": "Daughter", "relationship": "Child", "phone_label": "Ending in 0193"},
]


def _env(name: str) -> str:
    value = os.environ.get(name) or _dotenv().get(name, "")
    if not value:
        sys.exit(f"Missing {name}. Set it in backend/.env or the environment.")
    return value


def _dotenv() -> dict[str, str]:
    path = Path(__file__).resolve().parents[1] / ".env"
    if not path.exists():
        return {}
    pairs = {}
    for line in path.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            key, _, value = line.partition("=")
            pairs[key.strip()] = value.strip().strip('"').strip("'")
    return pairs


def _find_user_id(db, email: str) -> str | None:
    page = 1
    while True:
        users = db.auth.admin.list_users(page=page, per_page=200)
        for user in users:
            if (user.email or "").lower() == email.lower():
                return user.id
        if len(users) < 200:
            return None
        page += 1


def main() -> None:
    if not get_settings().supabase_configured:
        sys.exit("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env first.")
    db = get_supabase()
    email = _env("DEMO_USER_EMAIL")
    password = _env("DEMO_USER_PASSWORD")
    if len(password) < 12:
        sys.exit("DEMO_USER_PASSWORD must be at least 12 characters.")

    user_id = _find_user_id(db, email)
    if user_id is None:
        created = db.auth.admin.create_user({"email": email, "password": password, "email_confirm": True})
        user_id = created.user.id
        print(f"Created demo user {email}")
    else:
        db.auth.admin.update_user_by_id(user_id, {"password": password})
        print(f"Reusing demo user {email} (password reset to DEMO_USER_PASSWORD)")

    db.table("families").upsert(FAMILY).execute()
    db.table("family_members").upsert(
        [
            {
                "id": str(uuid5(NAMESPACE, f"member:{m['key']}")),
                "family_id": str(FAMILY_ID),
                "display_name": m["display_name"],
                "relationship": m["relationship"],
                "phone_label": m["phone_label"],
            }
            for m in MEMBERS
        ]
    ).execute()
    db.table("profiles").upsert(
        {"id": user_id, "family_id": str(FAMILY_ID), "display_name": "Demo account holder"}
    ).execute()

    print(f"Seeded family '{FAMILY['name']}' with {len(MEMBERS)} members.")


if __name__ == "__main__":
    main()
