import Link from 'next/link';
import { notFound } from 'next/navigation';
import { sql } from '@/lib/db';

interface Props {
  params: { id: string };
}

interface SubmissionRow {
  id: string;
  session_id: string;
  question_index: number;
  is_final: boolean;
  is_flagged: boolean;
  flag_reasons: string[] | null;
  submitted_at: string;
  username: string;
}

export default async function SubmissionListPage({ params }: Props) {
  const { id: exerciseId } = params;

  // Verify exercise exists
  const exerciseRows = await sql`
    SELECT id, title FROM exercises WHERE id = ${exerciseId}
  `;
  if (exerciseRows.length === 0) notFound();
  const exercise = exerciseRows[0] as { id: string; title: string };

  const rows = await sql`
    SELECT
      sub.id,
      sub.session_id,
      sub.question_index,
      sub.is_final,
      sub.is_flagged,
      sub.flag_reasons,
      sub.submitted_at,
      u.username
    FROM submissions sub
    JOIN sessions s ON s.id = sub.session_id
    JOIN users u ON u.id = s.user_id
    WHERE s.exercise_id = ${exerciseId}
    ORDER BY u.username, sub.question_index
  `;

  const submissions = rows as SubmissionRow[];

  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: 900, margin: '0 auto', padding: 24 }}>
      <div style={{ marginBottom: 8 }}>
        <Link href={`/instructor/exercises/${exerciseId}`} style={{ color: '#64748b', fontSize: 13, textDecoration: 'none' }}>
          ← {exercise.title}
        </Link>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, margin: 0 }}>Submissions — {exercise.title}</h1>
        <a
          href={`/api/instructor/exercises/${exerciseId}/export?format=csv`}
          style={{
            padding: '8px 16px',
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

      {submissions.length === 0 ? (
        <p style={{ color: '#94a3b8' }}>No submissions yet.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#f1f5f9' }}>
              <th style={th}>Participant</th>
              <th style={th}>Question #</th>
              <th style={th}>Final</th>
              <th style={th}>Flag</th>
              <th style={th}>Submitted At</th>
              <th style={th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((sub) => (
              <tr
                key={sub.id}
                style={{
                  borderBottom: '1px solid #e2e8f0',
                  background: sub.is_flagged ? '#fff7ed' : undefined,
                }}
              >
                <td style={td}>{sub.username}</td>
                <td style={td}>{sub.question_index + 1}</td>
                <td style={td}>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 600,
                    background: sub.is_final ? '#dcfce7' : '#f1f5f9',
                    color: sub.is_final ? '#166534' : '#475569',
                  }}>
                    {sub.is_final ? 'Final' : 'Draft'}
                  </span>
                </td>
                <td style={td}>
                  {sub.is_flagged ? (
                    <span
                      title={sub.flag_reasons?.join(', ') ?? ''}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 700,
                        background: '#fee2e2',
                        color: '#991b1b',
                        cursor: 'help',
                      }}
                    >
                      🚩 Flagged
                    </span>
                  ) : (
                    <span style={{ color: '#94a3b8', fontSize: 12 }}>—</span>
                  )}
                </td>
                <td style={{ ...td, color: '#64748b', fontSize: 12 }}>
                  {new Date(sub.submitted_at).toLocaleString()}
                </td>
                <td style={td}>
                  <Link
                    href={`/instructor/submissions/${sub.id}`}
                    style={{ color: '#2563eb', textDecoration: 'none', fontSize: 13 }}
                  >
                    Review
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const th: React.CSSProperties = {
  textAlign: 'left',
  padding: '8px 12px',
  fontWeight: 600,
  fontSize: 13,
  color: '#475569',
};

const td: React.CSSProperties = {
  padding: '10px 12px',
  verticalAlign: 'middle',
};
