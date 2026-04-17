import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';
import { audit } from '@/lib/audit';
import { loadExercise } from '@/lib/questions';

/**
 * POST /api/instructor/exercises/:id/questions/sync
 *
 * Re-reads the exercise question files from disk and replaces all questions in the DB.
 * Only works for exercises that have a matching docs/ directory.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== 'instructor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const exerciseRows = await sql`SELECT id, slug FROM exercises WHERE id = ${params.id} LIMIT 1`;
  if (exerciseRows.length === 0) {
    return NextResponse.json({ error: 'Exercise not found' }, { status: 404 });
  }

  const slug = exerciseRows[0].slug as string;

  let exercise;
  try {
    exercise = loadExercise(slug);
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed to load exercise files' }, { status: 422 });
  }

  await sql`DELETE FROM questions WHERE exercise_id = ${params.id}`;

  for (const q of exercise.questions) {
    await sql`
      INSERT INTO questions (exercise_id, question_index, text, type, language, starter)
      VALUES (${params.id}, ${q.index}, ${q.text}, ${q.type}, ${q.language}, ${q.starter})
    `;
  }

  await sql`UPDATE exercises SET question_count = ${exercise.questions.length} WHERE id = ${params.id}`;

  await audit(session.user.id, 'questions.synced', 'exercise', params.id, {
    slug,
    count: exercise.questions.length,
  });

  return NextResponse.json({ synced: exercise.questions.length });
}
