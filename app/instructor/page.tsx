import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';
import LiveMonitor from './LiveMonitor';
import CreateExercise from './CreateExercise';
import ExercisesTable from './ExercisesTable';
import AnalyticsPanel from './AnalyticsPanel';
import Navbar from '@/app/components/Navbar';
import { Radio, Users } from 'lucide-react';
import { getAllHistoryResults, type HistorySession } from '@/lib/history-db';
import { formatWAT } from '@/lib/format';

interface Exercise {
  id: string;
  slug: string;
  title: string;
  enabled: boolean;
  question_count: number;
  assigned_user_ids: string[];
}

interface ExerciseAnalytics {
  exercise_id: string;
  title: string;
  total_sessions: number;
  completed_sessions: number;
  passed_sessions: number;
  failed_sessions: number;
  flagged_sessions: number;
  avg_score: number | null;
  avg_questions_answered: number | null;
}

async function getExercises(): Promise<Exercise[]> {
  try {
    const rows = await sql`
      SELECT e.id, e.slug, e.title, e.enabled, e.question_count,
             COALESCE(json_agg(ea.user_id) FILTER (WHERE ea.user_id IS NOT NULL), '[]') AS assigned_user_ids
      FROM exercises e
      LEFT JOIN exercise_assignments ea ON ea.exercise_id = e.id
      GROUP BY e.id, e.slug, e.title, e.enabled, e.question_count
      ORDER BY e.title
    `;
    return rows as unknown as Exercise[];
  } catch {
    return [];
  }
}

async function getAnalytics(): Promise<ExerciseAnalytics[]> {
  try {
    const rows = await sql`
      SELECT
        e.id AS exercise_id,
        e.title,
        COUNT(s.id)::int AS total_sessions,
        SUM(CASE WHEN s.closed_at IS NOT NULL THEN 1 ELSE 0 END)::int AS completed_sessions,
        SUM(CASE WHEN s.passed = true THEN 1 ELSE 0 END)::int AS passed_sessions,
        SUM(CASE WHEN s.passed = false THEN 1 ELSE 0 END)::int AS failed_sessions,
        SUM(CASE WHEN EXISTS (
          SELECT 1 FROM submissions sub WHERE sub.session_id = s.id AND sub.is_flagged = true
        ) THEN 1 ELSE 0 END)::int AS flagged_sessions,
        ROUND(AVG(s.score)::numeric, 1) AS avg_score,
        ROUND(AVG(
          (SELECT SUM(CASE WHEN sub.is_final THEN 1 ELSE 0 END) FROM submissions sub WHERE sub.session_id = s.id)
        )::numeric, 1) AS avg_questions_answered
      FROM exercises e
      LEFT JOIN sessions s ON s.exercise_id = e.id
      GROUP BY e.id, e.title
      ORDER BY e.title
    `;
    return rows as unknown as ExerciseAnalytics[];
  } catch {
    return [];
  }
}

export default async function InstructorDashboard() {
  const session = await getServerSession(authOptions);
  const [exercises, analytics] = await Promise.all([getExercises(), getAnalytics()]);

  const enabled = exercises.filter((e) => e.enabled).length;
  const totalAssigned = exercises.reduce((s, e) => s + e.assigned_user_ids.length, 0);

  let participantCount = 0;
  try {
    const r = await sql`SELECT COUNT(*)::int AS count FROM users WHERE role = 'participant'`;
    participantCount = (r[0]?.count as number) ?? 0;
  } catch { /* ignore */ }

  // Cohort-level totals
  const totalSessions = analytics.reduce((s, a) => s + a.total_sessions, 0);
  const totalCompleted = analytics.reduce((s, a) => s + a.completed_sessions, 0);
  const totalPassed = analytics.reduce((s, a) => s + a.passed_sessions, 0);
  const totalFailed = analytics.reduce((s, a) => s + a.failed_sessions, 0);
  const totalFlagged = analytics.reduce((s, a) => s + a.flagged_sessions, 0);

  return (
    <div className="page">
      <Navbar
        username={session?.user?.name ?? undefined}
        role="instructor"
      />
      <main className="main">
        <div className="container">
          <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 className="page-title">Instructor Dashboard</h1>
              <p className="page-sub">Manage exercises, review submissions, and monitor live sessions.</p>
            </div>
            <CreateExercise />
          </div>

          {/* Stats */}
          <div className="stats-grid">
            <div className="stat-tile">
              <span className="label">Total Exercises</span>
              <span className="value">{exercises.length}</span>
            </div>
            <div className="stat-tile">
              <span className="label">Enabled</span>
              <span className="value">{enabled}</span>
            </div>
            <div className="stat-tile">
              <span className="label">Disabled</span>
              <span className="value">{exercises.length - enabled}</span>
            </div>
            <div className="stat-tile">
              <span className="label">Assignments</span>
              <span className="value">{totalAssigned}</span>
            </div>
            <Link href="/instructor/users" className="stat-tile" style={{ textDecoration: 'none', cursor: 'pointer' }}>
              <span className="label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Users size={10} /> Participants
              </span>
              <span className="value" style={{ color: 'var(--accent2)' }}>{participantCount}</span>
              <span className="sub">Manage →</span>
            </Link>
          </div>

          {/* Cohort Analytics */}
          {totalSessions > 0 && (
            <AnalyticsPanel
              analytics={analytics}
              totalSessions={totalSessions}
              totalCompleted={totalCompleted}
              totalPassed={totalPassed}
              totalFailed={totalFailed}
              totalFlagged={totalFlagged}
            />
          )}

          <ExercisesTable exercises={exercises} />

          {/* Live monitor */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Live Monitor</span>
              <span className="badge badge-green" style={{ fontSize: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Radio size={10} /> LIVE
              </span>
            </div>
            <LiveMonitor />
          </div>

          {/* Past Cohorts History */}
          <PastCohorts />
        </div>
      </main>
    </div>
  );
}

async function PastCohorts() {
  const history = await getAllHistoryResults().catch(() => []);
  if (history.length === 0) return null;

  // Group by cohort
  const cohorts = new Map<string, Array<HistorySession & { username: string }>>();
  for (const h of history) {
    if (!cohorts.has(h.cohort)) cohorts.set(h.cohort, []);
    cohorts.get(h.cohort)!.push(h);
  }

  return (
    <div style={{ marginTop: '2rem' }}>
      <div className="section-header">
        <span className="section-title">Past Recoding</span>
      </div>
      {Array.from(cohorts.entries()).map(([cohort, rows]) => {
        const passed = rows.filter((r) => r.passed === true).length;
        const failed = rows.filter((r) => r.passed === false).length;
        return (
          <div key={cohort} className="card" style={{ marginBottom: '1rem' }}>
            <div className="card-header">
              <span className="card-title">{cohort}</span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <span className="badge badge-green">{passed} passed</span>
                <span className="badge badge-red">{failed} failed</span>
                <span className="badge badge-gray">{rows.length} total</span>
              </div>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Participant</th>
                    <th>Exercise</th>
                    <th>Score</th>
                    <th>Result</th>
                    <th>Questions</th>
                    <th>Completed</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{r.username}</td>
                      <td>{r.exercise_title}</td>
                      <td style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {r.score !== null ? `${Number(r.score).toFixed(1)}%` : '—'}
                      </td>
                      <td>
                        {r.passed === true
                          ? <span className="badge badge-green">Pass</span>
                          : r.passed === false
                            ? <span className="badge badge-red">Fail</span>
                            : <span className="badge badge-gray">—</span>}
                      </td>
                      <td style={{ color: 'var(--text2)' }}>{r.final_count}/{r.question_count}</td>
                      <td style={{ color: 'var(--text3)' }}>{r.closed_at ? formatWAT(r.closed_at) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
