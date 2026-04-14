/**
 * Imports all questions from docs/ into the questions table.
 * Safe to re-run — uses ON CONFLICT DO UPDATE.
 *
 * Usage: npx tsx scripts/import-questions.ts
 */

import { sql } from '../lib/db';
import { loadExercise } from '../lib/questions';

const SLUGS = [
  'prompt-basics', 'prompt-patterns', 'ai-ethics', 'debug-control',
  'ethical-ai', 'reasoning-flow', 'role-prompt', 'tool-prompts',
  'go-reloaded', 'ascii-art', 'ascii-art-web',
];

async function run() {
  console.log('Importing questions from docs/ into database...\n');

  for (const slug of SLUGS) {
    let exercise;
    try {
      exercise = loadExercise(slug);
    } catch (err) {
      console.warn(`  Skipping ${slug}: ${(err as Error).message}`);
      continue;
    }

    // Look up exercise ID
    const rows = await sql`SELECT id FROM exercises WHERE slug = ${slug} LIMIT 1`;
    if (rows.length === 0) {
      console.warn(`  Skipping ${slug}: exercise not found in DB (run npm run seed first)`);
      continue;
    }

    const exerciseId = rows[0].id as string;
    let imported = 0;

    for (const q of exercise.questions) {
      await sql`
        INSERT INTO questions (exercise_id, question_index, text, type, language, starter)
        VALUES (${exerciseId}, ${q.index}, ${q.text}, ${q.type}, ${q.language}, ${q.starter})
        ON CONFLICT (exercise_id, question_index)
        DO UPDATE SET
          text     = EXCLUDED.text,
          type     = EXCLUDED.type,
          language = EXCLUDED.language,
          starter  = EXCLUDED.starter,
          updated_at = now()
      `;
      imported++;
    }

    console.log(`  ✓ ${slug} — ${imported} questions imported`);
  }

  console.log('\nDone.');
}

run().catch((err) => { console.error(err); process.exit(1); });
