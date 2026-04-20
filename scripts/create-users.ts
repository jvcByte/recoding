/**
 * Bulk-creates users from docs/users/users.md.
 * Supports INSTRUCTOR and PARTICIPANT sections — assigns role accordingly.
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

  // Parse sections — role is set by the last INSTRUCTOR/PARTICIPANT heading seen
  const users: { username: string; password: string; role: string }[] = [];
  let currentRole = 'participant';

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed === 'INSTRUCTOR') { currentRole = 'instructor'; continue; }
    if (trimmed === 'PARTICIPANT') { currentRole = 'participant'; continue; }
    if (!trimmed.startsWith('|') || trimmed.includes('---') || trimmed.toLowerCase().includes('username')) continue;

    const cols = trimmed.split('|').map((c) => c.trim()).filter(Boolean);
    if (cols.length >= 2) users.push({ username: cols[0], password: cols[1], role: currentRole });
  }

  console.log(`Found ${users.length} users to process...\n`);

  let created = 0;
  let skipped = 0;

  for (const { username, password, role } of users) {
    const existing = await sql`SELECT id FROM users WHERE username = ${username} LIMIT 1`;
    if (existing.length > 0) {
      console.log(`  Skipped (exists): ${username} [${role}]`);
      skipped++;
      continue;
    }

    const hash = await bcrypt.hash(password, 12);
    await sql`
      INSERT INTO users (username, password_hash, role)
      VALUES (${username}, ${hash}, ${role})
    `;
    console.log(`  Created: ${username} [${role}]`);
    created++;
  }

  console.log(`\nDone. ${created} created, ${skipped} skipped.`);
}

run().catch((err) => { console.error(err); process.exit(1); });
