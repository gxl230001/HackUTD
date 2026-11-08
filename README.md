# Owlert

**Stay Alert with Owlert.**

Owlert is a family scam-awareness dashboard that complements T-Mobile Scam
Shield. It turns individual scam-protection signals into family-level insight
for the plan's account holder.

> **Demo disclosure:** Owlert is a hackathon prototype. It is **not
> connected** to T-Mobile Scam Shield or any T-Mobile account. All families,
> members and activity are fictional, synthetic demo data.

## Status

| Phase | Scope | State |
|---|---|---|
| 1 | Skeleton, auth, schema | ✅ Done |
| 2 | Synthetic data, analytics, dashboard, recommendations, Gemini explanations | ✅ Done |
| 3 | Polish, edge cases, PWA, docs | ✅ Done |

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
.venv/bin/python -m scripts.seed_demo   # demo user, family, members + 90 days of synthetic events
.venv/bin/uvicorn app.main:app --reload --reload-dir app --port 8000
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

Production build: `npm run build` (output in `frontend/dist`), preview with
`npm run preview`. The service worker only runs in the production build.

## Before a demo

1. Re-run the seed so the last 7/30 days are populated:
   `cd backend && .venv/bin/python -m scripts.seed_demo`
2. If the backend is on Render's free tier, open `<backend-url>/api/health`
   about a minute beforehand. Idle services take ~50 s to wake up.
3. With a Gemini key, open each recommendation once to warm the cache
   (explanations are cached for 6 hours per member, period and metrics).

## Environment variables

**backend/.env**

| Variable | Required | Notes |
|---|---|---|
| `SUPABASE_URL` | yes | `https://<ref>.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | service_role / secret key. **Never** expose to the browser. |
| `SUPABASE_JWT_SECRET` | legacy only | Only for projects using the legacy HS256 secret |
| `CORS_ORIGINS` | yes | Comma-separated, e.g. `http://localhost:5173` |
| `LOG_LEVEL` | no | Default `INFO` |
| `GEMINI_API_KEY` | no | API key from your Google Gemini / Cloud project (listed at <https://aistudio.google.com/apikey>). `GOOGLE_API_KEY` is also accepted. Without it, fallback explanations are used. |
| `GEMINI_USE_VERTEXAI` | no | Default `false`. Set `true` only for a key created under **Vertex AI** in the Cloud console |
| `GEMINI_MODEL` | no | Default `gemini-3.5-flash`; try `gemini-3.5-flash-lite` if you hit free-tier limits |
| `GEMINI_TIMEOUT_SECONDS` | no | Default `10` (Google's minimum); after this the fallback explanation is used |
| `GEMINI_THINKING_LEVEL` | no | Default `minimal` (fastest, saves quota); leave empty for the model default |

Check a Gemini key end to end (uses one request of quota):
`cd backend && .venv/bin/python -m scripts.check_gemini`
| `DEMO_USER_EMAIL`, `DEMO_USER_PASSWORD` | seed only | Demo account created by `scripts/seed_demo.py` (password ≥ 12 chars) |

**frontend/.env** (public values only — everything `VITE_*` ships to the browser)

| Variable | Notes |
|---|---|
| `VITE_API_BASE_URL` | Backend URL, default `http://localhost:8000` |
| `VITE_SUPABASE_URL` | Same project URL |
| `VITE_SUPABASE_ANON_KEY` | anon / publishable key |

## API

All routes except health require `Authorization: Bearer <supabase access token>`.

| Method | Path | Returns |
|---|---|---|
| GET | `/api/health` | `{status, database}` |
| GET | `/api/family` | `{id, name, member_count}` |
| GET | `/api/members` | `[{id, display_name, relationship, phone_label}]` |
| GET | `/api/members/{member_id}` | one member, or `404` if not in your family |
| GET | `/api/dashboard/summary?period&tz` | family totals, per-member comparison, 10 most recent events, data sources |
| GET | `/api/dashboard/trends?period&tz` | family time series (daily for 7d/30d, weekly for 90d) |
| GET | `/api/members/{id}/insights?period&tz` | member metrics, trend, observed patterns, protection behaviors |
| GET | `/api/members/{id}/recommendations?period&tz` | rule-based recommendations with supporting evidence |
| GET | `/api/members/{id}/recommendations/{category}/explanation?period&tz` | Gemini-worded explanation, or the deterministic fallback |

`period` is `7d`, `30d` (default) or `90d`. `tz` is an IANA timezone (e.g.
`America/Chicago`) used for day boundaries; default UTC. Invalid values return `422`.

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

## Synthetic demo data

`scripts/seed_demo.py` generates 90 days of fictional activity ending when it
runs (re-run it before a demo so the recent periods stay populated). It is
deterministic: exact counts per 30-day block, seeded random timing.

| Member | Per 30 days |
|---|---|
| Mom | 30 suspicious calls (18 blocked), 2 answered, 1 reported, 3 texts |
| Grandpa | 8 suspicious calls (2 blocked), 5 answered, 3 call-backs, 2 texts (1 reply) |
| Daughter | 10 suspicious calls (5 blocked), 1 answered, 4 reported, 6 texts |

## Analytics

All calculations run in the backend (`app/services/metrics.py`) over
normalized events, deduplicated by id:

- **Suspicious calls (exposure)** = blocked calls + labeled calls that reached the phone. Call-backs and reports are never exposure.
- **Blocked share** = blocked ÷ suspicious calls (null, shown as “—”, when there were none).
- **Suspicious interactions** = answered labeled calls + call-backs + message replies. These are observed activity, not evidence of harm.
- A metric whose signal no active source provides is returned as `{"value": null, "status": "unavailable"}`, never `0` (`app/integrations/capabilities.py`).

## Recommendations

`app/services/recommendations.py` applies fixed rules with thresholds in
`app/rules.py` (**demo heuristics, not validated science**). Rates are
normalized per 30 days, and periods shorter than 30 days are evaluated over
30 days.

| Category | When |
|---|---|
| Review call protection | ≥ 3 answered + returned calls per 30 days, or any call-back |
| Explore additional protection | interactions in ≥ 3 of the last 6 weeks **and** < 50% of suspicious calls blocked. The only category that mentions Scam Shield Premium. |
| Keep scam awareness sharp | ≥ 15 suspicious calls and ≤ 3 interactions per 30 days |
| Try reporting | ≥ 5 suspicious calls and no reports |
| Current habits look protective | none of the above |

**Gemini** (`app/services/explanations.py`) only rewords the chosen
recommendation. It receives the category, its supporting metrics, the period
and the member's display name — no events or phone labels. Output must match a
JSON schema and is rejected (falling back to the deterministic text) if it
contains a number not in the input, claims harm or blames the member, or
mentions Premium when the rule doesn't allow it. Results are cached for 6 hours,
and only the explanation endpoint ever calls Gemini.

## Failure behavior

| Situation | What the user sees |
|---|---|
| Backend unreachable | “Can’t reach the Owlert server” with **Try again**; sign-in page shows *Server unreachable* |
| Database error | `503` → “The data service is unavailable” with **Try again** (internals logged, never returned) |
| Unexpected server error | `500` → “Something went wrong on our side” (logged with an `X-Request-ID`) |
| Session expired or revoked | Backend `401` → signed out locally → sign-in page says “Your session ended” |
| Supabase signing keys unreachable | `503` (not `401`, so users are not signed out by an outage) |
| Account with no linked family | `403` → “No family is linked to this account yet” |
| Invalid period, timezone or id | `422` with a readable `detail` message |
| Member or recommendation outside your family / not applicable | `404` → “not found / not available” |
| Gemini missing, slow (10 s), rate-limited, blocked or invalid | Deterministic explanation, badge “Standard explanation” |
| A screen crashes or a stale chunk fails after a deploy | Recovery page with **Reload** |
| Browser offline | Banner: “You’re offline” |
| Metric not provided by any connected source | “Data unavailable” (never `0`) |
| No activity in a period | Charts and lists show an explicit empty state |

## Installable app (PWA)

The production build registers a service worker (vite-plugin-pwa) that caches
the app shell only — API responses are never cached, so activity is always
fresh or clearly unavailable. On Android/Chrome use **Install app**; on iOS
Safari use **Share → Add to Home Screen**. The app opens to `/dashboard`.

## Deployment

**Supabase** — already set up by the steps above; nothing extra for production.

**Backend → Render** (Web Service)

| Setting | Value |
|---|---|
| Root directory | `backend` |
| Runtime | Python (version from `backend/.python-version`) |
| Build command | `pip install -r requirements.txt` |
| Start command | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| Health check path | `/api/health` |
| Environment | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `CORS_ORIGINS=https://<your-app>.vercel.app`, optional `GEMINI_API_KEY`, `GEMINI_MODEL`, `GEMINI_USE_VERTEXAI` |

Run the seed script from your machine (it only needs `backend/.env`); it does
not need to run on Render.

**Frontend → Vercel**

| Setting | Value |
|---|---|
| Root directory | `frontend` |
| Framework preset | Vite |
| Environment | `VITE_API_BASE_URL=https://<your-backend>.onrender.com`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` |

`frontend/vercel.json` rewrites every path to `index.html` so deep links like
`/members/<id>` work, and serves `sw.js` uncached so updates roll out.

After both are live, set `CORS_ORIGINS` on Render to the exact Vercel URL
(comma-separate multiple origins, no trailing slash).

## Future T-Mobile integration boundary

Owlert is built so a real, **authorized** data source can replace the
synthetic generator without touching analytics or UI:

1. Implement an ingestion job that normalizes upstream records into
   `scam_events` rows with `source = 'authorized_external_integration'`, one
   row per activity, a stable `metadata.external_ref` (the unique index
   rejects duplicates) and `related_event_id` for call-backs/reports.
2. Declare which signals that source actually provides in
   `backend/app/integrations/capabilities.py` and add it to `ACTIVE_SOURCES`.
   Anything it does not provide is shown as “Data unavailable”.
3. Analytics (`app/services/metrics.py`) consume the normalized
   `ScamEvent` model only, so no other code changes.

This requires documented authorization and API access from T-Mobile; none
exists today and nothing in this repo claims otherwise.

## Limitations

- All data is synthetic. Patterns are designed to be illustrative, not representative.
- Recommendation thresholds are demo heuristics, not validated research.
- “Answered” and “returned” are observed activity only; Owlert cannot know
  what was said or whether anything was shared.
- Scam Shield feature descriptions are general; check T-Mobile for current
  features, pricing and plan inclusion. Owlert cannot change settings.
- Single account-holder role; members do not sign in.
- Gemini free tier has low rate limits; the cache and fallback cover this.
- `npm audit` reports moderate advisories in build-time tooling
  (workbox-build, the shadcn CLI); none of that code ships to the browser.
