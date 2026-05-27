# LiveKit + OpenAI Realtime Playground

This project is an interactive playground that demonstrates the capabilities of OpenAI's Realtime API, allowing users to experiment with the API directly in their browser. It's built on top of LiveKit Agents.

See it in action at [realtime-playground.livekit.io](https://realtime-playground.livekit.io)

## Repository Structure

### /agent

This directory contains the agent implementation in build on the LiveKit [Python Agents framework](https://github.com/livekit/agents).

### /web

This directory houses the web frontend, built with Next.js.

## Prerequisites

- Python 3.9 or higher
- pip (Python package installer)
- LiveKit Cloud or self-hosted LiveKit server

## Getting Started

### Agent Setup

1. Navigate to the `/agent` directory
2. Copy the sample environment file: `cp .env.sample .env`
3. Open `.env` in a text editor and enter your LiveKit credentials
1. Create a virtual environment: `python -m venv .venv`
2. Activate the virtual environment:
   - On macOS and Linux: `source .venv/bin/activate`
   - On Windows: `.venv\Scripts\activate`
3. Install dependencies: `pip install -r requirements.txt`
4. Run the agent in development mode: `python main.py dev`

### Web Frontend Setup

1. Navigate to the `/web` directory
2. Copy the sample environment file: `cp .env.sample .env.local`
3. Open `.env.local` in a text editor and enter your LiveKit credentials:
4. Install dependencies: `pnpm install`
5. Run the development server: `pnpm dev`
6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Deployment

The app has two parts that deploy separately:

| Part | Where it runs | Platform |
|------|---------------|----------|
| **Web UI** (`/web`) | Next.js frontend + `/api/token` | **Vercel** |
| **Voice agent** (`/agent`) | Long-running Python worker | **LiveKit Cloud** (or Railway, Fly.io, etc.) |

Vercel only hosts the browser UI and token API. The Python agent must stay running elsewhere and connect to LiveKit Cloud.

### Deploy web to Vercel (exact steps)

#### 1. Push code to GitHub

Ensure your latest code is on GitHub (e.g. `https://github.com/kpqb/voicebot_poc`).

#### 2. Import the project in Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **Import** next to your `voicebot_poc` repository
3. On the **Configure Project** screen, set these values **before** clicking Deploy:

| Setting | Value |
|---------|-------|
| **Framework Preset** | Next.js (auto-detected) |
| **Root Directory** | `web` — click **Edit**, enter `web`, confirm |
| **Build Command** | `pnpm build` (default) |
| **Install Command** | `pnpm install` (default) |
| **Output Directory** | leave default (Next.js handles this) |

> **Critical:** Root Directory **must** be `web`. If you leave it as the repo root, Vercel detects the Python agent and fails with `No python entrypoint found`.

#### 3. Add environment variables

Still on the Configure screen (or later under **Settings → Environment Variables**), add:

| Name | Value | Environments |
|------|-------|--------------|
| `LIVEKIT_URL` | `wss://your-project.livekit.cloud` | Production, Preview, Development |
| `LIVEKIT_API_KEY` | Your LiveKit API key | Production, Preview, Development |
| `LIVEKIT_API_SECRET` | Your LiveKit API secret | Production, Preview, Development |

Use the same values as in `agent/.env` and `web/.env.local`.

Do **not** add `OPENAI_API_KEY` to Vercel — users enter it in the browser UI per session.

Optional analytics (leave unset if unused):

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog project key |
| `NEXT_PUBLIC_POSTHOG_HOST` | PostHog host URL |

#### 4. Deploy

Click **Deploy**. Vercel will:

1. `cd web && pnpm install`
2. `pnpm build`
3. Deploy the Next.js app

A successful build log ends with route output including `/` and `/api/token`.

#### 5. Verify the deployment

1. Open your Vercel URL (e.g. `https://voicebot-poc.vercel.app`)
2. Open browser DevTools → **Network**
3. Enter an OpenAI API key in the UI and click **Connect**
4. Confirm `POST /api/token` returns **200** with `{ accessToken, url }`

If `/api/token` returns **500** with a LiveKit env error, re-check step 3.

#### 6. Redeploy after env changes

**Settings → Environment Variables** → save → **Deployments → Redeploy** (env vars are baked in at build/runtime for server routes).

---

### Deploy the Python agent (required for voice to work)

The agent does **not** run on Vercel. Without it, the UI loads but no AI voice joins the room.

**Option A — Local (development / demos)**

```bash
cd agent
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # macOS/Linux
pip install -r requirements.txt
python main.py dev
```

Keep this terminal running while using the Vercel-hosted UI.

**Option B — LiveKit Cloud Agents (production)**

Follow [LiveKit Agents deployment](https://docs.livekit.io/agents/deployment/):

1. Build a container from `/agent` (Dockerfile or LiveKit CLI)
2. Set env vars: `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`
3. Deploy to LiveKit Cloud so a worker is always registered to your project

**Option C — Railway / Fly.io / Render**

Deploy `/agent` as a long-running service with the same env vars. The worker connects outbound to LiveKit — no inbound port forwarding needed.

---

### Deploy via Vercel CLI (alternative)

```bash
cd web
pnpm install
npx vercel link          # link to your Vercel project (root = web)
npx vercel env pull      # optional: pull env vars locally
npx vercel --prod
```

When linking, confirm the project Root Directory is `web`.

---

### Troubleshooting Vercel

| Error | Fix |
|-------|-----|
| `No python entrypoint found` | Set **Root Directory** to `web` |
| `LIVEKIT_* must be set` on `/api/token` | Add all three LiveKit env vars in Vercel |
| UI loads, no agent voice | Start or deploy the Python agent (see above) |
| Microphone blocked | Vercel serves HTTPS by default; allow mic in browser |
| Build fails on pnpm | Ensure `pnpm-lock.yaml` is committed in `/web` |

The agent can be deployed in a variety of ways: [Deployment & Scaling Guide](https://docs.livekit.io/agents/deployment/)

## Troubleshooting

Ensure the following:

- Both web and agent are running
- Environment variables are set up correctly
- Correct versions of Python and pnpm are installed

## Additional Resources

For more information or support, please refer to [LiveKit docs](https://docs.livekit.io/).

## License

Apache 2.0
