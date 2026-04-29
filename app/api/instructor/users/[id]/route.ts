import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';
import { audit } from '@/lib/audit';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'instructor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = params.id;
  if (userId === session.user.id) {
    return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 403 });
  }
  const rows = await sql`SELECT id, username, role FROM users WHERE id = ${userId} LIMIT 1`;
  if (rows.length === 0) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  if (rows[0].role === 'instructor') {
    return NextResponse.json({ error: 'Cannot delete instructor accounts' }, { status: 403 });
  }
  // Delete all dependent data before removing the user
  await sql`
    DELETE FROM paste_events WHERE submission_id IN (
      SELECT sub.id FROM submissions sub
      JOIN sessions s ON s.id = sub.session_id WHERE s.user_id = ${userId}
    )
  `;
  await sql`
    DELETE FROM autosave_history WHERE submission_id IN (
      SELECT sub.id FROM submissions sub
      JOIN sessions s ON s.id = sub.session_id WHERE s.user_id = ${userId}
    )
  `;
  await sql`
    DELETE FROM edit_events WHERE submission_id IN (
      SELECT sub.id FROM submissions sub
      JOIN sessions s ON s.id = sub.session_id WHERE s.user_id = ${userId}
    )
  `;
  await sql`DELETE FROM submissions WHERE session_id IN (SELECT id FROM sessions WHERE user_id = ${userId})`;
  await sql`DELETE FROM focus_events WHERE session_id IN (SELECT id FROM sessions WHERE user_id = ${userId})`;
  await sql`DELETE FROM sessions WHERE user_id = ${userId}`;
  await sql`DELETE FROM feedback WHERE user_id = ${userId}`;
  await sql`DELETE FROM exercise_assignments WHERE user_id = ${userId}`;
  await sql`DELETE FROM users WHERE id = ${userId}`;
  await audit(session.user.id, 'user.deleted', 'user', userId, { username: rows[0].username });
  return NextResponse.json({ message: 'User deleted' });
}
