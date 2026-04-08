# Recoding Exercise Platform

A web application for running controlled, monitored recoding exercises. Participants complete scenario-based questions in a timed session while the platform captures anti-cheat signals (paste events, tab focus loss, keystroke patterns) for instructor review.

## Stack

- **Framework**: Next.js 14 (App Router, TypeScript)
- **Database**: PostgreSQL via [Neon](https://neon.tech) — `@neondatabase/serverless`
- **Auth**: NextAuth.js v4 with credentials provider + bcrypt
- **Real-time**: Server-Sent Events (SSE)
- **Deployment**: Vercel

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env.local
```

| Variable | Description |
|---|---|
| `DATABASE_URL` | Neon PostgreSQL connection string (from your Neon dashboard) |
| `NEXTAUTH_SECRET` | Random secret for JWT signing — generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Base URL of the app, e.g. `http://localhost:3000` |

### 3. Set up the database

Run the schema against your Neon database:

```bash
psql $DATABASE_URL -f schema.sql
```

### 4. Seed exercises

```bash
npx tsx scripts/seed.ts
```

This inserts all 11 exercise slugs (`prompt-basics`, `prompt-patterns`, `ai-ethics`, `debug-control`, `ethical-ai`, `reasoning-flow`, `role-prompt`, `tool-prompts`, `go-reloaded`, `ascii-art`, `ascii-art-web`) with `enabled = false`.

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
app/
  api/                        # Route Handlers (backend)
    auth/[...nextauth]/       # NextAuth credentials provider
    exercises/                # Participant exercise + session APIs
    submissions/              # Autosave, final submit, restore
    events/                   # Anti-cheat event logging + SSE stream
    instructor/               # Instructor management APIs
  participant/                # Participant UI pages
  instructor/                 # Instructor UI pages
  login/                      # Login page
lib/
  db.ts                       # Neon SQL client
  questions.ts                # Loads question files from docs/
  flagging.ts                 # Auto-flagging logic
middleware.ts                 # RBAC enforcement
schema.sql                    # Database schema
scripts/seed.ts               # Exercise seed script
docs/                         # Exercise question files
```

## Roles

| Role | Access |
|---|---|
| `participant` | `/participant/*` — exercise catalogue, timed sessions |
| `instructor` | `/instructor/*` — exercise management, submission review, live monitor |

## Anti-Cheat Features

- **Paste detection** — logs every paste event with character count and timestamp
- **Tab/window focus monitoring** — records focus-loss duration; flags submissions exceeding the threshold
- **Keystroke capture** — records insert/delete edit events (no raw characters); flags submissions with fewer than 10 edits for responses over 200 characters
- **Typing replay** — instructors can replay the edit event sequence to see how a response was constructed

## Instructor Tools

- Enable/disable exercises and configure session timing
- Assign participants to exercises
- View all submissions with flag indicators
- Full submission detail: response text, autosave history, paste events, focus events, typing replay
- Add review notes per submission
- Export submissions as CSV or JSON
- Live monitor via SSE stream showing real-time anti-cheat events
