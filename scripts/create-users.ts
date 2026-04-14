/**
 * Bulk-creates participant accounts from docs/users/users.md.
 * Safe to re-run — skips existing usernames.
 *
 * Usage: npx tsx scripts/create-users.ts
 */

import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { sql } from '../lib/db';

async function run() {
  const filePath = path.join(process.cwd(), 'docs', 'users', 'users.md');
  const content = fs.readFileSync(filePath, 'utf-8');

  // Parse markdown table rows — skip header and separator lines
  const rows = content
    .split('\n')
    .filter((line) => line.startsWith('|') && !line.includes('---') && !line.includes('Username'))
    .map((line) => {
      const cols = line.split('|').map((c) => c.trim()).filter(Boolean);
      return { username: cols[0], password: cols[1] };
    })
    .filter((r) => r.username && r.password);

  console.log(`Found ${rows.length} users to create...\n`);

  let created = 0;
  let skipped = 0;

  for (const { username, password } of rows) {
    const existing = await sql`SELECT id FROM users WHERE username = ${username} LIMIT 1`;
    if (existing.length > 0) {
      console.log(`  Skipped (exists): ${username}`);
      skipped++;
      continue;
    }

    const hash = await bcrypt.hash(password, 12);
    await sql`
      INSERT INTO users (username, password_hash, role)
      VALUES (${username}, ${hash}, 'participant')
    `;
    console.log(`  Created: ${username}`);
    created++;
  }

  console.log(`\nDone. ${created} created, ${skipped} skipped.`);
}

run().catch((err) => { console.error(err); process.exit(1); });
