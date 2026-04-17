import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { readFileSync } from 'fs';
import path from 'path';

const SUPPORTED_LANGUAGES = new Set(['go', 'python', 'javascript', 'typescript']);

let _bannerCache: string | null = null;
function getBannerContent(): string {
  if (_bannerCache !== null) return _bannerCache;
  try {
    _bannerCache = readFileSync(
      path.join(process.cwd(), 'docs', 'banner_files', 'standard.txt'),
      'utf-8'
    );
    return _bannerCache;
  } catch (err) {
    console.error('[run-code] Failed to load banner:', (err as Error).message);
    return '';
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const RUNNER_URL = process.env.RUNNER_URL;
  if (!RUNNER_URL) {
    return NextResponse.json({
      error: 'Code execution is not configured. Set RUNNER_URL in your environment.',
    }, { status: 503 });
  }

  let body: { code: string; language: string; stdin?: string; exercise?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { code, language, stdin = '', exercise = '' } = body;

  if (!code || typeof code !== 'string') {
    return NextResponse.json({ error: 'code is required' }, { status: 400 });
  }
  if (!SUPPORTED_LANGUAGES.has(language)) {
    return NextResponse.json({ error: `Unsupported language: ${language}` }, { status: 400 });
  }
  if (Buffer.byteLength(code, 'utf8') > 64 * 1024) {
    return NextResponse.json({ error: 'Code exceeds 64KB limit' }, { status: 413 });
  }

  const BANNER_EXERCISE_SLUGS = new Set(['ascii-art', 'ascii-art-web']);
  // Auto-inject banner as stdin only for banner exercises when no stdin provided
  const effectiveStdin = stdin || (language === 'go' && BANNER_EXERCISE_SLUGS.has(exercise) ? getBannerContent() : '');

  try {
    const res = await fetch(`${RUNNER_URL}/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.RUNNER_API_KEY ? { 'Authorization': `Bearer ${process.env.RUNNER_API_KEY}` } : {}),
      },
      body: JSON.stringify({ code, language, stdin: effectiveStdin }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('[run-code] Runner error:', text);
      return NextResponse.json({ error: 'Execution service unavailable' }, { status: 502 });
    }

    const result = await res.json() as {
      stdout: string;
      stderr: string;
      exit_code: number;
      compile_output: string;
    };

    return NextResponse.json(result);
  } catch (err) {
    console.error('[run-code] fetch error:', (err as Error).message);
    return NextResponse.json({ error: 'Execution service unavailable' }, { status: 502 });
  }
}
