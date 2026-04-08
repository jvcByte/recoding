import { readFileSync, readdirSync } from 'fs';
import path from 'path';

export interface Question {
  index: number;
  text: string; // raw markdown
}

export interface ExerciseContent {
  slug: string;
  title: string;
  questions: Question[];
}

// Slugs that live under docs/prompt-piscine/ rather than docs/ directly
const PROMPT_PISCINE_SLUGS = new Set([
  'prompt-basics',
  'prompt-patterns',
  'ai-ethics',
  'debug-control',
  'ethical-ai',
  'reasoning-flow',
  'role-prompt',
  'tool-prompts',
]);

function resolveExerciseDir(slug: string): string {
  const base = path.join(process.cwd(), 'docs');
  if (PROMPT_PISCINE_SLUGS.has(slug)) {
    return path.join(base, 'prompt-piscine', slug);
  }
  return path.join(base, slug);
}

/**
 * Loads all question*.md files from docs/{slug}/ (or docs/prompt-piscine/{slug}/)
 * sorted by filename, and returns them as an ExerciseContent.
 */
export function loadExercise(slug: string): ExerciseContent {
  const dir = resolveExerciseDir(slug);

  let files: string[];
  try {
    files = readdirSync(dir);
  } catch {
    throw new Error(`Exercise directory not found for slug: ${slug}`);
  }

  const questionFiles = files
    .filter((f) => f.startsWith('question') && f.endsWith('.md'))
    .sort();

  if (questionFiles.length === 0) {
    throw new Error(`No question files found for slug: ${slug}`);
  }

  const questions: Question[] = questionFiles.map((filename, i) => {
    const filePath = path.join(dir, filename);
    const text = readFileSync(filePath, 'utf-8');
    return { index: i, text };
  });

  // Derive a human-readable title from the slug
  const title = slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return { slug, title, questions };
}
