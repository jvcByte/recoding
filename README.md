# Recoding — Exercise Platform

A controlled environment for running timed coding and writing exercises with live anti-cheat monitoring. 

---

## What is this?

Recoding is a web platform where instructors assign exercises to participants, set time limits, and monitor activity in real time. Participants complete written or coding exercises in a browser-based editor. Every keystroke, paste, and focus loss is recorded. When time runs out, everything is saved automatically.

Instructors can create exercises, upload questions from Markdown files, assign participants, set timing, and review submissions with full typing replay.

---

## Who uses it?

| Role | What they do |
|------|-------------|
| Instructor | Creates exercises, uploads questions, assigns participants, sets timing, monitors live activity, reviews submissions |
| Participant | Logs in, sees assigned exercises, answers questions in the editor, submits answers |

---

## Features

- **Timed exercises** — start time, end time, or duration limit per exercise
- **Written questions** — text editor with autosave every 25 seconds
- **Coding drills** — Monaco editor (VS Code engine) with live Go execution via custom runner
- **Question management** — instructors upload `.md` files or add questions manually through the UI
- **Live monitor** — instructors see paste events, focus losses, and keystrokes in real time
- **Anti-cheat** — paste detection, focus-loss tracking, edit event recording, typing replay
- **Audit log** — every instructor action is logged with timestamp
- **CSV export** — download all submissions for an exercise

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Database | PostgreSQL via Neon (serverless, HTTPS) |
| Auth | NextAuth.js (credentials + JWT) |
| Editor | Monaco Editor |
| Code runner | Custom Go service ([jvcByte/code-runner](https://github.com/jvcByte/code-runner)) |
| Deployment | Vercel (app) + Render (runner) + Neon (database) |

---

## Getting started

### 1. Clone with submodules

```bash
git clone --recurse-submodules https://github.com/jvcByte/recoding.git
cd recoding
npm install
```

### 2. Configure environment

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

### 3. Set up the database

```bash
npm run migrate          # create all tables
npm run seed             # seed exercises and default users
npm run import-questions # import questions from docs/ into DB
```

Default accounts created by seed:
- `instructor` / `instructor123`
- `participant` / `participant123`

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Code runner

Coding drills require the [code-runner](https://github.com/jvcByte/code-runner) service — a lightweight Go HTTP server that compiles and runs participant code.

It's included as a git submodule at `runner/`. Deploy it to Render (free tier):

1. Go to [render.com](https://render.com) → New → Web Service
2. Connect `github.com/jvcByte/code-runner`
3. Runtime: **Docker**
4. Add env var: `RUNNER_API_KEY=<same secret as in main app>`
5. Deploy, then set `RUNNER_URL=https://your-service.onrender.com` in the main app

---

## Available scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run migrate` | Apply pending database migrations |
| `npm run migrate:fresh` | Drop all tables, re-run migrations, seed, import questions |
| `npm run seed` | Seed exercises and default users |
| `npm run import-questions` | Import questions from docs/ into the database |
| `npm run cleanup` | Delete autosave history older than 30 days |
| `npm run reset-password <username> <password>` | Reset a user's password |

---

## Project structure

```
app/
  api/           — API route handlers
  instructor/    — Instructor dashboard pages
  participant/   — Participant session pages
  components/    — Shared UI components (Navbar, LogoutButton)
docs/
  ascii-art/     — ASCII art coding drills (11 questions)
  ascii-art-web/ — ASCII art web coding drills (12 questions)
  go-reloaded/   — Go-reloaded written questions (15 questions)
  prompt-piscine/— Prompt engineering written questions
  banner_files/  — standard.txt, shadow.txt, thinkertoy.txt (injected as stdin)
lib/
  auth.ts        — NextAuth configuration
  db.ts          — Neon serverless database client
  flagging.ts    — Anti-cheat flag evaluation
  questions.ts   — Exercise content loader (reads from DB, falls back to docs/)
  audit.ts       — Audit log helper
  rateLimit.ts   — Login rate limiter
  utils.ts       — Shared utility functions (interval parsing, slug conversion, markdown parsing)
migrations/      — SQL migration files (versioned, tracked in schema_migrations table)
runner/          — Go code runner (git submodule → jvcByte/code-runner)
scripts/         — CLI utilities (migrate, seed, import-questions, cleanup, reset-password)
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

## Production checklist

Before going live:

- [ ] Rotate `NEXTAUTH_SECRET` (was in git history)
- [ ] Rotate Neon database password
- [ ] Set `RUNNER_API_KEY` on both Render and Vercel
- [ ] Run `npm run migrate` on production DB
- [ ] Run `npm run import-questions` to populate questions
- [ ] Set up autosave cleanup cron: `0 2 * * * npm run cleanup`
- [ ] Add `Strict-Transport-Security` header for HTTPS enforcement

---

## License

MIT
