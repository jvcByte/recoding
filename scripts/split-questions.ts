/**
 * Splits multi-question markdown files into individual question0.md, question1.md, etc.
 * Run once with: npx tsx scripts/split-questions.ts
 *
 * Looks for files matching the pattern in each exercise dir and splits on ## Question N headings.
 */

import fs from 'fs';
import path from 'path';

const PISCINE_DIR = path.join(process.cwd(), 'docs', 'prompt-piscine');
const OTHER_DIRS = [
  path.join(process.cwd(), 'docs', 'go-reloaded'),
  path.join(process.cwd(), 'docs', 'ascii-art'),
  path.join(process.cwd(), 'docs', 'ascii-art-web'),
];

function findQuestionFile(dir: string): string | null {
  const files = fs.readdirSync(dir);
  // Already split — skip
  if (files.some((f) => f.match(/^question\d+\.md$/))) return null;
  // Find any file with "question" in the name (case-insensitive)
  const qFile = files.find((f) => f.toLowerCase().includes('question') && f.endsWith('.md'));
  return qFile ? path.join(dir, qFile) : null;
}

function splitAndWrite(filePath: string, dir: string) {
  const content = fs.readFileSync(filePath, 'utf-8');

  // Split on ## Question N  (handles ## Question 1, ## Question 2, etc.)
  const parts = content.split(/(?=^## Question \d+)/m).filter((p) => p.trim());

  if (parts.length <= 1) {
    // Try splitting on --- separators as fallback
    const sections = content.split(/^---$/m).map((s) => s.trim()).filter(Boolean);
    if (sections.length > 1) {
      sections.forEach((section, i) => {
        const outPath = path.join(dir, `question${i}.md`);
        fs.writeFileSync(outPath, section + '\n');
        console.log(`  Wrote ${path.basename(outPath)} (${section.length} chars)`);
      });
      return;
    }
    // Single question — just rename/copy to question0.md
    const outPath = path.join(dir, 'question0.md');
    fs.writeFileSync(outPath, content);
    console.log(`  Wrote question0.md (single question)`);
    return;
  }

  parts.forEach((part, i) => {
    const outPath = path.join(dir, `question${i}.md`);
    fs.writeFileSync(outPath, part.trim() + '\n');
    console.log(`  Wrote ${path.basename(outPath)} (${part.trim().length} chars)`);
  });
}

function processDir(dir: string) {
  if (!fs.existsSync(dir)) { console.log(`Skipping (not found): ${dir}`); return; }
  const qFile = findQuestionFile(dir);
  if (!qFile) { console.log(`Skipping (already split or no question file): ${path.basename(dir)}`); return; }
  console.log(`\nProcessing: ${path.relative(process.cwd(), dir)}`);
  splitAndWrite(qFile, dir);
}

// Process all prompt-piscine subdirs
for (const subdir of fs.readdirSync(PISCINE_DIR)) {
  processDir(path.join(PISCINE_DIR, subdir));
}

// Process other exercise dirs
for (const dir of OTHER_DIRS) {
  processDir(dir);
}

console.log('\nDone. Run `npm run seed` to update question counts in the database.');
