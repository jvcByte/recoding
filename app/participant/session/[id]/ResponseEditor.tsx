'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

// ── Types ────────────────────────────────────────────────────────────────────

interface RestoreResponse {
  response_text: string;
  question_index: number;
  is_final?: boolean;
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'failed';

interface EditEvent {
  event_type: 'insert' | 'delete';
  position: number;
  char_count: number;
  occurred_at: string;
}

interface PasteEventPayload {
  submission_id: string;
  char_count: number;
  occurred_at: string;
}

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
  const [showPasteBanner, setShowPasteBanner] = useState(false);

  // submission_id returned from first successful autosave
  const submissionIdRef = useRef<string | null>(null);

  // Queue of paste events waiting for submission_id
  const pendingPasteEventsRef = useRef<PasteEventPayload[]>([]);

  // Buffer of edit events to batch-upload on autosave
  const editBufferRef = useRef<EditEvent[]>([]);

  // Track previous text length for insert/delete detection
  const prevLengthRef = useRef(0);

  // Track current text in a ref so the autosave interval always sees the latest value
  const textRef = useRef(text);
  textRef.current = text;

  const lastSavedRef = useRef(lastSavedText);
  lastSavedRef.current = lastSavedText;

  // Paste banner timeout ref
  const pasteBannerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Focus tracking
  const focusLostAtRef = useRef<string | null>(null);

  // ── Reset state when question changes ────────────────────────────────────

  useEffect(() => {
    setText('');
    setLastSavedText('');
    setSaveStatus('idle');
    setIsFinal(false);
    setFinalConfirmed(false);
    setRestored(false);
    setShowPasteBanner(false);
    submissionIdRef.current = null;
    pendingPasteEventsRef.current = [];
    editBufferRef.current = [];
    prevLengthRef.current = 0;
  }, [questionIndex]);

  // ── Restore on mount ──────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    async function restore() {
      try {
        const res = await fetch(`/api/submissions/${sessionId}/restore?q=${questionIndex}`);
        if (!res.ok) return;
        const data: RestoreResponse = await res.json();
        if (cancelled) return;
        setText(data.response_text);
        setLastSavedText(data.response_text);
        prevLengthRef.current = data.response_text.length;
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

  // ── Flush pending paste events once submission_id is available ────────────

  const flushPendingPasteEvents = useCallback(async (submissionId: string) => {
    const pending = pendingPasteEventsRef.current.splice(0);
    for (const payload of pending) {
      try {
        await fetch('/api/events/paste', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, submission_id: submissionId }),
        });
      } catch {
        // best-effort
      }
    }
  }, []);

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
        const data = await res.json();
        const submissionId: string = data.submission_id;

        // Store submission_id and flush any queued paste events
        const isFirstSave = submissionIdRef.current === null;
        submissionIdRef.current = submissionId;
        if (isFirstSave) {
          await flushPendingPasteEvents(submissionId);
        }

        // Batch-upload edit events
        const events = editBufferRef.current.splice(0);
        if (events.length > 0) {
          try {
            await fetch('/api/events/keystrokes', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ submission_id: submissionId, events }),
            });
          } catch {
            // best-effort; events are already cleared from buffer
          }
        }

        setLastSavedText(current);
        setSaveStatus('saved');
      } else {
        setSaveStatus('failed');
      }
    } catch {
      setSaveStatus('failed');
    }
  }, [sessionId, questionIndex, isFinal, isClosed, flushPendingPasteEvents]);

  useEffect(() => {
    const interval = setInterval(doAutosave, 25_000);
    return () => clearInterval(interval);
  }, [doAutosave]);

  // ── Paste handler ─────────────────────────────────────────────────────────

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedText = e.clipboardData.getData('text');
    const charCount = pastedText.length;
    const occurredAt = new Date().toISOString();

    // Show warning banner for 5 seconds
    setShowPasteBanner(true);
    if (pasteBannerTimerRef.current) clearTimeout(pasteBannerTimerRef.current);
    pasteBannerTimerRef.current = setTimeout(() => setShowPasteBanner(false), 5000);

    const submissionId = submissionIdRef.current;
    if (submissionId) {
      // Fire and forget
      fetch('/api/events/paste', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submission_id: submissionId, char_count: charCount, occurred_at: occurredAt }),
      }).catch(() => {});
    } else {
      // Queue until submission_id is available
      pendingPasteEventsRef.current.push({
        submission_id: '',
        char_count: charCount,
        occurred_at: occurredAt,
      });
    }
  }, []);

  // ── Input handler (edit event capture) ───────────────────────────────────

  const handleInput = useCallback((e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    const newLength = target.value.length;
    const oldLength = prevLengthRef.current;
    const diff = newLength - oldLength;

    if (diff !== 0) {
      editBufferRef.current.push({
        event_type: diff > 0 ? 'insert' : 'delete',
        position: target.selectionStart ?? 0,
        char_count: Math.abs(diff),
        occurred_at: new Date().toISOString(),
      });
    }

    prevLengthRef.current = newLength;
  }, []);

  // ── Focus / visibility monitoring ────────────────────────────────────────

  useEffect(() => {
    if (isClosed || isFinal) return;

    function recordFocusLoss() {
      if (focusLostAtRef.current === null) {
        focusLostAtRef.current = new Date().toISOString();
      }
    }

    function recordFocusRegain() {
      const lostAt = focusLostAtRef.current;
      if (!lostAt) return;
      const regainedAt = new Date().toISOString();
      const durationMs = new Date(regainedAt).getTime() - new Date(lostAt).getTime();
      focusLostAtRef.current = null;

      fetch('/api/events/focus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          lost_at: lostAt,
          regained_at: regainedAt,
          duration_ms: durationMs,
        }),
      }).catch(() => {});
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        recordFocusLoss();
      } else {
        recordFocusRegain();
      }
    }

    function handleBlur() {
      recordFocusLoss();
    }

    function handleFocus() {
      recordFocusRegain();
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, [sessionId, isClosed, isFinal]);

  // ── Cleanup paste banner timer on unmount ─────────────────────────────────

  useEffect(() => {
    return () => {
      if (pasteBannerTimerRef.current) clearTimeout(pasteBannerTimerRef.current);
    };
  }, []);

  // ── Unsaved-draft beforeunload warning ────────────────────────────────────

  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (textRef.current !== lastSavedRef.current && !isFinal) {
        e.preventDefault();
        e.returnValue = '';
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isFinal]);

  // ── Final submit ──────────────────────────────────────────────────────────

  async function handleFinalSubmit() {
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
      const saveData = await saveRes.json();
      const submissionId: string = saveData.submission_id;
      const isFirstSave = submissionIdRef.current === null;
      submissionIdRef.current = submissionId;
      if (isFirstSave) {
        await flushPendingPasteEvents(submissionId);
      }

      // Flush edit buffer on final submit too
      const events = editBufferRef.current.splice(0);
      if (events.length > 0) {
        try {
          await fetch('/api/events/keystrokes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ submission_id: submissionId, events }),
          });
        } catch {
          // best-effort
        }
      }

      setLastSavedText(textRef.current);
    } catch {
      setSaveStatus('failed');
      return;
    }

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {isClosed && !isFinal && <div className="alert alert-error">Session closed</div>}
      {isFinal && <div className="alert alert-success">✓ Final submission — no further edits allowed</div>}
      {showPasteBanner && <div className="alert alert-warning">⚠️ Paste detected — this activity is being recorded</div>}

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        <label htmlFor="response" style={{ fontWeight: 700, fontSize: 14 }}>Your Response</label>
        {hasUnsaved && !isDisabled && <span className="badge badge-orange">Unsaved draft</span>}
        {saveStatus === 'saving' && <span style={{ fontSize: 12, color: 'var(--text3)' }}>Saving…</span>}
        {saveStatus === 'saved' && <span style={{ fontSize: 12, color: 'var(--green)' }}>✓ Saved</span>}
        {saveStatus === 'failed' && <span style={{ fontSize: 12, color: 'var(--red)' }}>Save failed</span>}
      </div>

      <textarea
        id="response"
        className="form-textarea"
        rows={14}
        disabled={isDisabled || !restored}
        value={text}
        onChange={(e) => { setText(e.target.value); setSaveStatus('idle'); }}
        onInput={handleInput}
        onPaste={handlePaste}
        placeholder={restored ? 'Write your answer here…' : 'Loading…'}
        style={{ opacity: isDisabled ? 0.6 : 1, cursor: isDisabled ? 'not-allowed' : 'text' }}
      />

      {!isDisabled && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={handleFinalSubmit} disabled={saveStatus === 'saving'} className="btn btn-primary">
            {saveStatus === 'saving' ? 'Saving…' : '✓ Submit Final Answer'}
          </button>
        </div>
      )}
    </div>
  );
}
