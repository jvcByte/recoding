import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
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

  const exerciseId = params.id;
  let body: {
    enabled?: boolean;
    assign_user_ids?: string[];
    start_time?: string | null;
    end_time?: string | null;
    duration_limit?: string | null;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Update enabled status if provided
  if (typeof body.enabled === 'boolean') {
    await sql`
      UPDATE exercises SET enabled = ${body.enabled} WHERE id = ${exerciseId}
    `;
    await audit(session.user.id, body.enabled ? 'exercise.enabled' : 'exercise.disabled', 'exercise', exerciseId);
  }

  // Replace assignment list if provided
  if (Array.isArray(body.assign_user_ids)) {
    await sql`
      DELETE FROM exercise_assignments WHERE exercise_id = ${exerciseId}
    `;

    if (body.assign_user_ids.length > 0) {
      for (const userId of body.assign_user_ids) {
        await sql`
          INSERT INTO exercise_assignments (exercise_id, user_id)
          VALUES (${exerciseId}, ${userId})
          ON CONFLICT DO NOTHING
        `;
      }
    }
    await audit(session.user.id, 'exercise.assignments_updated', 'exercise', exerciseId, {
      user_ids: body.assign_user_ids,
    });
  }

  // Update timing on unstarted sessions if any timing field is provided
  const hasTimingUpdate =
    'start_time' in body || 'end_time' in body || 'duration_limit' in body;

  if (hasTimingUpdate) {
    if ('start_time' in body) {
      await sql`
        UPDATE sessions
        SET start_time = ${body.start_time ?? null}
        WHERE exercise_id = ${exerciseId} AND started_at IS NULL
      `;
    }
    if ('end_time' in body) {
      await sql`
        UPDATE sessions
        SET end_time = ${body.end_time ?? null}
        WHERE exercise_id = ${exerciseId} AND started_at IS NULL
      `;
    }
    if ('duration_limit' in body) {
      await sql`
        UPDATE sessions
        SET duration_limit = ${body.duration_limit ?? null}
        WHERE exercise_id = ${exerciseId} AND started_at IS NULL
      `;
    }
  }

  // Return updated exercise with assignments
  const rows = await sql`
    SELECT e.id, e.slug, e.title, e.enabled, e.question_count,
           COALESCE(
             json_agg(ea.user_id) FILTER (WHERE ea.user_id IS NOT NULL),
             '[]'
           ) AS assigned_user_ids
    FROM exercises e
    LEFT JOIN exercise_assignments ea ON ea.exercise_id = e.id
    WHERE e.id = ${exerciseId}
    GROUP BY e.id, e.slug, e.title, e.enabled, e.question_count
  `;

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Exercise not found' }, { status: 404 });
  }

  return NextResponse.json(rows[0]);
}
