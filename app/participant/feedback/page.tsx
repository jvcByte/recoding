import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Navbar from '@/app/components/Navbar';
import FeedbackForm from '@/app/participant/feedback/FeedbackForm';

export default async function FeedbackPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/login');

  return (
    <div className="page">
      <Navbar
        username={session.user.name ?? undefined}
        role="participant"
        links={[{ href: '/participant', label: 'My Exercises' }]}
      />
      <main className="main">
        <div className="container" style={{ maxWidth: 800 }}>
          <div className="page-header">
            <h1 className="page-title">Feedback</h1>
            <p className="page-sub">Help us improve the platform</p>
          </div>
          <FeedbackForm />
        </div>
      </main>
    </div>
  );
}
