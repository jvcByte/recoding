import { sql } from './db';

export interface FlagResult {
  is_flagged: boolean;
  flag_reasons: string[];
}

const FOCUS_LOSS_THRESHOLD = parseInt(process.env.FLAG_FOCUS_LOSS_THRESHOLD ?? '3', 10);
const MIN_EDIT_EVENTS = parseInt(process.env.FLAG_MIN_EDIT_EVENTS ?? '10', 10);
const MIN_RESPONSE_LENGTH_FOR_EDIT_CHECK = parseInt(process.env.FLAG_MIN_RESPONSE_LENGTH ?? '200', 10);

/**
 * Evaluates anti-cheat signals for a given submission and returns
 * whether it should be flagged and the reasons why.
 *
 * Flags if:
 * - paste events > 0
 * - focus-loss events > FOCUS_LOSS_THRESHOLD (default 3)
 * - edit events < 10 for a response longer than 200 characters
 */
export async function evaluateFlags(submissionId: string): Promise<FlagResult> {
  const flag_reasons: string[] = [];

  // Count paste events for this submission
  const pasteResult = await sql`
    SELECT COUNT(*)::int AS count
    FROM paste_events
    WHERE submission_id = ${submissionId}
  `;
  const pasteCount: number = pasteResult[0]?.count ?? 0;

  if (pasteCount > 0) {
    flag_reasons.push(`paste_detected: ${pasteCount} paste event(s) recorded`);
  }

  // Count focus-loss events for the session that owns this submission
  const focusResult = await sql`
    SELECT COUNT(*)::int AS count
    FROM focus_events fe
    JOIN submissions s ON s.session_id = fe.session_id
    WHERE s.id = ${submissionId}
  `;
  const focusLossCount: number = focusResult[0]?.count ?? 0;

  if (focusLossCount > FOCUS_LOSS_THRESHOLD) {
    flag_reasons.push(
      `focus_loss_exceeded: ${focusLossCount} focus-loss event(s) (threshold: ${FOCUS_LOSS_THRESHOLD})`
    );
  }

  // Count edit events and check response length
  const editResult = await sql`
    SELECT COUNT(*)::int AS edit_count, s.response_text
    FROM edit_events ee
    JOIN submissions s ON s.id = ee.submission_id
    WHERE ee.submission_id = ${submissionId}
    GROUP BY s.response_text
  `;

  if (editResult.length > 0) {
    const editCount: number = editResult[0].edit_count;
    const responseText: string = editResult[0].response_text ?? '';

    if (
      responseText.length > MIN_RESPONSE_LENGTH_FOR_EDIT_CHECK &&
      editCount < MIN_EDIT_EVENTS
    ) {
      flag_reasons.push(
        `low_edit_count: only ${editCount} edit event(s) for a ${responseText.length}-character response`
      );
    }
  } else {
    // No edit events at all — check if the response is long enough to warrant flagging
    const submissionResult = await sql`
      SELECT response_text
      FROM submissions
      WHERE id = ${submissionId}
    `;
    const responseText: string = submissionResult[0]?.response_text ?? '';

    if (responseText.length > MIN_RESPONSE_LENGTH_FOR_EDIT_CHECK) {
      flag_reasons.push(
        `low_edit_count: 0 edit event(s) for a ${responseText.length}-character response`
      );
    }
  }

  return {
    is_flagged: flag_reasons.length > 0,
    flag_reasons,
  };
}
