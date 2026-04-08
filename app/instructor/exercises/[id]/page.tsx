import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { sql } from '@/lib/db';
import ExerciseManager from './ExerciseManager';
import Navbar from '@/app/components/Navbar';
import Link from 'next/link';

interface Props {
  params: { id: string };
}

export default async function ExercisePage({ params }: Props) {
  const { id } = params;
  const session = await getServerSession(authOptions);

  const exerciseRows = await sql`
    SELECT e.id, e.slug, e.title, e.enabled, e.question_count,
           COALESCE(json_agg(ea.user_id) FILTER (WHERE ea.user_id IS NOT NULL), '[]') AS assigned_user_ids
    FROM exercises e
    LEFT JOIN exercise_assignments ea ON ea.exercise_id = e.id
    WHERE e.id = ${id}
    GROUP BY e.id, e.slug, e.title, e.enabled, e.question_count
  `;

  if (exerciseRows.length === 0) notFound();

  const exercise = exerciseRows[0] as {
    id: string; slug: string; title: string; enabled: boolean;
    question_count: number; assigned_user_ids: string[];
  };

  const sessionRows = await sql`
    SELECT id, start_time, end_time, duration_limit, started_at
    FROM sessions WHERE exercise_id = ${id} ORDER BY started_at ASC NULLS FIRST
  `;

  const assignedUserIds: string[] = exercise.assigned_user_ids;
  const assignedUsers = assignedUserIds.length > 0
    ? await sql`SELECT id, username FROM users WHERE id = ANY(${assignedUserIds}::uuid[])`
    : [];

  const allParticipants = await sql`SELECT id, username FROM users WHERE role = 'participant' ORDER BY username`;

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
              {' · '}{exercise.question_count} question{exercise.question_count !== 1 ? 's' : ''}
            </p>
          </div>
          <ExerciseManager
            exercise={exercise}
            sessions={sessionRows as { id: string; start_time: string | null; end_time: string | null; duration_limit: string | null; started_at: string | null }[]}
            assignedUsers={assignedUsers as { id: string; username: string }[]}
            allParticipants={allParticipants as { id: string; username: string }[]}
          />
        </div>
      </main>
    </div>
  );
}
