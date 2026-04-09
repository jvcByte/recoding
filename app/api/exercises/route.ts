import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  const rows = await sql`
    SELECT e.id, e.slug, e.title, e.question_count
    FROM exercises e
    INNER JOIN exercise_assignments ea ON ea.exercise_id = e.id
    WHERE ea.user_id = ${userId}
      AND e.enabled = true
    ORDER BY e.title
  `;

  return NextResponse.json(rows);
}
