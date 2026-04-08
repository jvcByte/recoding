import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { sql } from '@/lib/db';
import { loadExercise } from '@/lib/questions';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string; n: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const exerciseId = params.id;
  const questionIndex = parseInt(params.n, 10);

  if (isNaN(questionIndex) || questionIndex < 0) {
    return NextResponse.json({ error: 'Invalid question index' }, { status: 400 });
  }

  // Look up the session for this exercise + user
  const rows = await sql`
    SELECT s.id, s.closed_at, s.current_question_index, e.slug
    FROM sessions s
    INNER JOIN exercises e ON e.id = s.exercise_id
    WHERE s.exercise_id = ${exerciseId}
      AND s.user_id = ${userId}
    LIMIT 1
  `;

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  const row = rows[0];

  // 410 if session is closed
  if (row.closed_at) {
    return NextResponse.json({ error: 'Session closed' }, { status: 410 });
  }

  // 403 if question index is beyond current progress (sequential enforcement)
  if (questionIndex > row.current_question_index) {
    return NextResponse.json(
      { error: 'Question not yet available' },
      { status: 403 }
    );
  }

  // Load exercise content from docs/
  let exercise;
  try {
    exercise = loadExercise(row.slug as string);
  } catch {
    return NextResponse.json({ error: 'Exercise content not found' }, { status: 404 });
  }

  const question = exercise.questions.find((q) => q.index === questionIndex);

  if (!question) {
    return NextResponse.json({ error: 'Question not found' }, { status: 404 });
  }

  return NextResponse.json({ index: question.index, text: question.text });
}
