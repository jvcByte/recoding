import { readFileSync, readdirSync } from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { GO_STARTER, BANNER_STARTER, extractCodeBlock, slugToTitle } from '@/lib/utils';

export interface Question {
  index: number;
  text: string;       // markdown body (frontmatter stripped)
  type: 'written' | 'code';
  language: string;   // e.g. 'go' — only meaningful when type === 'code'
  starter: string;    // starter code template
}

export interface ExerciseContent {
  slug: string;
  title: string;
  questions: Question[];
}

const PROMPT_PISCINE_SLUGS = new Set([
  'prompt-basics', 'prompt-patterns', 'ai-ethics', 'debug-control',
  'ethical-ai', 'reasoning-flow', 'role-prompt', 'tool-prompts',
]);

function resolveExerciseDir(slug: string): string {
  const base = path.join(process.cwd(), 'docs');
  if (PROMPT_PISCINE_SLUGS.has(slug)) return path.join(base, 'prompt-piscine', slug);
  return path.join(base, slug);
}

const CODE_EXERCISE_SLUGS = new Set(['ascii-art', 'ascii-art-web', 'go-reloaded']);

export function loadExercise(slug: string): ExerciseContent {
  const dir = resolveExerciseDir(slug);
  const isCodeExercise = CODE_EXERCISE_SLUGS.has(slug);

  let files: string[];
  try {
    files = readdirSync(dir);
  } catch {
    throw new Error(`Exercise directory not found for slug: ${slug}`);
  }

  const questionFiles = files
    .filter((f) => f.match(/^question\d+\.md$/))
    .sort((a, b) => {
      const na = parseInt(a.replace('question', '').replace('.md', ''), 10);
      const nb = parseInt(b.replace('question', '').replace('.md', ''), 10);
      return na - nb;
    });

  if (questionFiles.length === 0) {
    throw new Error(`No question files found for slug: ${slug}`);
  }

  const questions: Question[] = questionFiles.map((filename, i) => {
    const filePath = path.join(dir, filename);
    const raw = readFileSync(filePath, 'utf-8');
    const { data, content } = matter(raw);

    const type: 'written' | 'code' =
      data.type ?? (isCodeExercise ? 'code' : 'written');
    const language: string = data.language ?? (isCodeExercise ? 'go' : 'text');

    let starter: string;
    if (data.starter) {
      starter = data.starter;
    } else if (type === 'code') {
      const isBannerExercise = slug === 'ascii-art' || slug === 'ascii-art-web';
      starter = extractCodeBlock(content) ?? (isBannerExercise ? BANNER_STARTER : GO_STARTER);
    } else {
      starter = '';
    }

    return { index: i, text: content.trim(), type, language, starter };
  });

  return { slug, title: slugToTitle(slug), questions };
}
