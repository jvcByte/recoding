import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { sql } from '@/lib/db';
import Link from 'next/link';
import Navbar from '@/app/components/Navbar';

interface Exercise {
  id: string;
  slug: string;
  title: string;
  question_count: number;
}

import { InboxIcon } from 'lucide-react';

export default async function ExerciseCataloguePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/login');

  const userId = session.user.id;
  let exercises: Exercise[] = [];
  let fetchError = false;
  let activeSessionIds = new Set<string>();

  try {
    const rows = await sql`
      SELECT e.id, e.slug, e.title, e.question_count
      FROM exercises e
      INNER JOIN exercise_assignments ea ON ea.exercise_id = e.id
      WHERE ea.user_id = ${userId} AND e.enabled = true
      ORDER BY e.title
    `;
    exercises = rows as unknown as Exercise[];

    if (exercises.length > 0) {
      const ids = exercises.map((e) => e.id);
      const sessions = await sql`
        SELECT exercise_id FROM sessions
        WHERE user_id = ${userId}
          AND exercise_id = ANY(${ids}::uuid[])
          AND closed_at IS NULL
      `;
      activeSessionIds = new Set(sessions.map((s) => s.exercise_id as string));
    }
  } catch {
    fetchError = true;
  }

  return (
    <div className="page">
      <Navbar username={session.user.name ?? undefined} role="participant" />
      <main className="main">
        <div className="container">
          <div className="page-header">
            <h1 className="page-title">My Exercises</h1>
            <p className="page-sub">Welcome back, {session.user.name ?? 'participant'}. Select an exercise to begin.</p>
          </div>

          {fetchError && (
            <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
              Failed to load exercises. Please refresh the page.
            </div>
          )}

          {!fetchError && exercises.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
              <InboxIcon size={40} style={{ margin: '0 auto 0.75rem', color: 'var(--text3)', display: 'block' }} />
              <p style={{ color: 'var(--text2)', fontWeight: 600, marginBottom: '0.25rem' }}>No exercises assigned</p>
              <p style={{ color: 'var(--text3)', fontSize: 13 }}>Contact your instructor to get access.</p>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {exercises.map((exercise) => (
              <div key={exercise.id} className="exercise-card">
                <div className="exercise-card-info">
                  <div className="exercise-card-title">{exercise.title}</div>
                  <div className="exercise-card-meta">
                    {exercise.question_count} question{exercise.question_count !== 1 ? 's' : ''}
                  </div>
                </div>
                <Link href={`/participant/session/${exercise.id}`} className="btn btn-primary">
                  {activeSessionIds.has(exercise.id) ? 'Continue →' : 'Start →'}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
