import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { sql } from '@/lib/db';
import Link from 'next/link';

interface Exercise {
  id: string;
  slug: string;
  title: string;
  question_count: number;
}

export default async function ExerciseCataloguePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/login');
  }

  const userId = session.user.id;

  let exercises: Exercise[] = [];
  let fetchError = false;

  try {
    const rows = await sql`
      SELECT e.id, e.slug, e.title, e.question_count
      FROM exercises e
      INNER JOIN exercise_assignments ea ON ea.exercise_id = e.id
      WHERE ea.user_id = ${userId}
        AND e.enabled = true
      ORDER BY e.title
    `;
    exercises = rows as Exercise[];
  } catch {
    fetchError = true;
  }

  return (
    <main style={{ maxWidth: 800, margin: '0 auto', padding: '2rem' }}>
      <h1>Exercise Catalogue</h1>
      <p>Welcome, {session.user.name ?? session.user.email}</p>

      {fetchError && (
        <p style={{ color: 'red' }}>Failed to load exercises. Please try again.</p>
      )}

      {!fetchError && exercises.length === 0 && (
        <p>No exercises assigned. Please contact your instructor.</p>
      )}

      {exercises.length > 0 && (
        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          {exercises.map((exercise) => (
            <li
              key={exercise.id}
              style={{
                border: '1px solid #ccc',
                borderRadius: 8,
                padding: '1rem',
              }}
            >
              <h2 style={{ margin: '0 0 0.5rem' }}>{exercise.title}</h2>
              <p style={{ margin: '0 0 0.75rem', color: '#555' }}>
                {exercise.question_count} question
                {exercise.question_count !== 1 ? 's' : ''}
              </p>
              <Link
                href={`/participant/session/${exercise.id}`}
                style={{
                  display: 'inline-block',
                  padding: '0.5rem 1rem',
                  background: '#0070f3',
                  color: '#fff',
                  borderRadius: 4,
                  textDecoration: 'none',
                }}
              >
                Start Exercise
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
