import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';
import ExerciseManager from './ExerciseManager';
import QuestionManager from './QuestionManager';
import Navbar from '@/app/components/Navbar';
import Link from 'next/link';

interface Props {
  params: { id: string };
}

/** Convert a pg PostgresInterval object or string to "HH:MM:SS" string */
function intervalToString(val: unknown): string {
  if (typeof val === 'string') return val;
  if (val && typeof val === 'object') {
    const iv = val as Record<string, number>;
    const h = String(iv.hours ?? 0).padStart(2, '0');
    const m = String(iv.minutes ?? 0).padStart(2, '0');
    const s = String(Math.floor(iv.seconds ?? 0)).padStart(2, '0');
    return `${h}:${m}:${s}`;
  }
  return '';
}

export default async function ExercisePage({ params }: Props) {
  const { id } = params;
  const session = await getServerSession(authOptions);

  const exerciseRows = await sql`
    SELECT e.id, e.slug, e.title, e.enabled, e.question_count,
           e.start_time, e.end_time, e.duration_limit,
           COALESCE(json_agg(ea.user_id) FILTER (WHERE ea.user_id IS NOT NULL), '[]') AS assigned_user_ids
    FROM exercises e
    LEFT JOIN exercise_assignments ea ON ea.exercise_id = e.id
    WHERE e.id = ${id}
    GROUP BY e.id, e.slug, e.title, e.enabled, e.question_count, e.start_time, e.end_time, e.duration_limit
  `;

  if (exerciseRows.length === 0) notFound();

  // Serialize the exercise row — duration_limit comes back as a PostgresInterval object
  const raw = exerciseRows[0];
  const exercise = {
    id: raw.id as string,
    slug: raw.slug as string,
    title: raw.title as string,
    enabled: raw.enabled as boolean,
    question_count: raw.question_count as number,
    assigned_user_ids: raw.assigned_user_ids as string[],
    start_time: raw.start_time ? String(raw.start_time) : null,
    end_time: raw.end_time ? String(raw.end_time) : null,
    duration_limit: raw.duration_limit ? intervalToString(raw.duration_limit) : null,
  };

  const sessionRows = await sql`
    SELECT id, start_time, end_time, duration_limit, started_at
    FROM sessions WHERE exercise_id = ${id} ORDER BY started_at ASC NULLS FIRST
  `;

  const sessions = sessionRows.map((s) => ({
    id: s.id as string,
    start_time: s.start_time ? String(s.start_time) : null,
    end_time: s.end_time ? String(s.end_time) : null,
    duration_limit: s.duration_limit ? intervalToString(s.duration_limit) : null,
    started_at: s.started_at ? String(s.started_at) : null,
  }));

  const assignedUserIds: string[] = exercise.assigned_user_ids;
  const assignedUsers = assignedUserIds.length > 0
    ? await sql`SELECT id, username FROM users WHERE id = ANY(${assignedUserIds}::uuid[])`
    : [];

  const allParticipants = await sql`SELECT id, username FROM users WHERE role = 'participant' ORDER BY username`;

  const questionRows = await sql`
    SELECT id, question_index, text, type, language, starter
    FROM questions WHERE exercise_id = ${id} ORDER BY question_index
  `;

  return (
    <div className="page">
      <Navbar
        username={session?.user?.name ?? undefined}
        role="instructor"
        links={[{ href: '/instructor', label: 'Dashboard' }]}
      />
      <main className="main">
        <div className="container">
          <div className="breadcrumb">
            <Link href="/instructor">Dashboard</Link>
            <span className="breadcrumb-sep">/</span>
            <span>{exercise.title}</span>
          </div>
          <div className="page-header">
            <h1 className="page-title">{exercise.title}</h1>
            <p className="page-sub">
              <code style={{ background: 'var(--bg3)', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>{exercise.slug}</code>
              {' · '}{exercise.question_count} question{exercise.question_count > 1 ? 's' : ''}
            </p>
          </div>
          <ExerciseManager
            exercise={exercise}
            sessions={sessions}
            assignedUsers={assignedUsers as { id: string; username: string }[]}
            allParticipants={allParticipants as { id: string; username: string }[]}
          />

          {/* Question management */}
          <div className="card" style={{ marginTop: '1.5rem' }}>
            <div className="card-header">
              <span className="card-title">Questions</span>
              <span className="badge badge-purple">{questionRows.length}</span>
            </div>
            <QuestionManager
              exerciseId={id}
              initialQuestions={questionRows as { id: string; question_index: number; text: string; type: 'written' | 'code'; language: string; starter: string }[]}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
