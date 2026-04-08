import Link from 'next/link';
import { sql } from '@/lib/db';
import LiveMonitor from './LiveMonitor';

interface Exercise {
  id: string;
  slug: string;
  title: string;
  enabled: boolean;
  question_count: number;
  assigned_user_ids: string[];
}

async function getExercises(): Promise<Exercise[]> {
  const rows = await sql`
    SELECT e.id, e.slug, e.title, e.enabled, e.question_count,
           COALESCE(
             json_agg(ea.user_id) FILTER (WHERE ea.user_id IS NOT NULL),
             '[]'
           ) AS assigned_user_ids
    FROM exercises e
    LEFT JOIN exercise_assignments ea ON ea.exercise_id = e.id
    GROUP BY e.id, e.slug, e.title, e.enabled, e.question_count
    ORDER BY e.title
  `;
  return rows as Exercise[];
}

export default async function InstructorDashboard() {
  const exercises = await getExercises();

  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: 900, margin: '0 auto', padding: 24 }}>
      <h1 style={{ fontSize: 24, marginBottom: 4 }}>Instructor Dashboard</h1>
      <p style={{ color: '#64748b', marginBottom: 24 }}>
        Manage exercises, review submissions, and monitor live sessions.
      </p>

      {/* Exercise list */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>Exercises</h2>
        {exercises.length === 0 ? (
          <p style={{ color: '#94a3b8' }}>No exercises found.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                <th style={th}>Title</th>
                <th style={th}>Status</th>
                <th style={th}>Questions</th>
                <th style={th}>Assigned</th>
                <th style={th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {exercises.map((ex) => (
                <tr key={ex.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={td}>{ex.title}</td>
                  <td style={td}>
                    <span style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 600,
                      background: ex.enabled ? '#dcfce7' : '#fee2e2',
                      color: ex.enabled ? '#166534' : '#991b1b',
                    }}>
                      {ex.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </td>
                  <td style={td}>{ex.question_count}</td>
                  <td style={td}>{ex.assigned_user_ids.length} participant(s)</td>
                  <td style={td}>
                    <Link
                      href={`/instructor/exercises/${ex.id}`}
                      style={{ color: '#2563eb', textDecoration: 'none', marginRight: 12 }}
                    >
                      Manage
                    </Link>
                    <Link
                      href={`/instructor/exercises/${ex.id}/submissions`}
                      style={{ color: '#7c3aed', textDecoration: 'none' }}
                    >
                      Submissions
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Live monitor */}
      <section>
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>Live Monitor</h2>
        <LiveMonitor />
      </section>
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
