'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

// ── Types ────────────────────────────────────────────────────────────────────

interface RestoreResponse {
  response_text: string;
  question_index: number;
  is_final?: boolean;
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'failed';

// ── ResponseEditor ────────────────────────────────────────────────────────────

export default function ResponseEditor({
  sessionId,
  questionIndex,
  isClosed,
}: {
  sessionId: string;
  questionIndex: number;
  isClosed: boolean;
}) {
  const [text, setText] = useState('');
  const [lastSavedText, setLastSavedText] = useState('');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [isFinal, setIsFinal] = useState(false);
  const [finalConfirmed, setFinalConfirmed] = useState(false);
  const [restored, setRestored] = useState(false);

  // Track current text in a ref so the autosave interval always sees the latest value
  const textRef = useRef(text);
  textRef.current = text;

  const lastSavedRef = useRef(lastSavedText);
  lastSavedRef.current = lastSavedText;

  // ── Restore on mount ──────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    async function restore() {
      try {
        const res = await fetch(`/api/submissions/${sessionId}/restore`);
        if (!res.ok) return;
        const data: RestoreResponse = await res.json();
        if (cancelled) return;
        setText(data.response_text);
        setLastSavedText(data.response_text);
        if (data.is_final) {
          setIsFinal(true);
          setFinalConfirmed(true);
        }
      } catch {
        // silently ignore restore errors
      } finally {
        if (!cancelled) setRestored(true);
      }
    }

    restore();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, questionIndex]);

  // ── Autosave ──────────────────────────────────────────────────────────────

  const doAutosave = useCallback(async () => {
    const current = textRef.current;
    const saved = lastSavedRef.current;

    // Skip if nothing changed or already final / closed
    if (current === saved || isFinal || isClosed) return;

    setSaveStatus('saving');
    try {
      const res = await fetch(`/api/submissions/${sessionId}/autosave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question_index: questionIndex, response_text: current }),
      });
      if (res.ok) {
        setLastSavedText(current);
        setSaveStatus('saved');
      } else {
        setSaveStatus('failed');
      }
    } catch {
      setSaveStatus('failed');
    }
  }, [sessionId, questionIndex, isFinal, isClosed]);

  useEffect(() => {
    const interval = setInterval(doAutosave, 25_000);
    return () => clearInterval(interval);
  }, [doAutosave]);

  // ── Unsaved-draft beforeunload warning ────────────────────────────────────

  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (textRef.current !== lastSavedRef.current && !isFinal) {
        e.preventDefault();
        // Modern browsers show their own message; setting returnValue triggers the dialog
        e.returnValue = '';
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isFinal]);

  // ── Final submit ──────────────────────────────────────────────────────────

  async function handleFinalSubmit() {
    // First autosave the latest text
    setSaveStatus('saving');
    try {
      const saveRes = await fetch(`/api/submissions/${sessionId}/autosave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question_index: questionIndex, response_text: textRef.current }),
      });
      if (!saveRes.ok) {
        setSaveStatus('failed');
        return;
      }
      setLastSavedText(textRef.current);
    } catch {
      setSaveStatus('failed');
      return;
    }

    // Then mark as final
    try {
      const finalRes = await fetch(`/api/submissions/${sessionId}/final`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question_index: questionIndex }),
      });
      if (finalRes.ok) {
        setIsFinal(true);
        setFinalConfirmed(true);
        setSaveStatus('saved');
      } else {
        setSaveStatus('failed');
      }
    } catch {
      setSaveStatus('failed');
    }
  }

  // ── Derived state ─────────────────────────────────────────────────────────

  const isDisabled = isClosed || isFinal;
  const hasUnsaved = text !== lastSavedText && !isFinal;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {/* Status banners */}
      {isClosed && !isFinal && (
        <div style={bannerStyle('#f44336')}>Session closed</div>
      )}
      {isFinal && (
        <div style={bannerStyle('#4caf50')}>
          {finalConfirmed
            ? 'Final submission — no further edits allowed'
            : 'Final submission — no further edits allowed'}
        </div>
      )}

      {/* Label row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        <label htmlFor="response" style={{ fontWeight: 'bold' }}>
          Your Response
        </label>

        {/* Draft badge */}
        {hasUnsaved && !isDisabled && (
          <span style={badgeStyle('#ff9800')}>Draft — not yet submitted</span>
        )}

        {/* Save status indicator */}
        {saveStatus === 'saving' && (
          <span style={{ fontSize: '0.85rem', color: '#555' }}>Saving…</span>
        )}
        {saveStatus === 'saved' && (
          <span style={{ fontSize: '0.85rem', color: '#4caf50' }}>Saved</span>
        )}
        {saveStatus === 'failed' && (
          <span style={{ fontSize: '0.85rem', color: '#f44336' }}>Save failed</span>
        )}
      </div>

      {/* Textarea */}
      <textarea
        id="response"
        rows={12}
        disabled={isDisabled || !restored}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setSaveStatus('idle');
        }}
        placeholder={restored ? 'Write your answer here…' : 'Loading…'}
        style={{
          width: '100%',
          padding: '0.75rem',
          fontFamily: 'inherit',
          fontSize: '1rem',
          borderRadius: 4,
          border: '1px solid #ccc',
          boxSizing: 'border-box',
          resize: 'vertical',
          opacity: isDisabled ? 0.7 : 1,
          cursor: isDisabled ? 'not-allowed' : 'text',
        }}
      />

      {/* Submit Final Answer button */}
      {!isDisabled && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={handleFinalSubmit}
            disabled={saveStatus === 'saving'}
            style={{
              padding: '0.5rem 1.25rem',
              fontSize: '1rem',
              borderRadius: 4,
              background: '#1976d2',
              color: '#fff',
              border: 'none',
              cursor: saveStatus === 'saving' ? 'not-allowed' : 'pointer',
              opacity: saveStatus === 'saving' ? 0.7 : 1,
            }}
          >
            {saveStatus === 'saving' ? 'Saving…' : 'Submit Final Answer'}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function bannerStyle(color: string): React.CSSProperties {
  return {
    background: color,
    color: '#fff',
    padding: '0.5rem 0.75rem',
    borderRadius: 4,
    fontWeight: 'bold',
    fontSize: '0.9rem',
  };
}

function badgeStyle(color: string): React.CSSProperties {
  return {
    background: color,
    color: '#fff',
    padding: '0.15rem 0.5rem',
    borderRadius: 12,
    fontSize: '0.78rem',
    fontWeight: 'bold',
  };
}
