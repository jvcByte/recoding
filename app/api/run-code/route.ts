import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const PISTON_URL = process.env.PISTON_API_URL ?? 'https://emkc.org/api/v2/piston';

// Language → Piston runtime mapping
const RUNTIME_MAP: Record<string, { language: string; version: string }> = {
  go:         { language: 'go',         version: '1.16.2' },
  python:     { language: 'python',     version: '3.10.0' },
  javascript: { language: 'javascript', version: '18.15.0' },
  typescript: { language: 'typescript', version: '5.0.3' },
};

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { code: string; language: string; stdin?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { code, language, stdin = '' } = body;

  if (!code || typeof code !== 'string') {
    return NextResponse.json({ error: 'code is required' }, { status: 400 });
  }

  const runtime = RUNTIME_MAP[language];
  if (!runtime) {
    return NextResponse.json({ error: `Unsupported language: ${language}` }, { status: 400 });
  }

  // Enforce a reasonable code size limit
  if (Buffer.byteLength(code, 'utf8') > 64 * 1024) {
    return NextResponse.json({ error: 'Code exceeds 64KB limit' }, { status: 413 });
  }

  try {
    const pistonRes = await fetch(`${PISTON_URL}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: runtime.language,
        version: runtime.version,
        files: [{ name: `main.${language === 'go' ? 'go' : language}`, content: code }],
        stdin,
        run_timeout: 10000,  // 10s max execution
        compile_timeout: 15000,
      }),
    });

    if (!pistonRes.ok) {
      const text = await pistonRes.text();
      console.error('[run-code] Piston error:', text);
      return NextResponse.json({ error: 'Execution service unavailable' }, { status: 502 });
    }

    const result = await pistonRes.json() as {
      compile?: { stdout: string; stderr: string; code: number | null };
      run:      { stdout: string; stderr: string; code: number | null };
    };

    return NextResponse.json({
      compile_output: result.compile?.stderr ?? '',
      stdout:         result.run.stdout,
      stderr:         result.run.stderr,
      exit_code:      result.run.code,
    });
  } catch (err) {
    console.error('[run-code] fetch error:', (err as Error).message);
    return NextResponse.json({ error: 'Execution service unavailable' }, { status: 502 });
  }
}
