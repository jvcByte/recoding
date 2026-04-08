import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { sql } from '@/lib/db';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.role || session.user.role !== 'instructor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const exercises = await sql`
    SELECT e.id, e.slug, e.title, e.enabled, e.question_count,
           COALESCE(
             json_agg(ea.user_id) FILTER (WHERE ea.user_id IS NOT NULL),
             '[]'
           ) AS assigned_user_ids
    FROM exercises e
    LEFT JOIN exercise_assignments ea ON ea.exercise_id = e.id
    GROUP BY e.id, e.slug, e.title, e.enabled, e.question_count
    ORDER BY e.title
  `;

  return NextResponse.json(exercises);
}
