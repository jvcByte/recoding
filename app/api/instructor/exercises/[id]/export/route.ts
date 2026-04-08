import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { sql } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.role || session.user.role !== 'instructor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const exerciseId = params.id;
  const format = req.nextUrl.searchParams.get('format') ?? 'json';

  const rows = await sql`
    SELECT
      u.username,
      sub.question_index,
      sub.response_text,
      sub.is_final,
      sub.is_flagged,
      sub.flag_reasons,
      sub.submitted_at,
      sub.review_note
    FROM submissions sub
    JOIN sessions s ON s.id = sub.session_id
    JOIN users u ON u.id = s.user_id
    WHERE s.exercise_id = ${exerciseId}
    ORDER BY u.username, sub.question_index
  `;

  if (format === 'csv') {
    const headers = [
      'username',
      'question_index',
      'response_text',
      'is_final',
      'is_flagged',
      'flag_reasons',
      'submitted_at',
      'review_note',
    ];

    const escape = (val: unknown): string => {
      if (val === null || val === undefined) return '';
      const str = Array.isArray(val) ? val.join(';') : String(val);
      // Wrap in quotes if contains comma, quote, or newline
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csvLines = [
      headers.join(','),
      ...rows.map((row) =>
        headers.map((h) => escape(row[h])).join(',')
      ),
    ];

    return new NextResponse(csvLines.join('\n'), {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="submissions.csv"',
      },
    });
  }

  return NextResponse.json(rows);
}
