import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const secret = process.env.NEXTAUTH_SECRET;

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const token = await getToken({ req, secret });

  // Routes that require any authenticated user
  const protectedApiPrefixes = [
    '/api/exercises',
    '/api/submissions',
    '/api/events',
  ];

  const isProtectedApi = protectedApiPrefixes.some((prefix) =>
    pathname.startsWith(prefix)
  );

  // Unauthenticated — redirect page routes to /login, return 401 for API routes
  if (!token) {
    if (
      pathname.startsWith('/instructor') ||
      pathname.startsWith('/participant') ||
      isProtectedApi
    ) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = '/login';
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  const role = token.role as string;

  // /instructor/* routes — require instructor role
  if (pathname.startsWith('/instructor') || pathname.startsWith('/api/instructor')) {
    if (role !== 'instructor') {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      // Redirect participant to their dashboard
      const dashboardUrl = req.nextUrl.clone();
      dashboardUrl.pathname = '/participant';
      return NextResponse.redirect(dashboardUrl);
    }
  }

  // /participant/* routes — require participant role
  if (pathname.startsWith('/participant')) {
    if (role !== 'participant') {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      // Redirect instructor to their dashboard
      const dashboardUrl = req.nextUrl.clone();
      dashboardUrl.pathname = '/instructor';
      return NextResponse.redirect(dashboardUrl);
    }
  }

  // Protected API routes — any authenticated user is fine
  if (isProtectedApi) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/instructor/:path*',
    '/participant/:path*',
    '/api/instructor/:path*',
    '/api/exercises/:path*',
    '/api/submissions/:path*',
    '/api/events/:path*',
    '/api/run-code',
  ],
};
