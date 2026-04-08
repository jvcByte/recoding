/**
 * Seed script: inserts all 11 exercise slugs into the exercises table.
 * Run with: npx tsx scripts/seed.ts
 */

import { loadExercise } from '../lib/questions';
import { sql } from '../lib/db';

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

function slugToTitle(slug: string): string {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

async function seed() {
  console.log('Seeding exercises table...');

  for (const slug of SLUGS) {
    let questionCount = 0;
    try {
      const exercise = loadExercise(slug);
      questionCount = exercise.questions.length;
    } catch (err) {
      console.warn(`  Warning: could not load questions for "${slug}": ${(err as Error).message}`);
    }

    const title = slugToTitle(slug);

    await sql`
      INSERT INTO exercises (slug, title, enabled, question_count)
      VALUES (${slug}, ${title}, false, ${questionCount})
      ON CONFLICT (slug) DO NOTHING
    `;

    console.log(`  Inserted: ${slug} (${questionCount} questions)`);
  }

  console.log('Done.');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
