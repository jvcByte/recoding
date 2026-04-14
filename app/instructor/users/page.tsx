import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { sql } from '@/lib/db';
import Link from 'next/link';
import Navbar from '@/app/components/Navbar';
import UserManager from './UserManager';

interface User { id: string; username: string; role: string; created_at: string; }

async function getUsers(): Promise<User[]> {
  try {
    const rows = await sql`SELECT id, username, role, created_at FROM users ORDER BY created_at DESC`;
    return rows as unknown as User[];
  } catch { return []; }
}

export default async function UsersPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'instructor') redirect('/login');
  const users = await getUsers();

  return (
    <div className="page">
      <Navbar username={session.user.name ?? undefined} role="instructor" />
      <main className="main">
        <div className="container">
          <div className="breadcrumb">
            <Link href="/instructor">Dashboard</Link>
            <span className="breadcrumb-sep">/</span>
            <span>Users</span>
          </div>
          <div className="page-header">
            <h1 className="page-title">User Management</h1>
            <p className="page-sub">Create accounts, reset passwords, and manage participants.</p>
          </div>
          <UserManager initialUsers={users} currentUserId={session.user.id} />
        </div>
      </main>
    </div>
  );
}
