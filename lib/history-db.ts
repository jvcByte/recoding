/**
 * History database connections — read-only connections to past exam DBs.
 * Configure via env vars: HISTORY_DB_1_URL, HISTORY_DB_1_LABEL, etc.
 */

import { neon } from '@neondatabase/serverless';

export interface HistoryDb {
  index: number;
  label: string;
  sql: ReturnType<typeof neon>;
}

let _cache: HistoryDb[] | null = null;

export function getHistoryDbs(): HistoryDb[] {
  if (_cache) return _cache;

  const dbs: HistoryDb[] = [];
  let i = 1;

  while (true) {
    const url = process.env[`HISTORY_DB_${i}_URL`];
    if (!url) break;

    const label = process.env[`HISTORY_DB_${i}_LABEL`] ?? `Cohort ${i}`;
    dbs.push({ index: i, label, sql: neon(url) });
    i++;
  }

  _cache = dbs;
  return dbs;
}

export interface HistorySubmission {
  question_index: number;
  response_text: string;
  is_final: boolean;
  tests_passed: boolean | null;
  submitted_at: string;
}

export interface HistorySession {
  cohort: string;
  cohortIndex: number;
  exercise_title: string;
  exercise_slug: string;
  score: number | null;
  passed: boolean | null;
  closed_at: string | null;
  question_count: number;
  final_count: number;
  submissions?: HistorySubmission[];
}

/**
 * Fetch past session results for a participant across all history DBs.
 * Matches by username since user IDs may differ across DBs.
 */
export async function getParticipantHistory(username: string): Promise<HistorySession[]> {
  const dbs = getHistoryDbs();
  if (dbs.length === 0) return [];

  const results: HistorySession[] = [];

  await Promise.all(
    dbs.map(async (db) => {
      try {
        const rows = await db.sql`
          SELECT
            e.title        AS exercise_title,
            e.slug         AS exercise_slug,
            e.question_count,
            s.score,
            s.passed,
            s.closed_at,
            (SELECT COUNT(*)::int FROM submissions sub
             WHERE sub.session_id = s.id AND sub.is_final = true) AS final_count
          FROM sessions s
          JOIN exercises e ON e.id = s.exercise_id
          JOIN users u ON u.id = s.user_id
          WHERE u.username = ${username}
            AND s.closed_at IS NOT NULL
          ORDER BY s.closed_at DESC
        ` as Record<string, unknown>[];

        for (const row of rows) {
          results.push({
            cohort: db.label,
            cohortIndex: db.index,
            exercise_title: row.exercise_title as string,
            exercise_slug: row.exercise_slug as string,
            score: row.score as number | null,
            passed: row.passed as boolean | null,
            closed_at: row.closed_at as string | null,
            question_count: row.question_count as number,
            final_count: row.final_count as number,
          });
        }
      } catch (err) {
        console.error(`[history-db] Failed to query cohort "${db.label}":`, err);
      }
    })
  );

  // Sort by closed_at descending across all cohorts
  return results.sort((a, b) => {
    if (!a.closed_at) return 1;
    if (!b.closed_at) return -1;
    return new Date(b.closed_at).getTime() - new Date(a.closed_at).getTime();
  });
}

/**
 * Fetch all past results across all history DBs for instructor view.
 */
export async function getAllHistoryResults(): Promise<Array<HistorySession & { username: string }>> {
  const dbs = getHistoryDbs();
  if (dbs.length === 0) return [];

  const results: Array<HistorySession & { username: string }> = [];

  await Promise.all(
    dbs.map(async (db) => {
      try {
        const rows = await db.sql`
          SELECT
            u.username,
            e.title        AS exercise_title,
            e.slug         AS exercise_slug,
            e.question_count,
            s.id           AS session_id,
            s.score,
            s.passed,
            s.closed_at,
            (SELECT COUNT(*)::int FROM submissions sub
             WHERE sub.session_id = s.id AND sub.is_final = true) AS final_count
          FROM sessions s
          JOIN exercises e ON e.id = s.exercise_id
          JOIN users u ON u.id = s.user_id
          WHERE s.closed_at IS NOT NULL
          ORDER BY u.username, s.closed_at DESC
        ` as Record<string, unknown>[];

        for (const row of rows) {
          // Fetch submissions for this session
          let submissions: HistorySubmission[] = [];
          try {
            const subRows = await db.sql`
              SELECT question_index, response_text, is_final, tests_passed, submitted_at
              FROM submissions
              WHERE session_id = ${row.session_id as string}
              ORDER BY question_index
            ` as Record<string, unknown>[];
            submissions = subRows.map((s) => ({
              question_index: s.question_index as number,
              response_text: s.response_text as string,
              is_final: s.is_final as boolean,
              tests_passed: s.tests_passed as boolean | null,
              submitted_at: s.submitted_at as string,
            }));
          } catch { /* ignore */ }

          results.push({
            username: row.username as string,
            cohort: db.label,
            cohortIndex: db.index,
            exercise_title: row.exercise_title as string,
            exercise_slug: row.exercise_slug as string,
            score: row.score as number | null,
            passed: row.passed as boolean | null,
            closed_at: row.closed_at as string | null,
            question_count: row.question_count as number,
            final_count: row.final_count as number,
            submissions,
          });
        }
      } catch (err) {
        console.error(`[history-db] Failed to query cohort "${db.label}":`, err);
      }
    })
  );

  return results.sort((a, b) => {
    if (!a.closed_at) return 1;
    if (!b.closed_at) return -1;
    return new Date(b.closed_at).getTime() - new Date(a.closed_at).getTime();
  });
}
