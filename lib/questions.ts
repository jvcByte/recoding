import { readFileSync, readdirSync } from 'fs';
import path from 'path';
import matter from 'gray-matter';

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

// Exercises whose questions are in-browser coding tasks
const CODE_EXERCISE_SLUGS = new Set(['ascii-art', 'ascii-art-web']);

function resolveExerciseDir(slug: string): string {
  const base = path.join(process.cwd(), 'docs');
  if (PROMPT_PISCINE_SLUGS.has(slug)) return path.join(base, 'prompt-piscine', slug);
  return path.join(base, slug);
}

const GO_STARTER = `package main

import "fmt"

func main() {
\tfmt.Println("Hello, World!")
}
`;

// Load banner file content — passed via stdin to avoid large constants
function getBannerStarter(): string {
  return `package main

import (
\t"bufio"
\t"fmt"
\t"os"
\t"strings"
)

// readBannerFromStdin reads the banner file lines from stdin.
// The platform pre-loads the banner content into stdin for you.
func readBannerFromStdin() []string {
\tvar lines []string
\tscanner := bufio.NewScanner(os.Stdin)
\tfor scanner.Scan() {
\t\tlines = append(lines, scanner.Text())
\t}
\treturn lines
}

func main() {
\tlines := readBannerFromStdin()
\tfmt.Println("Banner lines:", len(lines))
\t_ = strings.Split // strings imported for your use
}
`;
}

/** Extract the first ```go ... ``` code block from markdown content */
function extractStarterFromMarkdown(content: string): string | null {
  const match = content.match(/```go\n([\s\S]*?)```/);
  return match ? match[1] : null;
}

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

    // For code exercises: extract starter from the question's code block,
    // fall back to frontmatter starter, then generic defaults
    let starter: string;
    if (data.starter) {
      starter = data.starter;
    } else if (type === 'code') {
      starter = extractStarterFromMarkdown(content) ?? GO_STARTER;
    } else {
      starter = '';
    }

    return { index: i, text: content.trim(), type, language, starter };
  });

  const title = slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  return { slug, title, questions };
}
