import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/app/components/Navbar';
import ChangePasswordForm from './ChangePasswordForm';

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/login');

  return (
    <div className="page">
      <Navbar username={session.user.name ?? undefined} role="participant" />
      <main className="main">
        <div className="container">
          <div className="breadcrumb">
            <Link href="/participant">Exercises</Link>
            <span className="breadcrumb-sep">/</span>
            <span>Settings</span>
          </div>
          <div className="page-header">
            <h1 className="page-title">Settings</h1>
            <p className="page-sub">Manage your account.</p>
          </div>
          <ChangePasswordForm />
        </div>
      </main>
    </div>
  );
}
