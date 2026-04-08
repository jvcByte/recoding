import { Pool } from 'pg';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Prevent unhandled errors from crashing the process on idle client failures
pool.on('error', (err) => {
  console.error('[db] Unexpected pool error:', err.message);
});

/**
 * Tagged template literal SQL client compatible with the neon() interface.
 * Usage: await sql`SELECT * FROM users WHERE id = ${id}`
 */
export async function sql(
  strings: TemplateStringsArray,
  ...values: unknown[]
): Promise<Record<string, unknown>[]> {
  // Build the parameterised query from the template literal
  let text = '';
  strings.forEach((str, i) => {
    text += str;
    if (i < values.length) text += `$${i + 1}`;
  });

  let client;
  try {
    client = await pool.connect();
  } catch (err) {
    console.error('[db] Failed to acquire connection:', (err as Error).message);
    throw new Error('Database unavailable');
  }

  try {
    const result = await client.query(text, values as unknown[]);
    return result.rows;
  } catch (err) {
    console.error('[db] Query error:', (err as Error).message);
    throw new Error('Database query failed');
  } finally {
    client.release();
  }
}
