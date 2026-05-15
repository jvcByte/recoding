/**
 * Seed script: inserts exercises and default users.
 * Safe to re-run — uses ON CONFLICT DO NOTHING throughout.
 *
 * Usage: npx tsx scripts/seed.ts
 *
 * Default users:
 *   instructor / instructor123
 *   participant / participant123
 */

import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { loadExercise } from '../lib/questions';
import { sql } from '../lib/db';
import { slugToTitle } from '../lib/utils';

// Load .env.local
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const match = line.match(/^\s*([^#=\s][^=]*?)\s*=\s*(.*)\s*$/);
    if (match) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
  }
}


const SLUGS = [
  'prompt-basics',
  'prompt-patterns',
  'ai-ethics',
  'debug-control',
  'ethical-ai',
  'reasoning-flow',
  'role-prompt',
  'tool-prompts',
  'go-reloaded',
  'ascii-art',
  'ascii-art-web',
];

async function seedExercises() {
  console.log('Seeding exercises...');
  for (const slug of SLUGS) {
    let questionCount = 0;
    try {
      const exercise = loadExercise(slug);
      questionCount = exercise.questions.length;
    } catch (err) {
      console.warn(`  Warning: could not load questions for "${slug}": ${(err as Error).message}`);
    }

    await sql`
      INSERT INTO exercises (slug, title, enabled, question_count)
      VALUES (${slug}, ${slugToTitle(slug)}, false, ${questionCount})
      ON CONFLICT (slug) DO NOTHING
    `;
    console.log(`  ✓ ${slug} (${questionCount} questions)`);
  }
}

async function seedUsers() {
  console.log('Seeding default users...');

  const defaults = [
    { username: 'instructor', password: 'instructor123', role: 'instructor' },
    { username: 'participant', password: 'participant123', role: 'participant' },
  ];

  for (const u of defaults) {
    const hash = await bcrypt.hash(u.password, 12);
    await sql`
      INSERT INTO users (username, password_hash, role)
      VALUES (${u.username}, ${hash}, ${u.role})
      ON CONFLICT (username) DO NOTHING
    `;
    console.log(`  ✓ ${u.role}: ${u.username} / ${u.password}`);
  }
}

async function seed() {
  await seedExercises();
  // await seedUsers();
  console.log('Done.');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
