# y2pilot.com

Smart YouTube playlist manager app.

[Live app](https://y2pilot.com)

I decided to share this as open source even though it's far from a solid and clean codebase. It was developed over a long stretch of time, in my spare time and as a first experimental project.

Other than that, it works! It's functional. You can create and save Youtube playlists and have fun with it.

In case you decide to tamper with it, fork it, extend it or submit a PR don't hesitate to reach out and ask questions.

## Local setup

This is a pnpm workspace with two apps:

- `apps/web` — React + Vite frontend
- `apps/worker` — Cloudflare Worker backend (KV-backed)

### Prerequisites

- Node.js 20+
- pnpm 9+

### 1. Install dependencies

```
pnpm install
```

### 2. Configure the web app

```
cp apps/web/.env.local-example apps/web/.env.local
```

The default `VITE_WORKER_URL=http://localhost:8787` matches the local worker.

### 3. Configure the worker

```
cp apps/worker/wrangler.toml-example apps/worker/wrangler.toml
```

For local dev the placeholder KV IDs are fine — Miniflare emulates KV in memory. Replace them with real IDs only before deploying:

```
pnpm --filter @y2pilot/worker exec wrangler kv namespace create VIDEOS
pnpm --filter @y2pilot/worker exec wrangler kv namespace create PLAYLISTS
```

### 4. Run dev servers

Both apps in parallel:

```
pnpm dev:all
```

Or individually:

```
pnpm dev          # web on http://localhost:5173
pnpm worker:dev   # worker on http://localhost:8787
```

## Other scripts

```
pnpm build           # build web
pnpm worker:build    # dry-run build worker
pnpm worker:deploy   # deploy worker to Cloudflare
```
