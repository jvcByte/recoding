/**
 * Shared utility functions used across the platform.
 */

// ── Interval / Time ───────────────────────────────────────────────────────────

/**
 * Convert a PostgreSQL INTERVAL value (object or string) to total seconds.
 * Handles: PostgresInterval object, "HH:MM:SS" string, plain number string.
 */
export function parseIntervalToSeconds(interval: unknown): number {
  if (typeof interval === 'number') return interval;
  if (interval && typeof interval === 'object') {
    const iv = interval as Record<string, number>;
    return (iv.years   ?? 0) * 31_536_000
         + (iv.months  ?? 0) *  2_592_000
         + (iv.days    ?? 0) *     86_400
         + (iv.hours   ?? 0) *      3_600
         + (iv.minutes ?? 0) *         60
         + (iv.seconds ?? 0);
  }
  if (typeof interval === 'string') {
    const parts = interval.split(':');
    if (parts.length === 3) {
      return parseInt(parts[0], 10) * 3600
           + parseInt(parts[1], 10) * 60
           + parseFloat(parts[2]);
    }
    const n = parseFloat(interval);
    if (!isNaN(n)) return n;
  }
  return 0;
}

/**
 * Convert a PostgreSQL INTERVAL value (object or string) to "HH:MM:SS" string.
 */
export function intervalToString(val: unknown): string {
  if (typeof val === 'string') return val;
  if (val && typeof val === 'object') {
    const iv = val as Record<string, number>;
    const h = String(iv.hours   ?? 0).padStart(2, '0');
    const m = String(iv.minutes ?? 0).padStart(2, '0');
    const s = String(Math.floor(iv.seconds ?? 0)).padStart(2, '0');
    return `${h}:${m}:${s}`;
  }
  return '';
}

// ── String / Slug ─────────────────────────────────────────────────────────────

/** Convert a kebab-case slug to Title Case. */
export function slugToTitle(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

// ── Markdown / Question Parsing ───────────────────────────────────────────────

/**
 * Extract the first fenced code block of a given language from markdown.
 * Returns the code content (without the fences), or null if not found.
 */
export function extractCodeBlock(content: string, language = 'go'): string | null {
  const match = content.match(new RegExp('```' + language + '\\n([\\s\\S]*?)```'));
  return match ? match[1] : null;
}

/**
 * Split a markdown string into individual question sections.
 * Splits on headings matching: # Question N, ## Drill N, ### Exercise N, etc.
 * Returns only sections that start with a question heading.
 */
export function splitMarkdownQuestions(content: string): string[] {
  const lines = content.split('\n');
  const questionPattern = /^#{1,4}\s+(?:Question|Drill|Exercise)\s+\d+/i;

  const sections: string[] = [];
  let current: string[] = [];

  for (const line of lines) {
    if (questionPattern.test(line.trim())) {
      if (current.length > 0) {
        const text = current.join('\n').trim();
        if (text) sections.push(text);
      }
      current = [line];
    } else {
      current.push(line);
    }
  }

  if (current.length > 0) {
    const text = current.join('\n').trim();
    if (text) sections.push(text);
  }

  return sections.filter((s) => questionPattern.test(s.split('\n')[0].trim()));
}

// ── Go Starter Templates ──────────────────────────────────────────────────────

export const GO_STARTER = `package main

import "fmt"

func main() {
\tfmt.Println("Hello, World!")
}
`;

export const BANNER_STARTER = `package main

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
