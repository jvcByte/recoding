import fs from 'fs';
import path from 'path';

// Load .env.local when running outside of Next.js (e.g. scripts)
if (!process.env.DATABASE_URL) {
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
      const match = line.match(/^\s*([^#=\s][^=]*?)\s*=\s*(.*)\s*$/);
      if (match) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
    }
  }
}

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Use @neondatabase/serverless in Next.js (works over HTTPS, no port 5432 needed)
// Fall back to pg for scripts that run in plain Node.js
let _queryFn: ((strings: TemplateStringsArray, ...values: unknown[]) => Promise<Record<string, unknown>[]>) | null = null;

async function getQueryFn() {
  if (_queryFn) return _queryFn;

  // Node 18+ has native fetch — use neon serverless everywhere (works over HTTPS, no port 5432)
  const useNeon = typeof globalThis.fetch === 'function';

  if (useNeon) {
    try {
      const { neon } = await import('@neondatabase/serverless');
      const sql = neon(process.env.DATABASE_URL!);
      _queryFn = async (strings, ...values) => {
        const result = await sql(strings, ...values);
        return result as Record<string, unknown>[];
      };
      return _queryFn;
    } catch { /* fall through to pg */ }
  }

  // pg fallback — works in scripts and when port 5432 is accessible
  const { Pool } = await import('pg');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  pool.on('error', (err) => console.error('[db] Pool error:', err.message));
  _queryFn = async (strings, ...values) => {
    let text = '';
    strings.forEach((str, i) => {
      text += str;
      if (i < values.length) text += `$${i + 1}`;
    });
    const client = await pool.connect();
    try {
      const result = await client.query(text, values as unknown[]);
      return result.rows;
    } finally {
      client.release();
    }
  };
  return _queryFn;
}

/**
 * Tagged template literal SQL client.
 * Usage: await sql`SELECT * FROM users WHERE id = ${id}`
 */
export async function sql(
  strings: TemplateStringsArray,
  ...values: unknown[]
): Promise<Record<string, unknown>[]> {
  try {
    const query = await getQueryFn();
    return await query(strings, ...values);
  } catch (err) {
    console.error('[db] Query error:', (err as Error).message);
    throw new Error('Database query failed');
  }
}
