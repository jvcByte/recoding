import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Navbar from '@/app/components/Navbar';
import SessionView from './SessionView';

interface Props { params: { id: string }; }

export default async function SessionPage({ params }: Props) {
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
        <div className="container">
          <SessionView exerciseId={params.id} />
        </div>
      </main>
    </div>
  );
}
