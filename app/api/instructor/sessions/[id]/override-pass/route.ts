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

  const sessionId = params.id;
  const body = await req.json() as { passed_override: boolean | null };

  if (body.passed_override !== null) {
    // Set manual override
    await sql`
      UPDATE sessions
      SET passed_override = ${body.passed_override},
          passed = ${body.passed_override}
      WHERE id = ${sessionId}
    `;
  } else {
    // Clear override — restore calculated value via recalculate
    await sql`
      UPDATE sessions SET passed_override = NULL WHERE id = ${sessionId}
    `;
    await recalculateSessionScore(sessionId).catch(() => {});
  }

  const rows = await sql`
    SELECT id, passed, passed_override FROM sessions WHERE id = ${sessionId}
  `;

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  await audit(session.user.id, 'session.passed_override', 'session', sessionId, {
    passed_override: body.passed_override,
  });

  return NextResponse.json(rows[0]);
}
