import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { readFileSync } from 'fs';
import path from 'path';

const RUNTIME_MAP: Record<string, { language: string; version: string }> = {
  go:         { language: 'go',         version: '1.16.2' },
  python:     { language: 'python',     version: '3.10.0' },
  javascript: { language: 'javascript', version: '18.15.0' },
  typescript: { language: 'typescript', version: '5.0.3' },
};

// Pre-load banner file once at startup
let _bannerCache: string | null = null;
function getBannerContent(): string {
  if (_bannerCache !== null) return _bannerCache;
  try {
    _bannerCache = readFileSync(path.join(process.cwd(), 'docs', 'banner_files', 'standard.txt'), 'utf-8');
    console.log('[run-code] Banner loaded:', _bannerCache.split('\n').length, 'lines');
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

  const PISTON_URL = process.env.PISTON_API_URL;
  console.log('[run-code] PISTON_URL:', PISTON_URL);

  if (!PISTON_URL) {
    return NextResponse.json({
      error: 'Code execution is not configured. Set PISTON_API_URL in your environment to a self-hosted Piston instance.',
    }, { status: 503 });
  }

  let body: { code: string; language: string; stdin?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { code, language, stdin = '' } = body;

  // For Go exercises, auto-inject the banner file as stdin if no stdin provided
  // This lets participants read banner data via os.Stdin instead of embedding it
  const effectiveStdin = stdin || (language === 'go' ? getBannerContent() : '');
  console.log('[run-code] stdin length:', effectiveStdin.length, 'lines:', effectiveStdin.split('\n').length);

  if (!code || typeof code !== 'string') {
    return NextResponse.json({ error: 'code is required' }, { status: 400 });
  }

  const runtime = RUNTIME_MAP[language];
  if (!runtime) {
    return NextResponse.json({ error: `Unsupported language: ${language}` }, { status: 400 });
  }

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
        stdin: effectiveStdin,
      }),
    });

    console.log("Piston Res: ", pistonRes)

    if (!pistonRes.ok) {
      const text = await pistonRes.text();
      console.error('[run-code] Piston error:', text);
      return NextResponse.json({ error: 'Execution service unavailable' }, { status: 502 });
    }

    const result = await pistonRes.json() as {
      compile?: { stdout: string; stderr: string; code: number | null };
      run:      { stdout: string; stderr: string; code: number | null };
    };

    console.log("Result: ", result);

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
