# CloseGuard

**Protection is stronger together.**

CloseGuard is a family scam-awareness dashboard that complements T-Mobile Scam
Shield. It turns individual scam-protection signals into family-level insight
for the plan's account holder.

> **Demo disclosure:** CloseGuard is a hackathon prototype. It is **not
> connected** to T-Mobile Scam Shield or any T-Mobile account. All families,
> members and activity are fictional, synthetic demo data.

## Status

| Phase | Scope | State |
|---|---|---|
| 1 | Skeleton, auth, schema | ✅ Done |
| 2 | Synthetic data, analytics, dashboard, recommendations, Gemini explanations | Not started |
| 3 | Polish, edge cases, PWA, docs | Not started |

## Architecture

```
frontend/  React + Vite + TypeScript, Tailwind v4, shadcn/ui, React Router
           Supabase is used for sign-in only; all data comes from the backend.
backend/   FastAPI + Pydantic. Verifies Supabase JWTs, scopes every query to the
           signed-in user's family, owns all business logic.
           app/api/routes → app/services → app/repositories → Supabase
supabase/  SQL migrations (Postgres schema + RLS)
```

- The browser never reads tables directly. RLS is enabled on every table with
  no client policies; the backend uses the service-role key and enforces
  family ownership itself.
- A member outside your family returns `404` (it does not reveal that it exists).

## Prerequisites

- Node 20+ and npm
- Python 3.12+
- A Supabase project (free tier is fine)

## 1. Supabase setup

1. Create a project at <https://supabase.com>.
2. **SQL editor →** paste and run [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql).
3. **Authentication → Sign In / Providers:** keep **Email** enabled and turn
   **off** "Allow new users to sign up". The demo account is created by the
   seed script.
4. **Project Settings → API (keys):** note the project URL, the anon /
   publishable key (frontend) and the service_role / secret key (backend only).
5. **JWT keys:** if your project uses JWT signing keys (the default for new
   projects), nothing else is needed. If it still uses the legacy JWT secret,
   copy it into `SUPABASE_JWT_SECRET`.

## 2. Backend

```bash
cd backend
python3 -m venv .venv
.venv/bin/pip install -r requirements-dev.txt
cp .env.example .env        # then fill in values
.venv/bin/python -m scripts.seed_demo   # creates demo user, family, members
.venv/bin/uvicorn app.main:app --reload --port 8000
```

API docs: <http://localhost:8000/docs> · Health: <http://localhost:8000/api/health>

Tests: `.venv/bin/python -m pytest`

## 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env        # then fill in values
npm run dev                  # http://localhost:5173
```

Sign in with `DEMO_USER_EMAIL` / `DEMO_USER_PASSWORD` from `backend/.env`.

## Environment variables

**backend/.env**

| Variable | Required | Notes |
|---|---|---|
| `SUPABASE_URL` | yes | `https://<ref>.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | service_role / secret key. **Never** expose to the browser. |
| `SUPABASE_JWT_SECRET` | legacy only | Only for projects using the legacy HS256 secret |
| `CORS_ORIGINS` | yes | Comma-separated, e.g. `http://localhost:5173` |
| `LOG_LEVEL` | no | Default `INFO` |
| `DEMO_USER_EMAIL`, `DEMO_USER_PASSWORD` | seed only | Demo account created by `scripts/seed_demo.py` (password ≥ 12 chars) |

**frontend/.env** (public values only — everything `VITE_*` ships to the browser)

| Variable | Notes |
|---|---|
| `VITE_API_BASE_URL` | Backend URL, default `http://localhost:8000` |
| `VITE_SUPABASE_URL` | Same project URL |
| `VITE_SUPABASE_ANON_KEY` | anon / publishable key |

## API (Phase 1)

All routes except health require `Authorization: Bearer <supabase access token>`.

| Method | Path | Returns |
|---|---|---|
| GET | `/api/health` | `{status, database}` |
| GET | `/api/family` | `{id, name, member_count}` |
| GET | `/api/members` | `[{id, display_name, relationship, phone_label}]` |
| GET | `/api/members/{member_id}` | one member, or `404` if not in your family |

## Event model

`scam_events` stores one row per real-world activity so counts are never
inflated:

| Activity | `event_type` / `interaction_type` |
|---|---|
| Call stopped at the network | `blocked_call` / `blocked` |
| Scam Likely call reached the phone | `scam_likely_call` / `answered`, `not_answered` or `unknown` |
| Member called the number back | `scam_likely_call` / `returned` (`metadata.direction = "outbound"`, `metadata.related_event_id`) |
| Member reported the number | `reported_number` / `reported` |
| Suspicious text | `suspicious_message` / `replied` or `unknown` |

`source` is one of `synthetic_demo`, `authorized_external_integration`,
`user_submitted`. An unanswered call is never recorded as blocked.
