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
 * - paste events with char_count > max_paste_chars threshold (or any paste if no threshold)
 * - focus-loss events > FOCUS_LOSS_THRESHOLD (default 3)
 * - edit events < 10 for a response longer than 200 characters
 */
export async function evaluateFlags(submissionId: string): Promise<FlagResult> {
  const flag_reasons: string[] = [];

  // Look up the exercise's max_paste_chars threshold and question starter code for this submission
  const thresholdResult = await sql`
    SELECT e.max_paste_chars, e.max_focus_loss, e.min_edit_events, e.min_response_length, q.starter
    FROM submissions sub
    JOIN sessions sess ON sess.id = sub.session_id
    JOIN exercises e ON e.id = sess.exercise_id
    JOIN questions q ON q.exercise_id = sess.exercise_id AND q.question_index = sub.question_index
    WHERE sub.id = ${submissionId}
    LIMIT 1
  `;
  const maxPasteChars: number | null = (thresholdResult[0]?.max_paste_chars as number | null) ?? null;
  const maxFocusLoss: number | null = (thresholdResult[0]?.max_focus_loss as number | null) ?? null;
  const focusLossThreshold = maxFocusLoss ?? FOCUS_LOSS_THRESHOLD;
  const minEditEvents = (thresholdResult[0]?.min_edit_events as number | null) ?? MIN_EDIT_EVENTS;
  const minResponseLength = (thresholdResult[0]?.min_response_length as number | null) ?? MIN_RESPONSE_LENGTH_FOR_EDIT_CHECK;
  const starterCode: string = (thresholdResult[0]?.starter as string) ?? '';

  // Count paste events that exceed the threshold (or all paste events if no threshold set)
  const pasteResult = maxPasteChars !== null
    ? await sql`
        SELECT COUNT(*)::int AS count
        FROM paste_events
        WHERE submission_id = ${submissionId}
          AND char_count > ${maxPasteChars}
      `
    : await sql`
        SELECT COUNT(*)::int AS count
        FROM paste_events
        WHERE submission_id = ${submissionId}
      `;
  const pasteCount: number = (pasteResult[0]?.count as number) ?? 0;

  if (pasteCount > 0) {
    const thresholdNote = maxPasteChars !== null ? ` (>${maxPasteChars} chars each)` : '';
    flag_reasons.push(`paste_detected: ${pasteCount} paste event(s) recorded${thresholdNote}`);
  }

  // Count focus-loss events for the session that owns this submission
  const focusResult = await sql`
    SELECT COUNT(*)::int AS count
    FROM focus_events fe
    JOIN submissions s ON s.session_id = fe.session_id
    WHERE s.id = ${submissionId}
  `;
  const focusLossCount: number = (focusResult[0]?.count as number) ?? 0;

  if (focusLossCount > focusLossThreshold) {
    flag_reasons.push(
      `focus_loss_exceeded: ${focusLossCount} focus-loss event(s) (threshold: ${focusLossThreshold})`
    );
  }

  // Count edit events and check response length (excluding starter code)
  const editResult = await sql`
    SELECT COUNT(*)::int AS edit_count, s.response_text
    FROM edit_events ee
    JOIN submissions s ON s.id = ee.submission_id
    WHERE ee.submission_id = ${submissionId}
    GROUP BY s.response_text
  `;

  if (editResult.length > 0) {
    const editCount: number = editResult[0].edit_count as number;
    const responseText: string = (editResult[0].response_text as string) ?? '';
    const addedLength = Math.max(0, responseText.length - starterCode.length);

    if (
      addedLength > minResponseLength &&
      editCount < minEditEvents
    ) {
      flag_reasons.push(
        `low_edit_count: only ${editCount} edit event(s) for a ${addedLength}-character response (excluding ${starterCode.length}-character starter code)`
      );
    }
  } else {
    const submissionResult = await sql`
      SELECT response_text FROM submissions WHERE id = ${submissionId}
    `;
    const responseText: string = (submissionResult[0]?.response_text as string) ?? '';
    const addedLength = Math.max(0, responseText.length - starterCode.length);

    if (addedLength > minResponseLength) {
      flag_reasons.push(
        `low_edit_count: 0 edit event(s) for a ${addedLength}-character response (excluding ${starterCode.length}-character starter code)`
      );
    }
  }

  return {
    is_flagged: flag_reasons.length > 0,
    flag_reasons,
  };
}
