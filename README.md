# Recoding — Exercise Platform

> A controlled environment for running timed coding and writing exercises with live anti-cheat monitoring.

---

## What is this?

Imagine a classroom, but on a computer. The teacher (instructor) gives students (participants) coding or writing exercises to complete. Students type their answers in a special editor on the website. The teacher can watch what everyone is doing in real time — if someone copies and pastes code, the teacher sees it immediately.

When time runs out, everything is saved automatically. The teacher can then review each student's work, see exactly how they typed it, and leave notes.

---

## Who uses it?

| Role | What they do |
|------|-------------|
| **Instructor** | Creates exercises, assigns them to students, sets time limits, monitors live activity, reviews submissions |
| **Participant** | Logs in, sees their assigned exercises, answers questions in the editor, submits answers |

---

## Features

- **Timed exercises** — set a start time, end time, or duration limit per exercise
- **Written questions** — text editor with autosave every 25 seconds
- **Coding drills** — Monaco code editor (same as VS Code) with Go execution via Piston
- **Live monitor** — instructors see paste events, focus losses, and keystrokes in real time
- **Anti-cheat** — paste detection, focus-loss tracking, edit event recording, typing replay
- **Audit log** — every instructor action is logged with timestamp
- **CSV export** — download all submissions for an exercise as a spreadsheet

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Database | PostgreSQL (local or Neon) |
| Auth | NextAuth.js (credentials) |
| Editor | Monaco Editor (`@monaco-editor/react`) |
| Code runner | Piston (self-hosted Docker) |
| UI | Custom dark theme, Lucide icons, Sonner toasts |

---

## Getting started

### 1. Prerequisites

- Node.js 18+
- PostgreSQL running locally (or a Neon connection string)
- Docker (for the Go code runner)

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

Copy `.env.example` to `.env.local` and fill in:

```bash
cp .env.example .env.local
```

```env
DATABASE_URL=postgres://user:password@localhost:5432/recoding
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3000

# Optional — required for coding drills
PISTON_API_URL=http://localhost:2000/api/v2
```

### 4. Set up the database

```bash
npm run migrate
```

### 5. Seed exercises and default users

```bash
npm run seed
```

Default accounts created:
- `instructor` / `instructor123`
- `participant` / `participant123`

### 6. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Code execution

Coding drills require the custom Go runner deployed at [github.com/jvcByte/code-runner](https://github.com/jvcByte/code-runner).

Deploy it to Render (free tier) then set:
```env
PISTON_API_URL=https://your-runner.onrender.com
```

The runner accepts `POST /run` with `{ code, language, stdin }` and returns `{ stdout, stderr, exit_code, compile_output }`. The banner file (`standard.txt`) is automatically injected as stdin for Go exercises.

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
  ascii-art/     — ASCII art coding drills
  ascii-art-web/ — ASCII art web coding drills
  go-reloaded/   — Go-reloaded written questions
  prompt-piscine/— Prompt engineering written questions
  banner_files/  — standard.txt, shadow.txt, thinkertoy.txt
lib/
  auth.ts        — NextAuth configuration
  db.ts          — PostgreSQL connection pool
  flagging.ts    — Anti-cheat flag evaluation
  questions.ts   — Exercise content loader
  audit.ts       — Audit log helper
  rateLimit.ts   — Login rate limiter
migrations/      — SQL migration files
scripts/         — CLI utilities (migrate, seed, cleanup)
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
