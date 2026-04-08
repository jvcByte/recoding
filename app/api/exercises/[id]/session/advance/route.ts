import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { sql } from '@/lib/db';

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const exerciseId = params.id;

  // Look up the session for this exercise + user
  const rows = await sql`
    SELECT s.id, s.closed_at, s.current_question_index, e.question_count
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

  if (row.closed_at) {
    return NextResponse.json({ error: 'Session closed' }, { status: 410 });
  }

  const currentIndex: number = row.current_question_index;
  const questionCount: number = row.question_count;

  // Check if there is a next question
  if (currentIndex + 1 >= questionCount) {
    return NextResponse.json(
      { error: 'Already on the last question' },
      { status: 400 }
    );
  }

  // Lock the current question's submission by marking it final
  await sql`
    UPDATE submissions
    SET is_final = true
    WHERE session_id = ${row.id}
      AND question_index = ${currentIndex}
      AND is_final = false
  `;

  // Advance to the next question
  const updated = await sql`
    UPDATE sessions
    SET current_question_index = current_question_index + 1
    WHERE id = ${row.id}
    RETURNING current_question_index
  `;

  const newIndex: number = updated[0].current_question_index;

  return NextResponse.json({ new_index: newIndex }, { status: 200 });
}
