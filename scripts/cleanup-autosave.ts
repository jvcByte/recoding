/**
 * Deletes autosave_history rows older than AUTOSAVE_RETENTION_DAYS (default 30).
 * Run periodically via cron: 0 2 * * * npx tsx scripts/cleanup-autosave.ts
 */

import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';

const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const match = line.match(/^\s*([^#=\s][^=]*?)\s*=\s*(.*)\s*$/);
    if (match) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
  }
}

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

const RETENTION_DAYS = parseInt(process.env.AUTOSAVE_RETENTION_DAYS ?? '30', 10);
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `DELETE FROM autosave_history WHERE saved_at < now() - ($1 || ' days')::interval`,
      [RETENTION_DAYS]
    );
    console.log(`Deleted ${result.rowCount} autosave_history rows older than ${RETENTION_DAYS} days.`);
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => { console.error(err); process.exit(1); });
