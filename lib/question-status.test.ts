/**
 * Unit tests for question status tracking logic
 * Tests status transitions and counting logic
 */

import { describe, it, expect } from 'vitest';

// Status transition rules (mirrors DB/API logic)
type QuestionStatus = 'not_started' | 'draft' | 'skipped' | 'final';

function deriveStatus(
  responseText: string | null,
  isFinal: boolean,
  isSkipped: boolean
): QuestionStatus {
  if (isFinal) return 'final';
  if (isSkipped) return 'skipped';
  if (responseText && responseText.trim().length > 0) return 'draft';
  return 'not_started';
}

function countFinal(statuses: QuestionStatus[]): number {
  return statuses.filter((s) => s === 'final').length;
}

function countAnswered(statuses: QuestionStatus[]): number {
  return statuses.filter((s) => s === 'final' || s === 'draft').length;
}

describe('question status transitions', () => {
  it('not_started → draft when text is added', () => {
    expect(deriveStatus('some code', false, false)).toBe('draft');
  });

  it('not_started stays not_started with empty text', () => {
    expect(deriveStatus('', false, false)).toBe('not_started');
    expect(deriveStatus(null, false, false)).toBe('not_started');
    expect(deriveStatus('   ', false, false)).toBe('not_started');
  });

  it('draft → final when submitted', () => {
    expect(deriveStatus('some code', true, false)).toBe('final');
  });

  it('not_started → skipped when skipped', () => {
    expect(deriveStatus('', false, true)).toBe('skipped');
  });

  it('skipped → draft when text is added (skip overridden by draft)', () => {
    // After returning to a skipped question and adding text, it becomes draft
    expect(deriveStatus('some code', false, false)).toBe('draft');
  });

  it('skipped → final when submitted', () => {
    expect(deriveStatus('some code', true, false)).toBe('final');
  });

  it('final cannot be overridden', () => {
    // is_final=true always wins
    expect(deriveStatus('', true, false)).toBe('final');
    expect(deriveStatus(null, true, true)).toBe('final');
  });
});

describe('question counting logic', () => {
  it('counts only final submissions', () => {
    const statuses: QuestionStatus[] = ['final', 'draft', 'skipped', 'not_started', 'final'];
    expect(countFinal(statuses)).toBe(2);
  });

  it('returns 0 when no finals', () => {
    const statuses: QuestionStatus[] = ['draft', 'skipped', 'not_started'];
    expect(countFinal(statuses)).toBe(0);
  });

  it('counts all finals in a full set', () => {
    const statuses: QuestionStatus[] = ['final', 'final', 'final'];
    expect(countFinal(statuses)).toBe(3);
  });

  it('counts answered (draft + final) correctly', () => {
    const statuses: QuestionStatus[] = ['final', 'draft', 'skipped', 'not_started'];
    expect(countAnswered(statuses)).toBe(2);
  });

  it('handles empty status list', () => {
    expect(countFinal([])).toBe(0);
    expect(countAnswered([])).toBe(0);
  });
});

describe('status transition sequences', () => {
  it('not_started → draft → final', () => {
    let status = deriveStatus(null, false, false);
    expect(status).toBe('not_started');

    status = deriveStatus('my answer', false, false);
    expect(status).toBe('draft');

    status = deriveStatus('my answer', true, false);
    expect(status).toBe('final');
  });

  it('not_started → skipped → draft → final', () => {
    let status = deriveStatus(null, false, false);
    expect(status).toBe('not_started');

    status = deriveStatus('', false, true);
    expect(status).toBe('skipped');

    // User returns and adds text
    status = deriveStatus('my answer', false, false);
    expect(status).toBe('draft');

    status = deriveStatus('my answer', true, false);
    expect(status).toBe('final');
  });

  it('mixed statuses: counting with various combinations', () => {
    const scenarios: Array<{ text: string | null; isFinal: boolean; isSkipped: boolean }> = [
      { text: 'answer 1', isFinal: true, isSkipped: false },
      { text: 'answer 2', isFinal: false, isSkipped: false },
      { text: '', isFinal: false, isSkipped: true },
      { text: null, isFinal: false, isSkipped: false },
      { text: 'answer 5', isFinal: true, isSkipped: false },
    ];

    const statuses = scenarios.map((s) => deriveStatus(s.text, s.isFinal, s.isSkipped));
    expect(statuses).toEqual(['final', 'draft', 'skipped', 'not_started', 'final']);
    expect(countFinal(statuses)).toBe(2);
    expect(countAnswered(statuses)).toBe(3);
  });
});
