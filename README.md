# Scam Circle

**Protection is stronger together.**

Scam Circle is a mobile-first, installable web app (PWA). It helps people photograph or paste a suspicious text message, see a plain-language scam-risk assessment, and ask trusted family or friends for help before acting.

> Hackathon project (HackUTD), **not an official T-Mobile product**.

Layer 1 (this layer) is the UI shell only. **All data is mock data** (`src/lib/mock-data.ts`). No message is actually checked, nothing is sent anywhere, and there is no login.

## Prerequisites

- Node.js 20.9 or newer (`node -v`)
- npm

## Install

```bash
npm install
```

## Run

On this computer:

```bash
npm run dev
```

Then open http://localhost:3000.

### On your phone (same Wi-Fi)

1. Find your Mac's LAN IP address:

   ```bash
   ipconfig getifaddr en0
   ```

   (If that prints nothing, try `en1`.)

2. Start the dev server listening on your network, and allow that IP to load dev assets:

   ```bash
   ALLOWED_DEV_ORIGINS=$(ipconfig getifaddr en0) npm run dev:lan
   ```

   `npm run dev:lan` alone also works for loading pages, but Next.js blocks dev-only resources (like hot reload) for origins it doesn't know. `ALLOWED_DEV_ORIGINS` feeds `allowedDevOrigins` in `next.config.ts`, so no IP is hardcoded in the repo.

3. On the phone, open `http://<that-ip>:3000`.

**HTTPS note:** installing the app to the home screen as a PWA and service workers require HTTPS (localhost is the only exception). Over plain LAN HTTP the app works as a normal web page. Camera capture through a file input (`<input type="file" capture>`, coming in Layer 2) does work over LAN HTTP.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the dev server on localhost |
| `npm run dev:lan` | Start the dev server on all network interfaces (`-H 0.0.0.0`) |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check (`tsc --noEmit`) |

## Structure

```
src/
  app/
    layout.tsx            Root layout: metadata, viewport, theme color, toasts
    manifest.ts           Web app manifest (served at /manifest.webmanifest)
    icon.png              Favicon
    globals.css           Theme tokens (magenta primary, risk colors)
    (app)/
      layout.tsx          App shell: offline banner + bottom navigation
      page.tsx            Home dashboard
      scan/page.tsx       Check a message (photo / paste / examples)
      circle/page.tsx     Trusted circle, invite code, sharing preferences
      notifications/page.tsx  Alerts and help requests
  components/
    ui/                   shadcn/ui primitives
    bottom-nav.tsx, page-header.tsx, offline-banner.tsx,
    risk-badge.tsx, reason-list.tsx, safety-guidance.tsx, empty-state.tsx,
    scan-flow.tsx, circle-cards.tsx, notification-list.tsx
  lib/
    mock-data.ts          ALL mock data (replaced in later layers)
    utils.ts
public/icons/             Placeholder app icons (192, 512, maskable, apple-touch)
scripts/generate-icons.py Regenerates the placeholder icons (needs Python + Pillow)
```

## Layer status

- [x] **Layer 1** - Next.js PWA shell with mock UI
- [ ] Layer 2 - On-device text reading from photos (OCR)
- [ ] Layer 3 - Scam classifier service
- [ ] Layer 4 - Accounts and realtime (Supabase)
- [ ] Layer 5 - Trusted-circle features (real help requests and responses)
