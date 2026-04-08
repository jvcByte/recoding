/**
 * Admin password reset utility.
 * Usage: npx tsx scripts/reset-password.ts <username> <new-password>
 */

import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const match = line.match(/^\s*([^#=\s][^=]*?)\s*=\s*(.*)\s*$/);
    if (match) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
  }
}

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

const [,, username, newPassword] = process.argv;

if (!username || !newPassword) {
  console.error('Usage: npx tsx scripts/reset-password.ts <username> <new-password>');
  process.exit(1);
}

if (newPassword.length < 8) {
  console.error('Password must be at least 8 characters.');
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const client = await pool.connect();
  try {
    const hash = await bcrypt.hash(newPassword, 12);
    const result = await client.query(
      'UPDATE users SET password_hash = $1 WHERE username = $2 RETURNING id, username',
      [hash, username]
    );

    if (result.rowCount === 0) {
      console.error(`User not found: ${username}`);
      process.exit(1);
    }

    console.log(`Password reset for user: ${result.rows[0].username}`);
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => { console.error(err); process.exit(1); });
