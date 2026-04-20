import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { rating?: number; comments?: string; challenges?: string; improvements?: string; malfunctions?: string; attachment_url?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { rating, comments, challenges, improvements, malfunctions, attachment_url } = body;

  if (rating && (rating < 1 || rating > 5)) {
    return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
  }

  await sql`
    INSERT INTO feedback (user_id, rating, comments, challenges, improvements, malfunctions, attachment_url)
    VALUES (${session.user.id}, ${rating ?? null}, ${comments ?? null}, ${challenges ?? null}, ${improvements ?? null}, ${malfunctions ?? null}, ${attachment_url ?? null})
  `;

  return NextResponse.json({ success: true });
}
