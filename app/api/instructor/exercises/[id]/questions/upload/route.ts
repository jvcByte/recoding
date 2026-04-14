import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';
import { audit } from '@/lib/audit';

/**
 * POST /api/instructor/exercises/:id/questions/upload
 *
 * Accepts a multipart form with a single .md file.
 * Splits the file on ## Question N or ## Drill N headings
 * and bulk-inserts the questions, replacing existing ones.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== 'instructor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const exerciseId = params.id;

  // Verify exercise exists
  const exerciseRows = await sql`SELECT id, slug FROM exercises WHERE id = ${exerciseId} LIMIT 1`;
  if (exerciseRows.length === 0) {
    return NextResponse.json({ error: 'Exercise not found' }, { status: 404 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const file = formData.get('file') as File | null;
  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  if (!file.name.endsWith('.md')) {
    return NextResponse.json({ error: 'Only .md files are supported' }, { status: 400 });
  }

  if (file.size > 512 * 1024) {
    return NextResponse.json({ error: 'File too large (max 512KB)' }, { status: 413 });
  }

  const content = await file.text();

  // Detect question type from form field
  const questionType = (formData.get('type') as string) ?? 'written';
  const language = (formData.get('language') as string) ?? 'text';

  // Split on any markdown heading that starts a question/drill section.
  // Handles: ## Question 1, ### Question 1, ## Drill 1, # Question 1, etc.
  // Also handles --- horizontal rule separators between questions.
  const lines = content.split('\n');
  const questionPattern = /^#{1,4}\s+(?:Question|Drill|Exercise)\s+\d+/i;

  const sections: string[] = [];
  let current: string[] = [];

  for (const line of lines) {
    if (questionPattern.test(line.trim())) {
      // Save previous section if it has content
      if (current.length > 0) {
        const text = current.join('\n').trim();
        if (text) sections.push(text);
      }
      current = [line];
    } else {
      current.push(line);
    }
  }
  // Push last section
  if (current.length > 0) {
    const text = current.join('\n').trim();
    if (text) sections.push(text);
  }

  // Filter out sections that don't start with a question heading
  const parts = sections.filter((s) => questionPattern.test(s.split('\n')[0].trim()));

  if (parts.length === 0) {
    return NextResponse.json({
      error: 'No questions found. File must contain headings like "## Question 1", "### Question 1", or "## Drill 1".',
    }, { status: 422 });
  }

  // Extract starter code from first ```go block if present
  function extractStarter(text: string): string {
    const match = text.match(/```(?:go|python|javascript)\n([\s\S]*?)```/);
    return match ? match[1] : '';
  }

  // Delete existing questions and replace
  await sql`DELETE FROM questions WHERE exercise_id = ${exerciseId}`;

  const inserted: { index: number; preview: string }[] = [];

  for (let i = 0; i < parts.length; i++) {
    const text = parts[i].trim();
    const starter = questionType === 'code' ? extractStarter(text) : '';

    await sql`
      INSERT INTO questions (exercise_id, question_index, text, type, language, starter)
      VALUES (${exerciseId}, ${i}, ${text}, ${questionType}, ${language}, ${starter})
    `;

    inserted.push({
      index: i,
      preview: text.split('\n')[0].replace(/^#+\s*/, '').slice(0, 60),
    });
  }

  // Update question_count on exercise
  await sql`UPDATE exercises SET question_count = ${parts.length} WHERE id = ${exerciseId}`;

  await audit(session.user.id, 'questions.uploaded', 'exercise', exerciseId, {
    count: parts.length,
    filename: file.name,
  });

  return NextResponse.json({ imported: parts.length, questions: inserted }, { status: 200 });
}
