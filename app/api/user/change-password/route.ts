import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: { current_password: string; new_password: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { current_password, new_password } = body;
  if (!current_password || !new_password) {
    return NextResponse.json({ error: 'current_password and new_password are required' }, { status: 400 });
  }
  if (new_password.length < 8) {
    return NextResponse.json({ error: 'new_password must be at least 8 characters' }, { status: 400 });
  }

  const rows = await sql`SELECT password_hash FROM users WHERE id = ${session.user.id} LIMIT 1`;
  if (rows.length === 0) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const valid = await bcrypt.compare(current_password, rows[0].password_hash as string);
  if (!valid) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });

  const hash = await bcrypt.hash(new_password, 12);
  await sql`UPDATE users SET password_hash = ${hash} WHERE id = ${session.user.id}`;
  return NextResponse.json({ message: 'Password changed successfully' });
}
