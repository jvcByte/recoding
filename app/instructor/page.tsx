import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';
import LiveMonitor from './LiveMonitor';
import CreateExercise from './CreateExercise';
import Navbar from '@/app/components/Navbar';
import { Radio, Users } from 'lucide-react';

interface Exercise {
  id: string;
  slug: string;
  title: string;
  enabled: boolean;
  question_count: number;
  assigned_user_ids: string[];
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

export default async function InstructorDashboard() {
  const session = await getServerSession(authOptions);
  const exercises = await getExercises();

  const enabled = exercises.filter((e) => e.enabled).length;
  const totalAssigned = exercises.reduce((s, e) => s + e.assigned_user_ids.length, 0);

  let participantCount = 0;
  try {
    const r = await sql`SELECT COUNT(*)::int AS count FROM users WHERE role = 'participant'`;
    participantCount = (r[0]?.count as number) ?? 0;
  } catch { /* ignore */ }

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

          {/* Exercises table */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-header">
              <span className="card-title">Exercises</span>
            </div>
            {exercises.length === 0 ? (
              <p style={{ color: 'var(--text3)', fontSize: 13 }}>No exercises yet. Create one above.</p>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Status</th>
                      <th>Questions</th>
                      <th>Assigned</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exercises.map((ex) => (
                      <tr key={ex.id}>
                        <td style={{ fontWeight: 600 }}>{ex.title}</td>
                        <td>
                          <span className={`badge ${ex.enabled ? 'badge-green' : 'badge-gray'}`}>
                            {ex.enabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text2)' }}>{ex.question_count}</td>
                        <td style={{ color: 'var(--text2)' }}>{ex.assigned_user_ids.length}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <Link href={`/instructor/exercises/${ex.id}`} className="btn btn-secondary btn-sm">
                              Manage
                            </Link>
                            <Link href={`/instructor/exercises/${ex.id}/submissions`} className="btn btn-ghost btn-sm">
                              Submissions
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

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
        </div>
      </main>
    </div>
  );
}
