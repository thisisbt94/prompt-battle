# Prompt Battle

**Same AI. Better Question.**

A live conference activity: two people each write their own instruction
to the same AI for the same challenge. The app runs both through ILMU,
shows the two answers side by side, and an AI judge decides which
*prompt* produced the more useful answer — teaching the lesson that
better context + a clearer objective + useful constraints = a better
AI response.

Built with Next.js (App Router) + TypeScript + Tailwind CSS. The frontend
never sees an API key — every AI call goes through this app's own backend
(`app/api/*`), which is the only code that touches `N8N_*` / `ILMU_*`
secrets.

## How a round works

- **Host screen** (`/battle/a` or `/battle/b`) — lives on the booth
  tablet or TV. Staff pick a challenge here; it then shows the challenge,
  a countdown, and each player's live status (waiting to join / typing /
  submitted), plus a QR code per player.
- **Player screen** (`/play/a/A`, `/play/a/B`, etc.) — each person scans
  their own QR code on their own phone. They see only their own prompt
  box — never the other player's — and submit from there.
- Once both submit, both devices show a clean "Asking ILMU…" state, then
  the host screen (and each player's phone) shows the full result:
  both prompts, both answers, the judge's scores, and the lesson.

Two independent stations (`a` and `b`) can run at once and never share
state — a third `/display` page can go on a TV above the booth showing
both stations' live status without revealing prompts until a round ends
(and only if the organiser has opted into that).

---

## 1. Run it locally

```bash
npm install
cp .env.example .env.local     # then fill in the values you need (see below)
npm run dev
```

Open:

- `http://localhost:3000/` — a launcher page with links to everything below
- `http://localhost:3000/battle/a` — Battle Station A (host screen)
- `http://localhost:3000/battle/b` — Battle Station B (host screen)
- `http://localhost:3000/play/a/A` and `/play/a/B` — the two players' own screens for Station A
- `http://localhost:3000/display` — central display (for the TV)
- `http://localhost:3000/admin` — admin panel (password = `ADMIN_PASSWORD`)

To try the full experience with **zero credentials**, set `DEMO_MODE=true`
in `.env.local`. Every AI call is mocked — good for rehearsing the flow,
testing devices, or demoing to organisers before ILMU access is sorted
out. **Never leave `DEMO_MODE=true` for the live event** — the admin
panel shows a clear "Demo mode: ON" notice so it's obvious if someone
forgot to turn it off.

Locally, with no Redis configured, the app quietly falls back to an
in-memory store — fine for testing solo in one browser, but a second
tab/device won't reliably see the same state. To actually test the
multi-device flow (host + two phones) locally, set up the Redis vars
too (see section 3).

---

## 2. Where to add ILMU credentials

All secrets live in environment variables — never in the frontend code.

### Option A — direct ILMU API (simplest — recommended for the event)

```
AI_PROVIDER=ilmu
ILMU_API_URL=https://api.ilmu.ai/v1
ILMU_API_KEY=<ILMU API key>
ILMU_MODEL=ilmu-v3.1
```

The backend calls `${ILMU_API_URL}/chat/completions` directly
(OpenAI-compatible, bearer auth). Fewer moving parts than the n8n
option — nothing to activate or keep in sync, just one env var to get
right.

### Option B — through n8n (matches your existing ILMU stack)

```
AI_PROVIDER=n8n
N8N_WEBHOOK_URL=https://btym-wflow.shop/webhook/prompt-battle
N8N_SHARED_SECRET=<whatever you paste into the Config node below>
```

**Importable workflow: [`n8n/Prompt_Battle_ILMU_Webhook.json`](./n8n/Prompt_Battle_ILMU_Webhook.json)**

Import it into n8n (Import from File). It's a Webhook trigger that checks
the `x-agent-token` header, routes on `action` (`generate` / `judge` /
`health`), calls ILMU with the same judge rubric as the direct-ILMU path,
and responds with `{ "success": true, "response": "<text or JSON string>" }`.

After importing, edit the **"Config (edit me)"** node (values live
directly in the node — no `$env` access needed):

1. `sharedSecret` — must exactly match `N8N_SHARED_SECRET` above (a
   trailing space or mismatched value is the #1 cause of "We couldn't
   reach ILMU" errors — check the workflow's Executions tab if you hit
   this; it'll show the run stopped at the "Unauthorized" node).
2. `ilmuApiKey` — your real ILMU API key.

Then activate the workflow and copy its **production** webhook URL
(not the `/webhook-test/...` one, which only fires once per manual
click) into `N8N_WEBHOOK_URL`.

You can flip between the two providers any time from **Admin -> Settings
-> AI provider** — no redeploy needed.

---

## 3. Shared state store (required for real multi-device play)

This app now has multiple devices talking to it at once — the host
screen, two players' phones, the TV display, and admin. On Vercel, each
of those requests can land on a different serverless instance, so plain
in-memory state (fine for a single long-running server) isn't reliable
here — a submission can "disappear," or the host and a player's phone
can disagree about what round is running.

Fix: connect a small free Redis instance.

1. In the Vercel dashboard, open your project → **Storage** (or
   **Marketplace**) → find **Upstash for Redis** → **Connect**.
2. Follow its prompts to create a free database and link it to this
   project. Vercel automatically injects `KV_REST_API_URL` and
   `KV_REST_API_TOKEN` (or `UPSTASH_REDIS_REST_URL`/`_TOKEN` — the app
   checks both) into your project's environment — you don't type these
   in yourself.
3. Redeploy once after connecting it.

You'll know it worked because the red "No persistent store connected"
banner disappears from `/admin`. **Do this before the event** — it's the
difference between the booth working reliably and state randomly
resetting mid-round.

---

## 4. Required environment variables

| Variable | Required for | Notes |
|---|---|---|
| `DEMO_MODE` | always | `true`/`false`. Mocked answers vs. live calls. |
| `AI_PROVIDER` | always | `ilmu` or `n8n`. Can be changed live from `/admin`. |
| `ILMU_API_URL` | `AI_PROVIDER=ilmu` | Defaults to `https://api.ilmu.ai/v1`. |
| `ILMU_API_KEY` | `AI_PROVIDER=ilmu` | ILMU bearer token. |
| `ILMU_MODEL` | `AI_PROVIDER=ilmu` | Defaults to `ilmu-v3.1`. |
| `N8N_WEBHOOK_URL` | `AI_PROVIDER=n8n` | Your n8n webhook URL. |
| `N8N_SHARED_SECRET` | `AI_PROVIDER=n8n` | Sent as `x-agent-token`; must match the workflow's Config node. |
| `KV_REST_API_URL` / `KV_REST_API_TOKEN` | multi-device play | Auto-injected by Vercel's Upstash integration — see section 3. |
| `ADMIN_PASSWORD` | always | Gate for `/admin`. Change the default. |

---

## 5. Test the ILMU connection

1. Set your env vars (or leave `DEMO_MODE=true` to test the UI only).
2. Open `/admin`, log in, and look at the status dot next to the logo —
   click it to force a fresh check.
   - Green dot = **online** (responded in under ~6s)
   - Amber dot = **slow**
   - Red dot = **offline** (the label next to the dot names the error)
3. Or hit the endpoint directly:
   ```bash
   curl -X POST http://localhost:3000/api/health
   ```
4. Run one real battle: open `/battle/a` (host), scan or open the two
   `/play/a/A` and `/play/a/B` links (e.g. on two phones, or two browser
   tabs for a quick solo test), pick a challenge on the host screen,
   type + submit on both player screens, and watch it resolve into a
   real result on all three screens.

If it fails, the UI shows "We couldn't reach ILMU just now. Try again."
and never fabricates a response — check the terminal running `npm run
dev` (or Vercel's function logs) for the underlying error.

---

## 6. Deploy

Any Next.js host works; Vercel is the easiest match. Because the app now
depends on a real shared store (section 3) rather than one long-running
process, this deploys cleanly as normal Vercel serverless functions —
no special "single instance" requirement anymore.

```bash
npm run build
npm run start          # serves on port 3000 by default, for non-Vercel hosts
```

Set all the env vars from section 4 on your host, plus connect Redis
per section 3.

---

## 7. Open Battle A and Battle B at the same time

They're separate URLs and never share state:

- **Host** (booth tablet/TV): `https://<your-domain>/battle/a` and `/battle/b`
- **Players**: nobody types a URL by hand — the host screen shows a QR
  code per player that opens their private `/play/a/A`, `/play/a/B` (or
  `/play/b/A`, `/play/b/B`) link on their own phone.

Bookmark each host screen full-screen (e.g. "Add to Home Screen" on
iPad, or a kiosk-mode browser) so staff only ever see the host flow.
Resetting or replaying one station never touches the other.

---

## 8. Put the central display on a television

Open `https://<your-domain>/display` on any browser connected to the TV.
It polls every 2 seconds and shows both stations' live status (joined /
typing / submitted, per player). It never shows a prompt or answer
before both players at that station have submitted, and only shows
results at all if **Admin -> Settings -> "Public display shows results"**
is turned on.

---

## 9. Admin panel

`/admin` (password-gated via `ADMIN_PASSWORD`) lets organisers, without
touching code:

- Add / edit / enable / disable challenges, across all 6 categories
- Set the battle duration (default 60s)
- Turn AI judging on/off
- Switch `AI_PROVIDER` between `ilmu` and `n8n`
- Turn the public display's result-reveal on/off
- Reset Battle A or Battle B independently
- See today's battle count, average battle duration, the most popular
  challenge, and recent lessons the judge has surfaced
- **Browse recent rounds' full transcripts** — both prompts, both
  answers, and the judge's verdict, expandable per round — and
  **export all of it as JSON** for reviewing how people actually
  prompted after the event
- A warning banner if no persistent store (section 3) is connected yet

---

## Project structure

```
app/
  page.tsx                     launcher (links to A / B / display / admin)
  battle/[id]/page.tsx         host screen (id = "a" | "b")
  play/[id]/[player]/page.tsx  each player's own screen (player = "a" | "b")
  display/page.tsx             central TV display
  admin/page.tsx               admin panel
  api/
    battle/[id]/route.ts       battle state machine (select/join/submit/retry/reset)
    challenges/route.ts        public challenge list
    display/route.ts           redacted feed for the TV
    health/route.ts            ILMU connection check
    admin/route.ts             config + dashboard stats + transcripts (auth required)
    admin/challenges/route.ts  challenge CRUD (auth required)
lib/
  aiProvider.ts    the ONLY file that knows about n8n / ILMU secrets
  battleEngine.ts  orchestrates generate -> judge once both players submit
  store.ts         Redis-backed session/config/challenge/log store (in-memory fallback for local dev)
  redis.ts         thin Upstash Redis client wrapper
  challenges.ts    seed challenge set
  types.ts         shared types
components/
  screens/         attract, select, host-waiting, player-battle, player-waiting, thinking, result, error
  BattleApp.tsx    host controller — polls battle state, renders host screens
  PlayerApp.tsx    player controller — polls battle state, renders that player's own screens
  QRCode.tsx       locally-generated QR codes (no external network call)
  ...              shared UI primitives
n8n/
  Prompt_Battle_ILMU_Webhook.json  importable n8n workflow (Option B)
```
