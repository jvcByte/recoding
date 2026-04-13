# Recoding — Exercise Platform

A controlled environment for running timed coding and writing exercises with live anti-cheat monitoring.

---

## What is this?

Recoding is a web platform where instructors assign exercises to participants, set time limits, and monitor activity in real time. Participants complete written or coding exercises in a browser-based editor. Every keystroke, paste, and focus loss is recorded. When time runs out, everything is saved automatically.

Instructors can then review each submission, replay the typing history, and leave review notes.

---

## Who uses it?

| Role | What they do |
|------|-------------|
| Instructor | Creates exercises, assigns participants, sets timing, monitors live activity, reviews submissions |
| Participant | Logs in, sees assigned exercises, answers questions, submits answers |

---

## Features

- Timed exercises — start time, end time, or duration limit per exercise
- Written questions — text editor with autosave every 25 seconds
- Coding drills — Monaco editor (VS Code engine) with live Go execution
- Live monitor — instructors see paste events, focus losses, and keystrokes in real time
- Anti-cheat — paste detection, focus-loss tracking, edit event recording, typing replay
- Audit log — every instructor action is logged with timestamp
- CSV export — download all submissions for an exercise

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Database | PostgreSQL via Neon (serverless, HTTPS) |
| Auth | NextAuth.js (credentials + JWT) |
| Editor | Monaco Editor |
| Code runner | Custom Go service ([code-runner](https://github.com/jvcByte/code-runner)) |
| Deployment | Vercel (app) + Render (runner) + Neon (database) |

---

## Getting started

### 1. Prerequisites

- Node.js 18+
- A [Neon](https://neon.tech) PostgreSQL database
- The [code-runner](https://github.com/jvcByte/code-runner) service deployed (see below)

### 2. Clone with submodules

```bash
git clone --recurse-submodules https://github.com/jvcByte/recoding.git
cd recoding
npm install
```

### 3. Configure environment

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```env
DATABASE_URL=postgresql://user:password@host-pooler.region.neon.tech/dbname?sslmode=require
NEXTAUTH_SECRET=<openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3000
RUNNER_URL=https://your-runner.onrender.com
RUNNER_API_KEY=<openssl rand -base64 32>
```

### 4. Set up the database

```bash
npm run migrate
npm run seed
```

Default accounts:
- `instructor` / `instructor123`
- `participant` / `participant123`

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Code runner

Coding drills require the [code-runner](https://github.com/jvcByte/code-runner) service — a lightweight Go HTTP server that compiles and runs participant code in a sandboxed temp directory.

It's included as a git submodule at `runner/`. Deploy it separately to Render (free tier):

1. Go to [render.com](https://render.com) → New → Web Service
2. Connect `github.com/jvcByte/code-runner`
3. Runtime: **Docker**
4. Add environment variables:
   - `RUNNER_API_KEY` — a random secret (must match `RUNNER_API_KEY` in the main app)
5. Deploy, then set `RUNNER_URL=https://your-service.onrender.com` in the main app

---

## Available scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run migrate` | Apply pending database migrations |
| `npm run migrate:fresh` | Drop all tables, re-run migrations, seed |
| `npm run seed` | Seed exercises and default users |
| `npm run cleanup` | Delete autosave history older than 30 days |
| `npm run reset-password <username> <password>` | Reset a user's password |

---

## Project structure

```
app/
  api/           — API route handlers
  instructor/    — Instructor dashboard pages
  participant/   — Participant session pages
  components/    — Shared UI components
docs/
  ascii-art/     — ASCII art coding drills (11 questions)
  ascii-art-web/ — ASCII art web coding drills (12 questions)
  go-reloaded/   — Go-reloaded written questions (15 questions)
  prompt-piscine/— Prompt engineering written questions
  banner_files/  — standard.txt, shadow.txt, thinkertoy.txt
lib/
  auth.ts        — NextAuth configuration
  db.ts          — Neon serverless database client
  flagging.ts    — Anti-cheat flag evaluation
  questions.ts   — Exercise content loader
  audit.ts       — Audit log helper
  rateLimit.ts   — Login rate limiter
migrations/      — SQL migration files (versioned)
runner/          — Go code runner (git submodule → jvcByte/code-runner)
scripts/         — CLI utilities (migrate, seed, cleanup, reset-password)
```

---

## Exercises

| Slug | Type | Questions | Description |
|------|------|-----------|-------------|
| `ascii-art` | Code (Go) | 11 | Build an ASCII art renderer from scratch |
| `ascii-art-web` | Code (Go) | 12 | Serve ASCII art over HTTP |
| `go-reloaded` | Written | 15 | Reflect on building a text transformation tool |
| `prompt-basics` | Written | 12 | Prompt engineering fundamentals |
| `prompt-patterns` | Written | 12 | Advanced prompting patterns |
| `ai-ethics` | Written | 12 | AI ethics scenarios |
| `debug-control` | Written | 12 | Debugging mindset |
| `ethical-ai` | Written | 12 | Ethical AI in practice |
| `reasoning-flow` | Written | 15 | Reasoning and flow |
| `role-prompt` | Written | 15 | Role-based prompting |
| `tool-prompts` | Written | 15 | Tool-use prompting |

---

## License

MIT
