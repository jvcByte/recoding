import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';
import { audit } from '@/lib/audit';

// PUT — update a question
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string; qid: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== 'instructor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { text?: string; type?: string; language?: string; starter?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const rows = await sql`
    UPDATE questions
    SET
      text       = COALESCE(${body.text ?? null}, text),
      type       = COALESCE(${body.type ?? null}, type),
      language   = COALESCE(${body.language ?? null}, language),
      starter    = COALESCE(${body.starter ?? null}, starter),
      updated_at = now()
    WHERE id = ${params.qid}
      AND exercise_id = ${params.id}
    RETURNING id, question_index, text, type, language, starter
  `;

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Question not found' }, { status: 404 });
  }

  await audit(session.user.id, 'question.updated', 'question', params.qid);

  return NextResponse.json(rows[0]);
}

// DELETE — remove a question and reindex
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; qid: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== 'instructor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get the index of the question being deleted
  const existing = await sql`
    SELECT question_index FROM questions WHERE id = ${params.qid} AND exercise_id = ${params.id}
  `;
  if (existing.length === 0) {
    return NextResponse.json({ error: 'Question not found' }, { status: 404 });
  }

  const deletedIndex = existing[0].question_index as number;

  await sql`DELETE FROM questions WHERE id = ${params.qid}`;

  // Reindex questions after the deleted one
  await sql`
    UPDATE questions
    SET question_index = question_index - 1
    WHERE exercise_id = ${params.id}
      AND question_index > ${deletedIndex}
  `;

  // Update exercise question_count
  await sql`
    UPDATE exercises SET question_count = GREATEST(question_count - 1, 0) WHERE id = ${params.id}
  `;

  await audit(session.user.id, 'question.deleted', 'exercise', params.id, { index: deletedIndex });

  return NextResponse.json({ success: true });
}
