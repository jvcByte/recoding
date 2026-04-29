import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';

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

  // Verify session exists and belongs to this user
  const sessionRows = await sql`
    SELECT s.id, s.closed_at, s.current_question_index
    FROM sessions s
    WHERE s.exercise_id = ${exerciseId}
      AND s.user_id = ${userId}
    LIMIT 1
  `;

  if (sessionRows.length === 0) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  const row = sessionRows[0];

  if (row.closed_at) {
    return NextResponse.json({ error: 'Session closed' }, { status: 410 });
  }

  if (questionIndex > (row.current_question_index as number)) {
    return NextResponse.json({ error: 'Question not yet available' }, { status: 403 });
  }

  // Load question from database
  const questionRows = await sql`
    SELECT question_index, text, type, language, starter, points, test_cases,
           allowed_packages, required_package, documentation_links
    FROM questions
    WHERE exercise_id = ${exerciseId}
      AND question_index = ${questionIndex}
    LIMIT 1
  `;

  if (questionRows.length === 0) {
    return NextResponse.json({ error: 'Question not found' }, { status: 404 });
  }

  const q = questionRows[0];

  return NextResponse.json({
    index: q.question_index,
    text: q.text,
    type: q.type,
    language: q.language,
    starter: q.starter,
    points: q.points ?? null,
    test_cases: q.test_cases ?? null,
    allowed_packages: q.allowed_packages ?? null,
    required_package: q.required_package ?? null,
    documentation_links: q.documentation_links ?? null,
  });
}
