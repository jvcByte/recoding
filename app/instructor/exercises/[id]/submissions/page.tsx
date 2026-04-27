import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';
import { formatWAT } from '@/lib/format';
import Navbar from '@/app/components/Navbar';
import SubmissionsTable from './SubmissionsTable';

interface Props { params: { id: string }; }

export interface ParticipantRow {
  session_id: string;
  username: string;
  score: number | null;
  passed: boolean | null;
  total_questions: number;
  answered: number;
  final_count: number;
  is_flagged: boolean;
  flag_count: number;
  last_submitted_at: string;
  // individual submissions for drill-down
  submissions: {
    id: string;
    question_index: number;
    is_final: boolean;
    is_flagged: boolean;
    submitted_at: string;
  }[];
}

export default async function SubmissionListPage({ params }: Props) {
  const { id: exerciseId } = params;
  const session = await getServerSession(authOptions);

  const exerciseRows = await sql`SELECT id, title, pass_mark, question_count FROM exercises WHERE id = ${exerciseId}`;
  if (exerciseRows.length === 0) notFound();
  const exercise = exerciseRows[0] as { id: string; title: string; pass_mark: number | null; question_count: number };

  // One row per session (participant), aggregated
  const rows = await sql`
    SELECT
      s.id                                                        AS session_id,
      u.username,
      s.score,
      s.passed,
      e.question_count                                            AS total_questions,
      COUNT(sub.id)::int                                          AS answered,
      COUNT(sub.id) FILTER (WHERE sub.is_final = true)::int       AS final_count,
      BOOL_OR(sub.is_flagged)                                     AS is_flagged,
      COUNT(sub.id) FILTER (WHERE sub.is_flagged = true)::int     AS flag_count,
      MAX(sub.submitted_at)                                       AS last_submitted_at,
      JSON_AGG(
        JSON_BUILD_OBJECT(
          'id',             sub.id,
          'question_index', sub.question_index,
          'is_final',       sub.is_final,
          'is_flagged',     sub.is_flagged,
          'submitted_at',   sub.submitted_at
        ) ORDER BY sub.question_index
      ) FILTER (WHERE sub.id IS NOT NULL)                         AS submissions
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    JOIN exercises e ON e.id = s.exercise_id
    LEFT JOIN submissions sub ON sub.session_id = s.id
    WHERE s.exercise_id = ${exerciseId}
    GROUP BY s.id, u.username, s.score, s.passed, e.question_count
    ORDER BY u.username
  `;

  const participants: ParticipantRow[] = (rows as Record<string, unknown>[]).map((r) => ({
    session_id: r.session_id as string,
    username: r.username as string,
    score: r.score != null ? Number(r.score) : null,
    passed: r.passed != null ? (r.passed as boolean) : null,
    total_questions: r.total_questions as number,
    answered: r.answered as number,
    final_count: r.final_count as number,
    is_flagged: r.is_flagged as boolean,
    flag_count: r.flag_count as number,
    last_submitted_at: formatWAT(r.last_submitted_at as string),
    submissions: (r.submissions as { id: string; question_index: number; is_final: boolean; is_flagged: boolean; submitted_at: string }[] | null) ?? [],
  }));

  const totalParticipants = participants.length;
  const flaggedParticipants = participants.filter((p) => p.is_flagged).length;
  const completedParticipants = participants.filter((p) => p.final_count === p.total_questions).length;

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
              <span className="label">Participants</span>
              <span className="value">{totalParticipants}</span>
            </div>
            <div className="stat-tile">
              <span className="label">Completed</span>
              <span className="value" style={{ color: 'var(--green)' }}>{completedParticipants}</span>
            </div>
            <div className="stat-tile">
              <span className="label">Flagged</span>
              <span className="value" style={{ color: 'var(--red)' }}>{flaggedParticipants}</span>
            </div>
          </div>

          <div className="card">
            <SubmissionsTable participants={participants} />
          </div>
        </div>
      </main>
    </div>
  );
}
