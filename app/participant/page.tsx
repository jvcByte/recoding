import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { sql } from '@/lib/db';
import Link from 'next/link';
import Navbar from '@/app/components/Navbar';
import { InboxIcon } from 'lucide-react';
import { getParticipantHistory } from '@/lib/history-db';
import { formatWAT } from '@/lib/format';

export const dynamic = 'force-dynamic';

interface Exercise {
  id: string;
  slug: string;
  title: string;
  question_count: number;
  pass_mark: number | null;
  min_questions_required: number | null;
  flag_fails: boolean;
  max_paste_chars: number | null;
  max_focus_loss: number | null;
}

export default async function ExerciseCataloguePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/login');

  const userId = session.user.id;
  let exercises: Exercise[] = [];
  let fetchError = false;
  let fetchErrorMessage = '';
  let sessionStatusMap = new Map<string, 'active' | 'completed'>();
  let sessionScoreMap = new Map<string, number>();
  let sessionPassedMap = new Map<string, boolean | null>();
  let sessionFailReasonsMap = new Map<string, string[]>();

  try {
    const rows = await sql`
      SELECT e.id, e.slug, e.title, e.question_count, e.pass_mark,
             e.min_questions_required, e.flag_fails, e.max_paste_chars, e.max_focus_loss
      FROM exercises e
      INNER JOIN exercise_assignments ea ON ea.exercise_id = e.id
      WHERE ea.user_id = ${userId} AND e.enabled = true
      ORDER BY e.title
    `;
    exercises = rows as unknown as Exercise[];
  } catch (err) {
    fetchError = true;
    fetchErrorMessage = (err as Error).message ?? String(err);
    console.error('[participant/page] Failed to load exercises:', err);
  }

  if (!fetchError && exercises.length > 0) {    try {
      const ids = exercises.map((e) => e.id);
      const sessions = await sql`
        SELECT exercise_id, closed_at, score, passed,
          (SELECT SUM(CASE WHEN sub.is_final THEN 1 ELSE 0 END)::int
           FROM submissions sub WHERE sub.session_id = s.id) AS final_count,
          (SELECT COALESCE(SUM(pe.char_count), 0)::int
           FROM paste_events pe
           JOIN submissions sub ON sub.id = pe.submission_id
           WHERE sub.session_id = s.id) AS total_paste_chars,
          (SELECT COUNT(*)::int FROM focus_events fe WHERE fe.session_id = s.id) AS focus_loss_count,
          (SELECT BOOL_OR(sub.is_flagged AND jsonb_array_length(sub.dismissed_flags) < COALESCE(array_length(sub.flag_reasons,1),0))
           FROM submissions sub WHERE sub.session_id = s.id) AS has_active_flag
        FROM sessions s
        WHERE s.user_id = ${userId}
          AND s.exercise_id = ANY(${ids}::uuid[])
      `;
      for (const s of sessions) {
        const eid = s.exercise_id as string;
        const ex = exercises.find((e) => e.id === eid);
        if (s.closed_at) sessionStatusMap.set(eid, 'completed');
        else sessionStatusMap.set(eid, 'active');
        if (s.score !== null && s.score !== undefined) sessionScoreMap.set(eid, s.score as number);
        sessionPassedMap.set(eid, s.passed as boolean | null);

        // Compute human-readable fail reasons
        if (s.passed === false && ex) {
          const reasons: string[] = [];
          const score = Number(s.score ?? 0);
          const finalCount = (s.final_count as number) ?? 0;
          const totalPasteChars = (s.total_paste_chars as number) ?? 0;
          const focusLossCount = (s.focus_loss_count as number) ?? 0;
          const hasActiveFlag = (s.has_active_flag as boolean) ?? false;
          if (ex.pass_mark !== null && score < ex.pass_mark) reasons.push(`Your score of ${score.toFixed(1)}% is below the minimum pass mark of ${ex.pass_mark}%`);
          if (ex.min_questions_required !== null && finalCount < ex.min_questions_required) reasons.push(`You completed ${finalCount} question${finalCount !== 1 ? 's' : ''} but at least ${ex.min_questions_required} are required to pass`);
          if (ex.flag_fails && hasActiveFlag) reasons.push(`One or more of your answers were flagged for academic integrity violations`);
          if (ex.max_paste_chars !== null && totalPasteChars > ex.max_paste_chars) reasons.push(`The total amount of text pasted into your answers exceeded the allowed limit`);
          if (ex.max_focus_loss !== null && focusLossCount > ex.max_focus_loss) reasons.push(`You left or minimised the exercise window ${focusLossCount} time${focusLossCount !== 1 ? 's' : ''}, which exceeded the allowed number of focus losses`);
          sessionFailReasonsMap.set(eid, reasons);
        }
      }
    } catch (err) {
      // Session data failed — exercises still show, just without status
      console.error('[participant/page] Failed to load session data:', err);
    }
  }

  // Fetch history from past exam DBs
  const history = await getParticipantHistory(session.user.name ?? '').catch(() => []);

  return (
    <div className="page">
      <Navbar username={session.user.name ?? undefined} role="participant" />
      <main className="main">
        <div className="container">
          <div className="page-header">
            <h1 className="page-title">My Exercises</h1>
            <p className="page-sub">Welcome back, {session.user.name ?? 'participant'}. Select an exercise to begin.</p>
          </div>

          {fetchError && (
            <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
              Failed to load exercises: {fetchErrorMessage || 'Unknown error'}. Please refresh the page.
            </div>
          )}

          {!fetchError && exercises.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
              <InboxIcon size={40} style={{ margin: '0 auto 0.75rem', color: 'var(--text3)', display: 'block' }} />
              <p style={{ color: 'var(--text2)', fontWeight: 600, marginBottom: '0.25rem' }}>No exercises assigned</p>
              <p style={{ color: 'var(--text3)', fontSize: 13 }}>Contact your instructor to get access.</p>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {exercises.map((exercise) => {
              const status = sessionStatusMap.get(exercise.id);
              const score = sessionScoreMap.get(exercise.id);
              const passed = sessionPassedMap.get(exercise.id);
              const failReasons = sessionFailReasonsMap.get(exercise.id) ?? [];
              const numScore = score !== undefined ? Number(score) : null;
              const hasPassed = passed === true;
              const hasFailed = passed === false;

              return (
                <div key={exercise.id}>
                  <div className="exercise-card">
                    <div className="exercise-card-info">
                      <div className="exercise-card-title">{exercise.title}</div>
                      <div className="exercise-card-meta">
                        {exercise.question_count} question{exercise.question_count !== 1 ? 's' : ''}
                      </div>
                    </div>
                    {status === 'completed' ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        {numScore !== null && (
                          <span className={`badge ${hasFailed ? 'badge-red' : hasPassed ? 'badge-green' : 'badge-gray'}`} style={{ fontSize: 11 }}>
                            {numScore.toFixed(1)}%{hasPassed ? ' ✓ Pass' : hasFailed ? ' ✗ Fail' : ''}
                          </span>
                        )}
                        <span className="badge badge-green" style={{ fontSize: 11 }}>Completed</span>
                      </div>
                    ) : (
                      <Link href={`/participant/session/${exercise.id}`} className="btn btn-primary">
                        {status === 'active' ? 'Continue →' : 'Start →'}
                      </Link>
                    )}
                  </div>
                  {hasFailed && failReasons.length > 0 && (
                    <div style={{
                      marginTop: '-0.25rem',
                      padding: '0.65rem 1rem',
                      background: 'rgba(239,68,68,0.06)',
                      border: '1px solid rgba(239,68,68,0.2)',
                      borderTop: 'none',
                      borderRadius: '0 0 var(--radius-sm) var(--radius-sm)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.2rem',
                    }}>
                      {failReasons.map((r, i) => (
                        <span key={i} style={{ fontSize: 12, color: 'var(--red)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ fontSize: 10 }}>✕</span> {r}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Past Recoding History */}
          {history.length > 0 && (
            <div style={{ marginTop: '2rem' }}>
              <div className="page-header" style={{ marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)' }}>Past Recoding</h2>
                <p className="page-sub">Your results from previous recoding sessions.</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {history.map((h, i) => (
                  <div key={i} className="exercise-card" style={{ cursor: 'default' }}>
                    <div className="exercise-card-info">
                      <div className="exercise-card-title">{h.exercise_title}</div>
                      <div className="exercise-card-meta" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <span>{h.cohort}</span>
                        {h.closed_at && <span>{formatWAT(h.closed_at)}</span>}
                        <span>{h.final_count}/{h.question_count} questions submitted</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      {h.score !== null && (
                        <span className={`badge ${h.passed === false ? 'badge-red' : h.passed === true ? 'badge-green' : 'badge-gray'}`} style={{ fontSize: 11 }}>
                          {Number(h.score).toFixed(1)}%{h.passed === true ? ' ✓ Pass' : h.passed === false ? ' ✗ Fail' : ''}
                        </span>
                      )}
                      <span className="badge badge-gray" style={{ fontSize: 11 }}>Completed</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
