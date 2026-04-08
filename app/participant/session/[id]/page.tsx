import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import SessionView from './SessionView';

interface PageProps {
  params: { id: string };
}

export default async function SessionPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/login');
  }

  return <SessionView exerciseId={params.id} />;
}
