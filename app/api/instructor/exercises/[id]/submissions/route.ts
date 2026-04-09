import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.role || session.user.role !== 'instructor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const exerciseId = params.id;

  const rows = await sql`
    SELECT
      sub.id,
      sub.session_id,
      sub.question_index,
      sub.is_final,
      sub.is_flagged,
      sub.flag_reasons,
      sub.submitted_at,
      u.username
    FROM submissions sub
    JOIN sessions s ON s.id = sub.session_id
    JOIN users u ON u.id = s.user_id
    WHERE s.exercise_id = ${exerciseId}
    ORDER BY u.username, sub.question_index
  `;

  return NextResponse.json(rows);
}
