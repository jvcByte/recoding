import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { sql } from '@/lib/db';

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
        if (!credentials?.username || !credentials?.password) return null;

        const rows = await sql`
          SELECT id, username, password_hash, role
          FROM users
          WHERE username = ${credentials.username}
          LIMIT 1
        `;

        const user = rows[0];
        if (!user) throw new Error('Invalid username or password');

        const passwordMatch = await bcrypt.compare(
          credentials.password,
          user.password_hash as string
        );
        if (!passwordMatch) throw new Error('Incorrect password');

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
    maxAge: 8 * 60 * 60,
  },
  pages: {
    signIn: '/login',
  },
};
