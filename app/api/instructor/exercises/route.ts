import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';
import { audit } from '@/lib/audit';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== 'instructor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rows = await sql`
    SELECT e.id, e.slug, e.title, e.enabled, e.question_count,
           COALESCE(json_agg(ea.user_id) FILTER (WHERE ea.user_id IS NOT NULL), '[]') AS assigned_user_ids
    FROM exercises e
    LEFT JOIN exercise_assignments ea ON ea.exercise_id = e.id
    GROUP BY e.id, e.slug, e.title, e.enabled, e.question_count
    ORDER BY e.title
  `;

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== 'instructor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { title: string; slug?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  if (!body.title?.trim()) {
    return NextResponse.json({ error: 'title is required' }, { status: 400 });
  }

  // Auto-generate slug from title if not provided
  const slug = body.slug?.trim() ||
    body.title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  // Check slug uniqueness
  const existing = await sql`SELECT id FROM exercises WHERE slug = ${slug} LIMIT 1`;
  if (existing.length > 0) {
    return NextResponse.json({ error: `Slug "${slug}" is already taken` }, { status: 409 });
  }

  const rows = await sql`
    INSERT INTO exercises (slug, title, enabled, question_count)
    VALUES (${slug}, ${body.title.trim()}, false, 0)
    RETURNING id, slug, title, enabled, question_count
  `;

  await audit(session.user.id, 'exercise.created', 'exercise', rows[0].id as string, { title: body.title, slug });

  return NextResponse.json(rows[0], { status: 201 });
}
