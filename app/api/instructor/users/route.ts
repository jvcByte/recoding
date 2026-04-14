import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';
import { audit } from '@/lib/audit';
import bcrypt from 'bcryptjs';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'instructor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const rows = await sql`SELECT id, username, role, created_at FROM users ORDER BY created_at DESC`;
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'instructor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  let body: { username: string; password: string; role: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { username, password, role } = body;
  if (!username?.trim()) return NextResponse.json({ error: 'username is required' }, { status: 400 });
  if (!password || password.length < 8) return NextResponse.json({ error: 'password must be at least 8 characters' }, { status: 400 });
  if (!['participant', 'instructor'].includes(role)) return NextResponse.json({ error: 'invalid role' }, { status: 400 });

  const existing = await sql`SELECT id FROM users WHERE username = ${username.trim()} LIMIT 1`;
  if (existing.length > 0) return NextResponse.json({ error: 'Username already taken' }, { status: 409 });

  const hash = await bcrypt.hash(password, 12);
  const rows = await sql`
    INSERT INTO users (username, password_hash, role)
    VALUES (${username.trim()}, ${hash}, ${role})
    RETURNING id, username, role, created_at
  `;
  await audit(session.user.id, 'user.created', 'user', rows[0].id as string, { username: rows[0].username, role });
  return NextResponse.json(rows[0], { status: 201 });
}
