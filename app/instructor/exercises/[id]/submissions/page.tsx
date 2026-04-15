import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';
import Navbar from '@/app/components/Navbar';
import SubmissionsTable from './SubmissionsTable';

interface Props { params: { id: string }; }
interface SubmissionRow {
  id: string; session_id: string; question_index: number;
  is_final: boolean; is_flagged: boolean; flag_reasons: string[] | null;
  submitted_at: string; username: string;
}

export default async function SubmissionListPage({ params }: Props) {
  const { id: exerciseId } = params;
  const session = await getServerSession(authOptions);

  const exerciseRows = await sql`SELECT id, title FROM exercises WHERE id = ${exerciseId}`;
  if (exerciseRows.length === 0) notFound();
  const exercise = exerciseRows[0] as { id: string; title: string };

  const rows = await sql`
    SELECT sub.id, sub.session_id, sub.question_index, sub.is_final, sub.is_flagged,
           sub.flag_reasons, sub.submitted_at, u.username
    FROM submissions sub
    JOIN sessions s ON s.id = sub.session_id
    JOIN users u ON u.id = s.user_id
    WHERE s.exercise_id = ${exerciseId}
    ORDER BY u.username, sub.question_index
  `;
  const submissions = rows as unknown as SubmissionRow[];
  const flagged = submissions.filter((s) => s.is_flagged).length;
  const final = submissions.filter((s) => s.is_final).length;

  return (
    <div className="page">
      <Navbar username={session?.user?.name ?? undefined} role="instructor" />
      <main className="main">
        <div className="container">
          <div className="breadcrumb">
            <Link href="/instructor">Dashboard</Link>
            <span className="breadcrumb-sep">/</span>
            <Link href={`/instructor/exercises/${exerciseId}`}>{exercise.title}</Link>
            <span className="breadcrumb-sep">/</span>
            <span>Submissions</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div className="page-header" style={{ marginBottom: 0 }}>
              <h1 className="page-title">Submissions</h1>
              <p className="page-sub">{exercise.title}</p>
            </div>
            <a href={`/api/instructor/exercises/${exerciseId}/export?format=csv`} className="btn btn-success">
              Export CSV
            </a>
          </div>

          <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
            <div className="stat-tile">
              <span className="label">Total</span>
              <span className="value">{submissions.length}</span>
            </div>
            <div className="stat-tile">
              <span className="label">Final</span>
              <span className="value" style={{ color: 'var(--green)' }}>{final}</span>
            </div>
            <div className="stat-tile">
              <span className="label">Flagged</span>
              <span className="value" style={{ color: 'var(--red)' }}>{flagged}</span>
            </div>
          </div>

          <div className="card">
            <SubmissionsTable submissions={submissions} />
          </div>
        </div>
      </main>
    </div>
  );
}
