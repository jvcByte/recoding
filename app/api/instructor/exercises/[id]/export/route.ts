import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { sql } from '@/lib/db';
import { stringify } from 'csv-stringify/sync';

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

    const csvData = rows.map((row) =>
      headers.map((h) => {
        const val = row[h];
        return Array.isArray(val) ? val.join(';') : val ?? '';
      })
    );

    const csv = stringify([headers, ...csvData]);

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="submissions.csv"',
      },
    });
  }

  return NextResponse.json(rows);
}
