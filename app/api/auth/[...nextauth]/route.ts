import NextAuth from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { isRateLimited, resetRateLimit } from '@/lib/rateLimit';

const nextAuthHandler = NextAuth(authOptions);

export const GET = nextAuthHandler;

export async function POST(req: NextRequest, ctx: unknown) {
  const url = req.nextUrl;
  const isSignIn =
    url.pathname.endsWith('/callback/credentials') ||
    url.searchParams.get('nextauth')?.includes('callback') === true;

  if (isSignIn) {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
      req.headers.get('x-real-ip') ??
      'unknown';

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Too many attempts. Please try again later.' },
        { status: 429 }
      );
    }

    const res = await (nextAuthHandler as (req: NextRequest, ctx: unknown) => Promise<NextResponse>)(req, ctx);

    if (res.status === 200 || res.status === 302) {
      resetRateLimit(ip);
    }

    return res;
  }

  return (nextAuthHandler as (req: NextRequest, ctx: unknown) => Promise<NextResponse>)(req, ctx);
}
