import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { readFileSync } from 'fs';
import path from 'path';

const SUPPORTED_LANGUAGES = new Set(['go', 'python', 'javascript', 'typescript']);

// Pre-load banner file once at startup
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

  const RUNNER_URL = process.env.PISTON_API_URL ?? process.env.RUNNER_URL;
  if (!RUNNER_URL) {
    return NextResponse.json({
      error: 'Code execution is not configured. Set RUNNER_URL in your environment.',
    }, { status: 503 });
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
  if (!SUPPORTED_LANGUAGES.has(language)) {
    return NextResponse.json({ error: `Unsupported language: ${language}` }, { status: 400 });
  }
  if (Buffer.byteLength(code, 'utf8') > 64 * 1024) {
    return NextResponse.json({ error: 'Code exceeds 64KB limit' }, { status: 413 });
  }

  // Auto-inject banner as stdin for Go exercises if no stdin provided
  const effectiveStdin = stdin || (language === 'go' ? getBannerContent() : '');

  // Detect runner type from URL — custom runner uses /run, Piston uses /execute
  const isPiston = RUNNER_URL.includes('piston') || RUNNER_URL.includes('emkc');
  const endpoint = isPiston ? `${RUNNER_URL}/execute` : `${RUNNER_URL}/run`;

  const pistonPayload = isPiston ? {
    language,
    version: '1.16.2',
    files: [{ name: `main.go`, content: code }],
    stdin: effectiveStdin,
  } : {
    code,
    language,
    stdin: effectiveStdin,
  };

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pistonPayload),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('[run-code] Runner error:', text);
      return NextResponse.json({ error: 'Execution service unavailable' }, { status: 502 });
    }

    const result = await res.json() as Record<string, unknown>;

    // Normalise response — handle both Piston and custom runner formats
    if (isPiston) {
      const piston = result as {
        compile?: { stderr: string };
        run: { stdout: string; stderr: string; code: number | null };
      };
      return NextResponse.json({
        compile_output: piston.compile?.stderr ?? '',
        stdout: piston.run.stdout,
        stderr: piston.run.stderr,
        exit_code: piston.run.code,
      });
    } else {
      return NextResponse.json({
        compile_output: (result.compile_output as string) ?? '',
        stdout: (result.stdout as string) ?? '',
        stderr: (result.stderr as string) ?? '',
        exit_code: (result.exit_code as number) ?? 0,
      });
    }
  } catch (err) {
    console.error('[run-code] fetch error:', (err as Error).message);
    return NextResponse.json({ error: 'Execution service unavailable' }, { status: 502 });
  }
}
