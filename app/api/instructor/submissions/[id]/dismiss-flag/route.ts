import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';
import { audit } from '@/lib/audit';
import { recalculateSessionScore } from '@/lib/scoring';

interface DismissedFlag {
  reason: string;
  dismissed_by: string;
  dismissed_at: string;
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== 'instructor') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const submissionId = params.id;
  let body: { reason: string; restore?: boolean };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.reason || typeof body.reason !== 'string') {
    return NextResponse.json({ error: 'reason is required' }, { status: 400 });
  }

  // Load submission
  const rows = await sql`
    SELECT sub.id, sub.session_id, sub.flag_reasons, sub.dismissed_flags
    FROM submissions sub
    WHERE sub.id = ${submissionId}
    LIMIT 1
  `;

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
  }

  const sub = rows[0] as {
    id: string;
    session_id: string;
    flag_reasons: string[] | null;
    dismissed_flags: DismissedFlag[];
  };

  const flagReasons: string[] = sub.flag_reasons ?? [];
  const dismissedFlags: DismissedFlag[] = sub.dismissed_flags ?? [];

  // Validate reason exists in flag_reasons
  if (!flagReasons.includes(body.reason)) {
    return NextResponse.json({ error: 'reason not found in flag_reasons' }, { status: 400 });
  }

  let updatedDismissed: DismissedFlag[];

  if (body.restore) {
    // Restore: remove the dismissal entry
    const existing = dismissedFlags.find((d) => d.reason === body.reason);
    if (!existing) {
      return NextResponse.json({ error: 'flag is not dismissed' }, { status: 400 });
    }
    updatedDismissed = dismissedFlags.filter((d) => d.reason !== body.reason);
  } else {
    // Dismiss: add entry if not already dismissed
    const alreadyDismissed = dismissedFlags.some((d) => d.reason === body.reason);
    if (alreadyDismissed) {
      return NextResponse.json({ error: 'flag already dismissed' }, { status: 400 });
    }
    updatedDismissed = [
      ...dismissedFlags,
      {
        reason: body.reason,
        dismissed_by: session.user.id,
        dismissed_at: new Date().toISOString(),
      },
    ];
  }

  // Recompute is_flagged: any flag_reason not in dismissed_flags → still flagged
  const dismissedReasons = new Set(updatedDismissed.map((d) => d.reason));
  const isFlagged = flagReasons.some((r) => !dismissedReasons.has(r));

  // Persist
  await sql`
    UPDATE submissions
    SET dismissed_flags = ${JSON.stringify(updatedDismissed)}::jsonb,
        is_flagged = ${isFlagged}
    WHERE id = ${submissionId}
  `;

  await audit(
    session.user.id,
    body.restore ? 'submission.flag_restored' : 'submission.flag_dismissed',
    'submission',
    submissionId,
    { reason: body.reason }
  );

  // Recalculate score
  const score = await recalculateSessionScore(sub.session_id).catch(() => null);

  return NextResponse.json({
    submission_id: submissionId,
    dismissed_flags: updatedDismissed,
    is_flagged: isFlagged,
    score,
  });
}
