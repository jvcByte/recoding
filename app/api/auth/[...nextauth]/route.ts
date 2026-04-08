import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { isRateLimited, resetRateLimit } from '@/lib/rateLimit';

export const authOptions: NextAuthOptions = {
  secret: (() => {
    if (!process.env.NEXTAUTH_SECRET) throw new Error('NEXTAUTH_SECRET is not set');
    return process.env.NEXTAUTH_SECRET;
  })(),

  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        const rows = await sql`
          SELECT id, username, password_hash, role
          FROM users
          WHERE username = ${credentials.username}
          LIMIT 1
        `;

        const user = rows[0];
        if (!user) return null;

        const passwordMatch = await bcrypt.compare(
          credentials.password,
          user.password_hash as string
        );
        if (!passwordMatch) return null;

        return {
          id: user.id as string,
          name: user.username as string,
          role: user.role as string,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { id: string; role: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8 hours — expires tokens at end of a typical exam day
  },
  pages: {
    signIn: '/login',
  },
};

const nextAuthHandler = NextAuth(authOptions);

export const GET = nextAuthHandler;

export async function POST(req: NextRequest, ctx: unknown) {
  // Only rate-limit the credentials sign-in action
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

    // On success (redirect to callbackUrl), clear the counter
    if (res.status === 200 || res.status === 302) {
      resetRateLimit(ip);
    }

    return res;
  }

  return (nextAuthHandler as (req: NextRequest, ctx: unknown) => Promise<NextResponse>)(req, ctx);
}
