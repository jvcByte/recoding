import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { sql } from '@/lib/db';
import { audit } from '@/lib/audit';
import bcrypt from 'bcryptjs';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.role || session.user.role !== 'instructor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { new_password: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (typeof body.new_password !== 'string' || body.new_password.length < 8) {
    return NextResponse.json(
      { error: 'new_password must be at least 8 characters' },
      { status: 400 }
    );
  }

  const userId = params.id;

  // Only allow resetting participant accounts, not other instructors
  const userRows = await sql`
    SELECT id, username, role FROM users WHERE id = ${userId} LIMIT 1
  `;

  if (userRows.length === 0) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  if (userRows[0].role !== 'participant') {
    return NextResponse.json(
      { error: 'Can only reset passwords for participant accounts' },
      { status: 403 }
    );
  }

  const hash = await bcrypt.hash(body.new_password, 12);

  await sql`UPDATE users SET password_hash = ${hash} WHERE id = ${userId}`;

  await audit(session.user.id, 'user.password_reset', 'user', userId, {
    target_username: userRows[0].username as string,
  });

  return NextResponse.json({ message: 'Password reset successfully' });
}
