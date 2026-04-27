'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BarChart2, Table2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts';

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

interface Props {
  analytics: ExerciseAnalytics[];
  totalSessions: number;
  totalCompleted: number;
  totalPassed: number;
  totalFailed: number;
  totalFlagged: number;
}

const COLORS = {
  passed: '#22c55e',
  failed: '#ef4444',
  flagged: '#f97316',
  score: '#6366f1',
  completed: '#64748b',
};

export default function AnalyticsPanel({
  analytics, totalSessions, totalCompleted, totalPassed, totalFailed, totalFlagged,
}: Props) {
  const [view, setView] = useState<'table' | 'chart'>('table');

  const filtered = analytics.filter((a) => a.total_sessions > 0);

  // Shorten titles for chart labels
  const chartData = filtered.map((a) => ({
    name: a.title.length > 12 ? a.title.slice(0, 12) + '…' : a.title,
    fullTitle: a.title,
    exercise_id: a.exercise_id,
    Passed: a.passed_sessions,
    Failed: a.failed_sessions,
    Flagged: a.flagged_sessions,
    'Avg Score': a.avg_score !== null ? Number(a.avg_score) : 0,
    Completed: a.completed_sessions,
  }));

  const passRate = (totalPassed + totalFailed) > 0
    ? Math.round((totalPassed / (totalPassed + totalFailed)) * 100)
    : null;

  return (
    <div className="card" style={{ marginBottom: '1.25rem' }}>
      <div className="card-header">
        <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          Cohort Analytics
        </span>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button
            className={`btn btn-sm ${view === 'table' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setView('table')}
          >
            <Table2 size={12} /> Table
          </button>
          <button
            className={`btn btn-sm ${view === 'chart' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setView('chart')}
          >
            <BarChart2 size={12} /> Chart
          </button>
        </div>
      </div>

      {/* Cohort summary tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Sessions', value: totalSessions, color: 'var(--text)' },
          { label: 'Completed', value: totalCompleted, color: 'var(--text2)' },
          { label: 'Passed', value: totalPassed, color: COLORS.passed },
          { label: 'Failed', value: totalFailed, color: COLORS.failed },
          { label: 'Flagged', value: totalFlagged, color: COLORS.flagged },
          ...(passRate !== null ? [{ label: 'Pass Rate', value: `${passRate}%`, color: passRate >= 50 ? COLORS.passed : COLORS.failed }] : []),
        ].map(({ label, value, color }) => (
          <div key={label} style={{ textAlign: 'center', padding: '0.65rem', background: 'var(--bg3)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color }}>{value}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      {view === 'table' ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Exercise</th>
                <th>Sessions</th>
                <th>Completed</th>
                <th>Avg Score</th>
                <th>Avg Qs</th>
                <th>Pass / Fail</th>
                <th>Flagged</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => {
                const pr = (a.passed_sessions + a.failed_sessions) > 0
                  ? Math.round((a.passed_sessions / (a.passed_sessions + a.failed_sessions)) * 100)
                  : null;
                const cr = Math.round((a.completed_sessions / a.total_sessions) * 100);
                return (
                  <tr key={a.exercise_id}>
                    <td style={{ fontWeight: 600 }}>
                      <Link href={`/instructor/exercises/${a.exercise_id}/submissions`} style={{ color: 'var(--text)', textDecoration: 'none' }}>
                        {a.title}
                      </Link>
                    </td>
                    <td style={{ color: 'var(--text2)' }}>{a.total_sessions}</td>
                    <td>
                      <span style={{ color: cr === 100 ? COLORS.passed : cr > 50 ? 'var(--text2)' : COLORS.flagged, fontWeight: 600 }}>
                        {a.completed_sessions}
                      </span>
                      <span style={{ color: 'var(--text3)', fontSize: 11 }}> ({cr}%)</span>
                    </td>
                    <td style={{ fontWeight: 600, color: a.avg_score !== null ? (Number(a.avg_score) >= 50 ? COLORS.passed : COLORS.failed) : 'var(--text3)' }}>
                      {a.avg_score !== null ? `${Number(a.avg_score).toFixed(1)}%` : '—'}
                    </td>
                    <td style={{ color: 'var(--text2)' }}>
                      {a.avg_questions_answered !== null ? Number(a.avg_questions_answered).toFixed(1) : '—'}
                    </td>
                    <td>
                      {pr !== null ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                          <span style={{ color: COLORS.passed, display: 'flex', alignItems: 'center', gap: 2 }}>
                            <CheckCircle size={11} /> {a.passed_sessions}
                          </span>
                          <span style={{ color: 'var(--text3)' }}>/</span>
                          <span style={{ color: COLORS.failed, display: 'flex', alignItems: 'center', gap: 2 }}>
                            <XCircle size={11} /> {a.failed_sessions}
                          </span>
                          <span className={`badge ${pr >= 50 ? 'badge-green' : 'badge-red'}`} style={{ fontSize: 10 }}>
                            {pr}%
                          </span>
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text3)', fontSize: 12 }}>No constraints</span>
                      )}
                    </td>
                    <td>
                      {a.flagged_sessions > 0 ? (
                        <span style={{ color: COLORS.flagged, display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                          <AlertTriangle size={11} /> {a.flagged_sessions}
                          <span style={{ color: 'var(--text3)' }}>
                            ({Math.round((a.flagged_sessions / a.total_sessions) * 100)}%)
                          </span>
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text3)', fontSize: 12 }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Pass / Fail / Flagged bar chart */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: '0.5rem' }}>Pass / Fail / Flagged per Exercise</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text3)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text3)' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12 }}
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.fullTitle ?? ''}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Passed" fill={COLORS.passed} radius={[3, 3, 0, 0]} />
                <Bar dataKey="Failed" fill={COLORS.failed} radius={[3, 3, 0, 0]} />
                <Bar dataKey="Flagged" fill={COLORS.flagged} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Avg Score bar chart */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: '0.5rem' }}>Average Score per Exercise (%)</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text3)' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'var(--text3)' }} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12 }}
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.fullTitle ?? ''}
                  formatter={(v) => v != null ? [`${Number(v).toFixed(1)}%`, 'Avg Score'] : ['—', 'Avg Score']}
                />
                <Bar dataKey="Avg Score" fill={COLORS.score} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
