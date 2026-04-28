import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';
import { audit } from '@/lib/audit';
import { recalculateSessionScore } from '@/lib/scoring';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'instructor') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const submissionId = params.id;
  const body = await req.json() as { manually_passed: boolean | null };

  const rows = await sql`
    UPDATE submissions
    SET manually_passed = ${body.manually_passed}
    WHERE id = ${submissionId}
    RETURNING id, session_id, manually_passed
  `;

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
  }

  await audit(session.user.id, 'submission.manual_pass', 'submission', submissionId, {
    manually_passed: body.manually_passed,
  });

  // Recalculate session score to reflect the manual grade
  const sessionId = rows[0].session_id as string;
  const scoreResult = await recalculateSessionScore(sessionId).catch(() => null);

  return NextResponse.json({ ...rows[0], score: scoreResult?.score ?? null });
}
