import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { sql } from '@/lib/db';
import Navbar from '@/app/components/Navbar';
import Link from 'next/link';

export default async function FeedbackPage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'instructor') redirect('/login');

  let feedbackRows: any[] = [];
  let tableExists = true;

  try {
    feedbackRows = await sql`
      SELECT f.id, f.rating, f.comments, f.challenges, f.improvements, f.malfunctions, f.attachment_url, f.submitted_at, u.username
      FROM feedback f
      INNER JOIN users u ON u.id = f.user_id
      ORDER BY f.submitted_at DESC
    `;
  } catch (err) {
    // Table doesn't exist yet — migration not run
    if ((err as Error).message.includes('does not exist')) {
      tableExists = false;
    } else {
      throw err;
    }
  }

  if (!tableExists) {
    return (
      <div className="page">
        <Navbar username={session.user.name ?? undefined} role="instructor" />
        <main className="main">
          <div className="container">
            <div className="page-header">
              <h1 className="page-title">Participant Feedback</h1>
            </div>
            <div className="card">
              <p style={{ color: 'var(--text3)', textAlign: 'center', padding: '2rem' }}>
                Feedback table not found. Run the migration: <code style={{ background: 'var(--bg3)', padding: '2px 6px', borderRadius: 4 }}>psql $DATABASE_URL &lt; migrations/0007_feedback.sql</code>
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const avgRating = feedbackRows.length > 0
    ? (feedbackRows.reduce((sum, f) => sum + (f.rating as number || 0), 0) / feedbackRows.filter(f => f.rating).length).toFixed(1)
    : 'N/A';

  return (
    <div className="page">
      <Navbar username={session.user.name ?? undefined} role="instructor" />
      <main className="main">
        <div className="container">
          <div className="breadcrumb">
            <Link href="/instructor">Dashboard</Link>
            <span className="breadcrumb-sep">/</span>
            <span>Feedback</span>
          </div>
          <div className="page-header">
            <h1 className="page-title">Participant Feedback</h1>
            <p className="page-sub">{feedbackRows.length} responses · Avg rating: {avgRating}</p>
          </div>

          {feedbackRows.length === 0 ? (
            <div className="card">
              <p style={{ color: 'var(--text3)', textAlign: 'center', padding: '2rem' }}>No feedback yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {feedbackRows.map((f) => (
                <div key={f.id as string} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div>
                      <span style={{ fontWeight: 600, color: 'var(--text)', fontSize: 15 }}>{f.username as string}</span>
                      {f.rating && (
                        <span style={{ marginLeft: '0.75rem', fontSize: 13, color: 'var(--text3)' }}>
                          Rating: {f.rating}/5
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--text3)' }}>
                      {new Date(f.submitted_at as string).toLocaleString()}
                    </span>
                  </div>

                  {f.challenges && (
                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>Challenges</div>
                      <p style={{ color: 'var(--text2)', fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap', margin: 0 }}>
                        {f.challenges as string}
                      </p>
                    </div>
                  )}

                  {f.malfunctions && (
                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--red)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>Malfunctions</div>
                      <p style={{ color: 'var(--text2)', fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap', margin: 0 }}>
                        {f.malfunctions as string}
                      </p>
                    </div>
                  )}

                  {f.improvements && (
                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent2)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>Improvements</div>
                      <p style={{ color: 'var(--text2)', fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap', margin: 0 }}>
                        {f.improvements as string}
                      </p>
                    </div>
                  )}

                  {f.comments && (
                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>Additional Comments</div>
                      <p style={{ color: 'var(--text2)', fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap', margin: 0 }}>
                        {f.comments as string}
                      </p>
                    </div>
                  )}

                  {f.attachment_url && (
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>Attachment</div>
                      <a href={f.attachment_url as string} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-ghost" style={{ fontSize: 12 }}>
                        View Document →
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
