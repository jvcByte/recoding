import { Pool } from 'pg';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

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

  const client = await pool.connect();
  try {
    const result = await client.query(text, values as unknown[]);
    return result.rows;
  } finally {
    client.release();
  }
}
