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
    pass_mark?: number | null;
    min_questions_required?: number | null;
    flag_fails?: boolean;
    max_paste_chars?: number | null;
    max_focus_loss?: number | null;
    min_edit_events?: number | null;
    min_response_length?: number | null;
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

  // Update timing — save to exercises table AND update all open sessions
  const hasTimingUpdate =
    'start_time' in body || 'end_time' in body || 'duration_limit' in body;

  if (hasTimingUpdate) {
    // Update each field individually to avoid COALESCE type inference issues
    if ('start_time' in body) {
      await sql`UPDATE exercises SET start_time = ${body.start_time ?? null}::timestamptz WHERE id = ${exerciseId}`;
      await sql`UPDATE sessions SET start_time = ${body.start_time ?? null}::timestamptz WHERE exercise_id = ${exerciseId} AND closed_at IS NULL`;
    }
    if ('end_time' in body) {
      await sql`UPDATE exercises SET end_time = ${body.end_time ?? null}::timestamptz WHERE id = ${exerciseId}`;
      await sql`UPDATE sessions SET end_time = ${body.end_time ?? null}::timestamptz WHERE exercise_id = ${exerciseId} AND closed_at IS NULL`;
    }
    if ('duration_limit' in body) {
      await sql`UPDATE exercises SET duration_limit = ${body.duration_limit ?? null}::interval WHERE id = ${exerciseId}`;
      if (body.duration_limit) {
        // Setting a new limit — reset started_at so countdown begins now
        await sql`
          UPDATE sessions
          SET duration_limit = ${body.duration_limit}::interval, started_at = now()
          WHERE exercise_id = ${exerciseId} AND closed_at IS NULL
        `;
      } else {
        // Clearing the limit
        await sql`
          UPDATE sessions SET duration_limit = NULL
          WHERE exercise_id = ${exerciseId} AND closed_at IS NULL
        `;
      }
    }
  }

  // Update pass mark and scoring constraints if provided
  if ('pass_mark' in body || 'min_questions_required' in body || 'flag_fails' in body || 'max_paste_chars' in body) {
    if (body.pass_mark !== null && body.pass_mark !== undefined) {
      if (typeof body.pass_mark !== 'number' || isNaN(body.pass_mark)) {
        return NextResponse.json({ error: 'pass_mark must be a number' }, { status: 400 });
      }
      if (body.pass_mark < 0) {
        return NextResponse.json({ error: 'pass_mark must be >= 0' }, { status: 400 });
      }
    }
    if ('pass_mark' in body) {
      await sql`UPDATE exercises SET pass_mark = ${body.pass_mark ?? null} WHERE id = ${exerciseId}`;
    }
    if ('min_questions_required' in body) {
      await sql`UPDATE exercises SET min_questions_required = ${body.min_questions_required ?? null} WHERE id = ${exerciseId}`;
    }
    if ('flag_fails' in body) {
      await sql`UPDATE exercises SET flag_fails = ${body.flag_fails ?? false} WHERE id = ${exerciseId}`;
    }
    if ('max_paste_chars' in body) {
      await sql`UPDATE exercises SET max_paste_chars = ${body.max_paste_chars ?? null} WHERE id = ${exerciseId}`;
    }
    if ('max_focus_loss' in body) {
      await sql`UPDATE exercises SET max_focus_loss = ${body.max_focus_loss ?? null} WHERE id = ${exerciseId}`;
    }
    if ('min_edit_events' in body) {
      await sql`UPDATE exercises SET min_edit_events = ${body.min_edit_events ?? null} WHERE id = ${exerciseId}`;
    }
    if ('min_response_length' in body) {
      await sql`UPDATE exercises SET min_response_length = ${body.min_response_length ?? null} WHERE id = ${exerciseId}`;
    }
    await audit(session.user.id, 'exercise.scoring_updated', 'exercise', exerciseId, {
      pass_mark: body.pass_mark, min_questions_required: body.min_questions_required,
      flag_fails: body.flag_fails, max_paste_chars: body.max_paste_chars,
    });
    // Recalculate scores for all sessions of this exercise
    const sessionRows = await sql`SELECT id FROM sessions WHERE exercise_id = ${exerciseId}`;
    await Promise.all(sessionRows.map((s) => recalculateSessionScore(s.id as string).catch(() => {})));
  }

  // Return updated exercise with assignments
  const rows = await sql`
    SELECT e.id, e.slug, e.title, e.enabled, e.question_count, e.pass_mark,
           e.min_questions_required, e.flag_fails, e.max_paste_chars, e.max_focus_loss,
           e.min_edit_events, e.min_response_length,
           COALESCE(
             json_agg(ea.user_id) FILTER (WHERE ea.user_id IS NOT NULL),
             '[]'
           ) AS assigned_user_ids
    FROM exercises e
    LEFT JOIN exercise_assignments ea ON ea.exercise_id = e.id
    WHERE e.id = ${exerciseId}
    GROUP BY e.id, e.slug, e.title, e.enabled, e.question_count, e.pass_mark,
             e.min_questions_required, e.flag_fails, e.max_paste_chars, e.max_focus_loss,
             e.min_edit_events, e.min_response_length
  `;

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Exercise not found' }, { status: 404 });
  }

  return NextResponse.json(rows[0]);
}
