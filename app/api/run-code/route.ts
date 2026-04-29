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
    const res = await fetchWithRetry(`${RUNNER_URL}/run`, {
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
      return NextResponse.json({
        error: 'Execution service unavailable',
        error_category: 'platform',
        error_message: 'Platform error: The execution service returned an error. Please try again.',
      }, { status: 502 });
    }

    const result = await res.json() as {
      stdout: string;
      stderr: string;
      exit_code: number;
      compile_output: string;
    };

    // Categorize errors for better user feedback
    const categorized = categorizeRunResult(result);
    return NextResponse.json(categorized);
  } catch (err) {
    console.error('[run-code] fetch error:', (err as Error).message);
    return NextResponse.json({
      error: 'Execution service unavailable',
      error_category: 'platform',
      error_message: 'Platform error: Could not reach the code execution service. Please try again or report this issue.',
    }, { status: 502 });
  }
}

type RunResult = {
  stdout: string;
  stderr: string;
  exit_code: number;
  compile_output: string;
  error_category?: 'syntax' | 'runtime' | 'timeout' | 'platform';
  error_message?: string;
};

async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 2): Promise<Response> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, options);
      // Only retry on 5xx transient errors, not 4xx
      if (res.status >= 500 && attempt < maxRetries) {
        console.warn(`[run-code] Attempt ${attempt + 1} failed with ${res.status}, retrying…`);
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
        continue;
      }
      return res;
    } catch (err) {
      lastError = err as Error;
      if (attempt < maxRetries) {
        console.warn(`[run-code] Attempt ${attempt + 1} network error, retrying…`);
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
      }
    }
  }
  throw lastError ?? new Error('Max retries exceeded');
}

function categorizeRunResult(result: RunResult): RunResult {
  const { stderr, compile_output, exit_code } = result;

  // Timeout
  if (exit_code === 124 || (stderr && /time limit|timed out|killed/i.test(stderr))) {
    return { ...result, error_category: 'timeout', error_message: 'Execution exceeded the 5 second time limit.' };
  }

  // Compile/syntax error
  if (compile_output && compile_output.trim().length > 0) {
    return { ...result, error_category: 'syntax', error_message: 'Your code has a syntax or compile error. Check the compile output below.' };
  }

  // Runtime error (non-zero exit, stderr present)
  if (exit_code !== 0 && stderr && stderr.trim().length > 0) {
    return { ...result, error_category: 'runtime', error_message: `Your code crashed with exit code ${exit_code}.` };
  }

  return result;
}
