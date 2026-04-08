import Link from 'next/link';
import { notFound } from 'next/navigation';
import { sql } from '@/lib/db';
import TypingReplay from './TypingReplay';
import ReviewNote from './ReviewNote';

interface Props {
  params: { id: string };
}

export default async function SubmissionDetailPage({ params }: Props) {
  const { id: submissionId } = params;

  // Fetch submission
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
    id: string;
    session_id: string;
    question_index: number;
    response_text: string;
    is_final: boolean;
    is_flagged: boolean;
    flag_reasons: string[] | null;
    review_note: string | null;
    submitted_at: string;
    exercise_id: string;
    username: string;
  };

  // Fetch audit data in parallel
  const [autosaveRows, pasteRows, focusRows, editRows] = await Promise.all([
    sql`
      SELECT id, response_text, saved_at
      FROM autosave_history
      WHERE submission_id = ${submissionId}
      ORDER BY saved_at ASC
    `,
    sql`
      SELECT id, char_count, occurred_at
      FROM paste_events
      WHERE submission_id = ${submissionId}
      ORDER BY occurred_at ASC
    `,
    sql`
      SELECT id, lost_at, regained_at, duration_ms
      FROM focus_events
      WHERE session_id = ${sub.session_id}
      ORDER BY lost_at ASC
    `,
    sql`
      SELECT id, event_type, position, char_count, occurred_at
      FROM edit_events
      WHERE submission_id = ${submissionId}
      ORDER BY occurred_at ASC
    `,
  ]);

  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: 900, margin: '0 auto', padding: 24 }}>
      {/* Breadcrumb */}
      <div style={{ marginBottom: 8, fontSize: 13, color: '#64748b' }}>
        <Link href="/instructor" style={{ color: '#64748b', textDecoration: 'none' }}>Dashboard</Link>
        {' / '}
        <Link href={`/instructor/exercises/${sub.exercise_id}/submissions`} style={{ color: '#64748b', textDecoration: 'none' }}>
          Submissions
        </Link>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, margin: 0 }}>
            Submission — {sub.username}
          </h1>
          <p style={{ color: '#64748b', fontSize: 13, margin: '4px 0 0' }}>
            Question {sub.question_index + 1} · {new Date(sub.submitted_at).toLocaleString()}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {sub.is_flagged && (
            <span style={{
              padding: '4px 10px',
              background: '#fee2e2',
              color: '#991b1b',
              borderRadius: 4,
              fontWeight: 700,
              fontSize: 13,
            }}>
              🚩 Flagged
            </span>
          )}
          <span style={{
            padding: '4px 10px',
            background: sub.is_final ? '#dcfce7' : '#f1f5f9',
            color: sub.is_final ? '#166534' : '#475569',
            borderRadius: 4,
            fontWeight: 600,
            fontSize: 13,
          }}>
            {sub.is_final ? 'Final' : 'Draft'}
          </span>
          <a
            href={`/api/instructor/exercises/${sub.exercise_id}/export?format=csv`}
            style={{
              padding: '6px 14px',
              background: '#059669',
              color: '#fff',
              borderRadius: 6,
              textDecoration: 'none',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Export CSV
          </a>
        </div>
      </div>

      {/* Flag reasons */}
      {sub.is_flagged && sub.flag_reasons && sub.flag_reasons.length > 0 && (
        <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 6, padding: '10px 14px', marginBottom: 20 }}>
          <strong style={{ fontSize: 13 }}>Flag reasons:</strong>{' '}
          <span style={{ fontSize: 13 }}>{sub.flag_reasons.join(', ')}</span>
        </div>
      )}

      {/* Response text */}
      <section style={sectionStyle}>
        <h2 style={sectionTitle}>Response</h2>
        <pre style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: 6,
          padding: 12,
          whiteSpace: 'pre-wrap',
          fontSize: 13,
          margin: 0,
          maxHeight: 300,
          overflowY: 'auto',
        }}>
          {sub.response_text || <span style={{ color: '#94a3b8' }}>(empty)</span>}
        </pre>
      </section>

      {/* Typing Replay */}
      <section style={sectionStyle}>
        <h2 style={sectionTitle}>Typing Replay ({editRows.length} edit events)</h2>
        <TypingReplay
          editEvents={editRows as { id: string; event_type: 'insert' | 'delete'; position: number; char_count: number; occurred_at: string }[]}
          finalText={sub.response_text}
        />
      </section>

      {/* Autosave history */}
      <section style={sectionStyle}>
        <h2 style={sectionTitle}>Autosave History ({autosaveRows.length} saves)</h2>
        {autosaveRows.length === 0 ? (
          <p style={{ color: '#94a3b8', fontSize: 13 }}>No autosaves recorded.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(autosaveRows as { id: string; response_text: string; saved_at: string }[]).map((save, i) => (
              <div key={save.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', fontSize: 13 }}>
                <span style={{ color: '#94a3b8', minWidth: 24 }}>{i + 1}.</span>
                <span style={{ color: '#64748b', minWidth: 160 }}>{new Date(save.saved_at).toLocaleString()}</span>
                <span style={{ color: '#475569' }}>{save.response_text.length} chars</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Paste events */}
      <section style={sectionStyle}>
        <h2 style={sectionTitle}>Paste Events ({pasteRows.length})</h2>
        {pasteRows.length === 0 ? (
          <p style={{ color: '#94a3b8', fontSize: 13 }}>No paste events.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                <th style={th}>#</th>
                <th style={th}>Chars Pasted</th>
                <th style={th}>Occurred At</th>
              </tr>
            </thead>
            <tbody>
              {(pasteRows as { id: string; char_count: number; occurred_at: string }[]).map((ev, i) => (
                <tr key={ev.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={td}>{i + 1}</td>
                  <td style={{ ...td, color: '#dc2626', fontWeight: 600 }}>{ev.char_count}</td>
                  <td style={{ ...td, color: '#64748b' }}>{new Date(ev.occurred_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Focus events */}
      <section style={sectionStyle}>
        <h2 style={sectionTitle}>Focus-Loss Events ({focusRows.length})</h2>
        {focusRows.length === 0 ? (
          <p style={{ color: '#94a3b8', fontSize: 13 }}>No focus-loss events.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                <th style={th}>#</th>
                <th style={th}>Lost At</th>
                <th style={th}>Regained At</th>
                <th style={th}>Duration (ms)</th>
              </tr>
            </thead>
            <tbody>
              {(focusRows as { id: string; lost_at: string; regained_at: string | null; duration_ms: number | null }[]).map((ev, i) => (
                <tr key={ev.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={td}>{i + 1}</td>
                  <td style={{ ...td, color: '#64748b' }}>{new Date(ev.lost_at).toLocaleString()}</td>
                  <td style={{ ...td, color: '#64748b' }}>
                    {ev.regained_at ? new Date(ev.regained_at).toLocaleString() : '—'}
                  </td>
                  <td style={{ ...td, color: ev.duration_ms != null ? '#ea580c' : '#94a3b8' }}>
                    {ev.duration_ms != null ? ev.duration_ms : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Review note */}
      <section style={sectionStyle}>
        <h2 style={sectionTitle}>Review Note</h2>
        <ReviewNote submissionId={sub.id} initialNote={sub.review_note} />
      </section>
    </div>
  );
}

const sectionStyle: React.CSSProperties = {
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 8,
  padding: 20,
  marginBottom: 20,
};

const sectionTitle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 600,
  marginBottom: 12,
  marginTop: 0,
};

const th: React.CSSProperties = {
  textAlign: 'left',
  padding: '6px 10px',
  fontWeight: 600,
  fontSize: 12,
  color: '#475569',
};

const td: React.CSSProperties = {
  padding: '8px 10px',
  verticalAlign: 'middle',
};
