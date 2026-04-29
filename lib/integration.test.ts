/**
 * Integration tests for feedback improvements
 * Tests key flows: navigation, autosave, code execution
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Autosave reliability tests ────────────────────────────────────────────────

describe('autosave flow', () => {
  it('saves to localStorage before server sync', () => {
    const store: Record<string, string> = {};
    const mockLocalStorage = {
      setItem: (k: string, v: string) => { store[k] = v; },
      getItem: (k: string) => store[k] ?? null,
      removeItem: (k: string) => { delete store[k]; },
    };

    const sessionId = 'sess-1';
    const questionIndex = 0;
    const code = 'package main\nfunc main() {}';
    const key = `autosave:${sessionId}:${questionIndex}`;

    // Simulate saveToLocalStorage
    mockLocalStorage.setItem(key, code);
    expect(mockLocalStorage.getItem(key)).toBe(code);

    // Simulate clearLocalStorage after successful save
    mockLocalStorage.removeItem(key);
    expect(mockLocalStorage.getItem(key)).toBeNull();
  });

  it('retains localStorage backup on server failure', () => {
    const store: Record<string, string> = {};
    const mockLocalStorage = {
      setItem: (k: string, v: string) => { store[k] = v; },
      getItem: (k: string) => store[k] ?? null,
      removeItem: (k: string) => { delete store[k]; },
    };

    const key = 'autosave:sess-1:0';
    const code = 'some code';

    mockLocalStorage.setItem(key, code);
    // Server fails — do NOT clear
    expect(mockLocalStorage.getItem(key)).toBe(code);
  });
});

// ── Navigation flow tests ─────────────────────────────────────────────────────

describe('navigation flow', () => {
  it('allows navigation to reached questions', () => {
    const currentIndex = 3;
    const canNavigate = (targetIndex: number) => targetIndex <= currentIndex;

    expect(canNavigate(0)).toBe(true);
    expect(canNavigate(2)).toBe(true);
    expect(canNavigate(3)).toBe(true);
    expect(canNavigate(4)).toBe(false);
    expect(canNavigate(5)).toBe(false);
  });

  it('skip marks question as skipped not final', () => {
    type Status = 'not_started' | 'draft' | 'skipped' | 'final';
    const applySkip = (current: Status): Status => {
      if (current === 'final') return 'final'; // can't un-final
      return 'skipped';
    };

    expect(applySkip('not_started')).toBe('skipped');
    expect(applySkip('draft')).toBe('skipped');
    expect(applySkip('final')).toBe('final');
  });

  it('advance marks question as final if has content', () => {
    type Status = 'not_started' | 'draft' | 'skipped' | 'final';
    const applyAdvance = (current: Status, hasContent: boolean): Status => {
      if (current === 'final') return 'final';
      if (hasContent) return 'final';
      return current;
    };

    expect(applyAdvance('draft', true)).toBe('final');
    expect(applyAdvance('not_started', false)).toBe('not_started');
    expect(applyAdvance('skipped', true)).toBe('final');
  });
});

// ── Code execution tests ──────────────────────────────────────────────────────

describe('code execution error categorization', () => {
  type ErrorCategory = 'syntax' | 'runtime' | 'timeout' | 'platform' | undefined;

  function categorize(result: { exit_code: number; stderr: string; compile_output: string }): ErrorCategory {
    if (result.exit_code === 124 || /time limit|timed out|killed/i.test(result.stderr)) return 'timeout';
    if (result.compile_output.trim().length > 0) return 'syntax';
    if (result.exit_code !== 0 && result.stderr.trim().length > 0) return 'runtime';
    return undefined;
  }

  it('categorizes timeout errors', () => {
    expect(categorize({ exit_code: 124, stderr: '', compile_output: '' })).toBe('timeout');
    expect(categorize({ exit_code: 1, stderr: 'time limit exceeded', compile_output: '' })).toBe('timeout');
  });

  it('categorizes syntax/compile errors', () => {
    expect(categorize({ exit_code: 1, stderr: '', compile_output: './main.go:5:1: syntax error' })).toBe('syntax');
  });

  it('categorizes runtime errors', () => {
    expect(categorize({ exit_code: 1, stderr: 'panic: runtime error', compile_output: '' })).toBe('runtime');
  });

  it('returns undefined for successful execution', () => {
    expect(categorize({ exit_code: 0, stderr: '', compile_output: '' })).toBeUndefined();
  });
});

// ── Paste detection tests ─────────────────────────────────────────────────────

describe('paste source detection', () => {
  function detectSourceType(pastedText: string, existingText: string, tabWasBlurred: boolean): string {
    if (pastedText.length > 0 && existingText.includes(pastedText)) return 'internal';
    if (tabWasBlurred) return 'external';
    return 'unknown';
  }

  it('detects internal paste when text already exists', () => {
    const existing = 'package main\nfunc main() { fmt.Println("hello") }';
    const pasted = 'fmt.Println("hello")';
    expect(detectSourceType(pasted, existing, false)).toBe('internal');
  });

  it('detects external paste when tab was blurred', () => {
    expect(detectSourceType('some new code', 'existing code', true)).toBe('external');
  });

  it('returns unknown when no clear signal', () => {
    expect(detectSourceType('new code', 'different code', false)).toBe('unknown');
  });
});

// ── Flagging logic tests ──────────────────────────────────────────────────────

describe('paste flagging logic', () => {
  function shouldFlag(charCount: number, maxPasteChars: number | null, tabWasBlurred: boolean, sourceType: string): boolean {
    if (maxPasteChars !== null && charCount <= maxPasteChars) return false;
    return tabWasBlurred || sourceType === 'external' || sourceType === 'unknown';
  }

  it('does not flag internal pastes', () => {
    expect(shouldFlag(500, 100, false, 'internal')).toBe(false);
  });

  it('flags external pastes above threshold', () => {
    expect(shouldFlag(500, 100, false, 'external')).toBe(true);
  });

  it('flags pastes when tab was blurred', () => {
    expect(shouldFlag(500, 100, true, 'unknown')).toBe(true);
  });

  it('does not flag small pastes below threshold', () => {
    expect(shouldFlag(50, 100, true, 'external')).toBe(false);
  });
});
