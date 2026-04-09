import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';
import { audit } from '@/lib/audit';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.role || session.user.role !== 'instructor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const submissionId = params.id;

  let body: { review_note: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (typeof body.review_note !== 'string') {
    return NextResponse.json({ error: 'review_note is required' }, { status: 400 });
  }

  const rows = await sql`
    UPDATE submissions
    SET review_note = ${body.review_note}
    WHERE id = ${submissionId}
    RETURNING id, review_note
  `;

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
  }

  await audit(session.user.id, 'submission.reviewed', 'submission', submissionId, {
    review_note: body.review_note,
  });

  return NextResponse.json(rows[0]);
}
