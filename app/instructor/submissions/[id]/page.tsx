import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';
import TypingReplay from './TypingReplay';
import ReviewNote from './ReviewNote';
import Navbar from '@/app/components/Navbar';

interface Props { params: { id: string }; }

import { Flag, Check } from 'lucide-react';

export default async function SubmissionDetailPage({ params }: Props) {
  const { id: submissionId } = params;
  const session = await getServerSession(authOptions);

  const subRows = await sql`
    SELECT sub.id, sub.session_id, sub.question_index, sub.response_text,
           sub.is_final, sub.is_flagged, sub.flag_reasons, sub.review_note, sub.submitted_at,
           s.exercise_id, u.username
    FROM submissions sub
    JOIN sessions s ON s.id = sub.session_id
    JOIN users u ON u.id = s.user_id
    WHERE sub.id = ${submissionId}
  `;
  if (subRows.length === 0) notFound();

  const sub = subRows[0] as {
    id: string; session_id: string; question_index: number; response_text: string;
    is_final: boolean; is_flagged: boolean; flag_reasons: string[] | null;
    review_note: string | null; submitted_at: string; exercise_id: string; username: string;
  };

  const [autosaveRows, pasteRows, focusRows, editRows] = await Promise.all([
    sql`SELECT id, response_text, saved_at FROM autosave_history WHERE submission_id = ${submissionId} ORDER BY saved_at ASC`,
    sql`SELECT id, char_count, occurred_at FROM paste_events WHERE submission_id = ${submissionId} ORDER BY occurred_at ASC`,
    sql`SELECT id, lost_at, regained_at, duration_ms FROM focus_events WHERE session_id = ${sub.session_id} ORDER BY lost_at ASC`,
    sql`SELECT id, event_type, position, char_count, occurred_at FROM edit_events WHERE submission_id = ${submissionId} ORDER BY occurred_at ASC`,
  ]);

  return (
    <div className="page">
      <Navbar
        username={session?.user?.name ?? undefined}
        role="instructor"
        links={[{ href: '/instructor', label: 'Dashboard' }]}
      />
      <main className="main">
        <div className="container">
          <div className="breadcrumb">
            <Link href="/instructor">Dashboard</Link>
            <span className="breadcrumb-sep">/</span>
            <Link href={`/instructor/exercises/${sub.exercise_id}/submissions`}>Submissions</Link>
            <span className="breadcrumb-sep">/</span>
            <span>{sub.username} — Q{sub.question_index + 1}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div className="page-header" style={{ marginBottom: 0 }}>
              <h1 className="page-title">{sub.username}</h1>
              <p className="page-sub">Question {sub.question_index + 1} · {new Date(sub.submitted_at).toLocaleString()}</p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              {sub.is_flagged && <span className="badge badge-red" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Flag size={10} /> Flagged</span>}
              <span className={`badge ${sub.is_final ? 'badge-green' : 'badge-gray'}`}>
                {sub.is_final ? 'Final' : 'Draft'}
              </span>
              <a href={`/api/instructor/exercises/${sub.exercise_id}/export?format=csv`} className="btn btn-success btn-sm">
                Export CSV
              </a>
            </div>
          </div>

          {sub.is_flagged && sub.flag_reasons && sub.flag_reasons.length > 0 && (
            <div className="alert alert-warning" style={{ marginBottom: '1.25rem' }}>
              <strong>Flag reasons:</strong> {sub.flag_reasons.join(' · ')}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Response */}
            <div className="card">
              <div className="card-header"><span className="card-title">Response</span></div>
              <pre style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '1rem', whiteSpace: 'pre-wrap', fontSize: 13, margin: 0, maxHeight: 320, overflowY: 'auto', color: 'var(--text)', lineHeight: 1.7 }}>
                {sub.response_text || <span style={{ color: 'var(--text3)' }}>(empty)</span>}
              </pre>
            </div>

            {/* Typing Replay */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Typing Replay</span>
                <span className="badge badge-purple">{editRows.length} events</span>
              </div>
              <TypingReplay
                editEvents={editRows as { id: string; event_type: 'insert' | 'delete'; position: number; char_count: number; occurred_at: string }[]}
                finalText={sub.response_text}
              />
            </div>

            {/* Stats row */}
            <div className="stats-grid">
              <div className="stat-tile">
                <span className="label">Autosaves</span>
                <span className="value">{autosaveRows.length}</span>
              </div>
              <div className="stat-tile">
                <span className="label">Paste Events</span>
                <span className="value" style={{ color: pasteRows.length > 0 ? 'var(--red)' : 'var(--text)' }}>{pasteRows.length}</span>
              </div>
              <div className="stat-tile">
                <span className="label">Focus Losses</span>
                <span className="value" style={{ color: focusRows.length > 3 ? 'var(--orange)' : 'var(--text)' }}>{focusRows.length}</span>
              </div>
              <div className="stat-tile">
                <span className="label">Edit Events</span>
                <span className="value">{editRows.length}</span>
              </div>
            </div>

            {/* Paste events */}
            {pasteRows.length > 0 && (
              <div className="card">
                <div className="card-header">
                  <span className="card-title">Paste Events</span>
                  <span className="badge badge-red">{pasteRows.length}</span>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>#</th><th>Chars Pasted</th><th>Occurred At</th></tr></thead>
                    <tbody>
                      {(pasteRows as { id: string; char_count: number; occurred_at: string }[]).map((ev, i) => (
                        <tr key={ev.id}>
                          <td style={{ color: 'var(--text3)' }}>{i + 1}</td>
                          <td style={{ color: 'var(--red)', fontWeight: 700 }}>{ev.char_count}</td>
                          <td style={{ color: 'var(--text3)' }}>{new Date(ev.occurred_at).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Focus events */}
            {focusRows.length > 0 && (
              <div className="card">
                <div className="card-header">
                  <span className="card-title">Focus-Loss Events</span>
                  <span className="badge badge-orange">{focusRows.length}</span>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>#</th><th>Lost At</th><th>Regained At</th><th>Duration (ms)</th></tr></thead>
                    <tbody>
                      {(focusRows as { id: string; lost_at: string; regained_at: string | null; duration_ms: number | null }[]).map((ev, i) => (
                        <tr key={ev.id}>
                          <td style={{ color: 'var(--text3)' }}>{i + 1}</td>
                          <td style={{ color: 'var(--text3)' }}>{new Date(ev.lost_at).toLocaleString()}</td>
                          <td style={{ color: 'var(--text3)' }}>{ev.regained_at ? new Date(ev.regained_at).toLocaleString() : '—'}</td>
                          <td style={{ color: ev.duration_ms != null ? 'var(--orange)' : 'var(--text3)', fontWeight: ev.duration_ms != null ? 600 : 400 }}>
                            {ev.duration_ms != null ? `${(ev.duration_ms / 1000).toFixed(1)}s` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Review note */}
            <div className="card">
              <div className="card-header"><span className="card-title">Review Note</span></div>
              <ReviewNote submissionId={sub.id} initialNote={sub.review_note} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
