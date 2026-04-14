import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';
import { audit } from '@/lib/audit';

// GET — list all questions for an exercise
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== 'instructor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rows = await sql`
    SELECT id, question_index, text, type, language, starter, updated_at
    FROM questions
    WHERE exercise_id = ${params.id}
    ORDER BY question_index
  `;

  return NextResponse.json(rows);
}

// POST — add a new question
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== 'instructor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { text: string; type?: string; language?: string; starter?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  if (!body.text?.trim()) {
    return NextResponse.json({ error: 'text is required' }, { status: 400 });
  }

  // Get next index
  const countRows = await sql`
    SELECT COALESCE(MAX(question_index) + 1, 0) AS next_index
    FROM questions WHERE exercise_id = ${params.id}
  `;
  const nextIndex = countRows[0].next_index as number;

  const rows = await sql`
    INSERT INTO questions (exercise_id, question_index, text, type, language, starter)
    VALUES (
      ${params.id},
      ${nextIndex},
      ${body.text.trim()},
      ${body.type ?? 'written'},
      ${body.language ?? 'text'},
      ${body.starter ?? ''}
    )
    RETURNING id, question_index, text, type, language, starter
  `;

  // Update exercise question_count
  await sql`
    UPDATE exercises SET question_count = question_count + 1 WHERE id = ${params.id}
  `;

  await audit(session.user.id, 'question.created', 'exercise', params.id, { index: nextIndex });

  return NextResponse.json(rows[0], { status: 201 });
}
