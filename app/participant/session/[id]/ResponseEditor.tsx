'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { toast } from 'sonner';
import SaveStatusIndicator, { SaveStatus } from './SaveStatusIndicator';
import { enqueueFailedAutosave } from '@/lib/offline-queue';

interface RestoreResponse {
  response_text: string;
  question_index: number;
  is_final?: boolean;
}

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
  tab_was_blurred?: boolean;
  source_type?: string;
}

export default function ResponseEditor({
  sessionId,
  questionIndex,
  isClosed,
  onDirtyChange,
}: {
  sessionId: string;
  questionIndex: number;
  isClosed: boolean;
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const [text, setText] = useState('');
  const [lastSavedText, setLastSavedText] = useState('');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [isFinal, setIsFinal] = useState(false);
  const [restored, setRestored] = useState(false);

  const submissionIdRef = useRef<string | null>(null);
  const pendingPasteEventsRef = useRef<PasteEventPayload[]>([]);
  const editBufferRef = useRef<EditEvent[]>([]);
  const prevLengthRef = useRef(0);
  const textRef = useRef(text);
  textRef.current = text;
  const lastSavedRef = useRef(lastSavedText);
  lastSavedRef.current = lastSavedText;
  const focusLostAtRef = useRef<string | null>(null);

  // ── Local storage backup helpers ──────────────────────────────────────────
  const saveToLocalStorage = useCallback((sessionId: string, questionIndex: number, text: string) => {
    const key = `autosave:${sessionId}:${questionIndex}`;
    try {
      localStorage.setItem(key, text);
    } catch (err) {
      console.error('Failed to save to localStorage:', err);
    }
  }, []);

  const clearLocalStorage = useCallback((sessionId: string, questionIndex: number) => {
    const key = `autosave:${sessionId}:${questionIndex}`;
    try {
      localStorage.removeItem(key);
    } catch (err) {
      console.error('Failed to clear localStorage:', err);
    }
  }, []);

  // ── Reset on question change ──────────────────────────────────────────────
  useEffect(() => {
    setText('');
    setLastSavedText('');
    setSaveStatus('idle');
    setIsFinal(false);
    setRestored(false);
    submissionIdRef.current = null;
    pendingPasteEventsRef.current = [];
    editBufferRef.current = [];
    prevLengthRef.current = 0;
  }, [questionIndex]);

  // ── Restore ───────────────────────────────────────────────────────────────
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
        if (data.is_final) setIsFinal(true);
      } catch { /* silent */ }
      finally { if (!cancelled) setRestored(true); }
    }
    restore();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, questionIndex]);

  // ── Flush pending paste events ────────────────────────────────────────────
  const flushPendingPasteEvents = useCallback(async (submissionId: string) => {
    const pending = pendingPasteEventsRef.current.splice(0);
    for (const payload of pending) {
      fetch('/api/events/paste', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, submission_id: submissionId }),
      }).catch(() => {});
    }
  }, []);

  // ── Autosave ──────────────────────────────────────────────────────────────
  const doAutosave = useCallback(async (silent = true) => {
    const current = textRef.current;
    if (current === lastSavedRef.current || isFinal || isClosed) return;
    setSaveStatus('saving');
    
    // Save to localStorage before attempting server sync
    saveToLocalStorage(sessionId, questionIndex, current);
    
    try {
      const res = await fetch(`/api/submissions/${sessionId}/autosave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question_index: questionIndex, response_text: current }),
      });
      if (res.ok) {
        const data = await res.json();
        const submissionId: string = data.submission_id;
        const isFirst = submissionIdRef.current === null;
        submissionIdRef.current = submissionId;
        if (isFirst) await flushPendingPasteEvents(submissionId);

        const events = editBufferRef.current.splice(0);
        if (events.length > 0) {
          fetch('/api/events/keystrokes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ submission_id: submissionId, events }),
          }).catch(() => {});
        }

        setLastSavedText(current);
        setSaveStatus('saved');
        onDirtyChange?.(false);
        if (!silent) toast.success('Draft saved');
        
        // Clear localStorage on successful server save
        clearLocalStorage(sessionId, questionIndex);
      } else {
        // Server error - add to offline queue
        setSaveStatus('error');
        enqueueFailedAutosave(sessionId, questionIndex, current);
        if (!silent) toast.error('Save failed - will retry when online');
      }
    } catch {
      // Network error - likely offline
      setSaveStatus('offline');
      enqueueFailedAutosave(sessionId, questionIndex, current);
      if (!silent) toast.error('Offline - changes saved locally');
    }
  }, [sessionId, questionIndex, isFinal, isClosed, flushPendingPasteEvents, saveToLocalStorage, clearLocalStorage]);

  useEffect(() => {
    const t = setInterval(() => doAutosave(true), 3_000);
    return () => clearInterval(t);
  }, [doAutosave]);

  // ── Paste handler ─────────────────────────────────────────────────────────
  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const charCount = e.clipboardData.getData('text').length;
    const pastedText = e.clipboardData.getData('text');
    const occurredAt = new Date().toISOString();
    const tabWasBlurred = focusLostAtRef.current !== null &&
      (Date.now() - new Date(focusLostAtRef.current).getTime()) < 5000;

    // Detect internal paste: pasted text exists in current response
    const isInternal = pastedText.length > 0 && textRef.current.includes(pastedText);
    const sourceType = isInternal ? 'internal' : (tabWasBlurred ? 'external' : 'unknown');

    toast.warning('Paste detected — this activity is being recorded', { duration: 4000 });

    const payload = {
      char_count: charCount,
      occurred_at: occurredAt,
      tab_was_blurred: tabWasBlurred,
      source_type: sourceType,
    };

    if (submissionIdRef.current) {
      fetch('/api/events/paste', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submission_id: submissionIdRef.current, ...payload }),
      }).catch(() => {});
    } else {
      pendingPasteEventsRef.current.push({ submission_id: '', ...payload });
    }
  }, []);

  // ── Input handler ─────────────────────────────────────────────────────────
  const handleInput = useCallback((e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    const diff = target.value.length - prevLengthRef.current;
    if (diff !== 0) {
      editBufferRef.current.push({
        event_type: diff > 0 ? 'insert' : 'delete',
        position: target.selectionStart ?? 0,
        char_count: Math.abs(diff),
        occurred_at: new Date().toISOString(),
      });
    }
    prevLengthRef.current = target.value.length;
  }, []);

  // ── Beforeunload ──────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (textRef.current !== lastSavedRef.current && !isFinal) { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isFinal]);

  // ── Blur tracking for paste context ───────────────────────────────────────
  useEffect(() => {
    const handleBlur = () => { focusLostAtRef.current = new Date().toISOString(); };
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') focusLostAtRef.current = new Date().toISOString();
    };
    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  // ── Final submit ──────────────────────────────────────────────────────────
  async function handleFinalSubmit() {
    setSaveStatus('saving');
    try {
      const saveRes = await fetch(`/api/submissions/${sessionId}/autosave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question_index: questionIndex, response_text: textRef.current }),
      });
      if (!saveRes.ok) { setSaveStatus('error'); toast.error('Failed to save before submitting'); return; }
      const saveData = await saveRes.json();
      const submissionId: string = saveData.submission_id;
      const isFirst = submissionIdRef.current === null;
      submissionIdRef.current = submissionId;
      if (isFirst) await flushPendingPasteEvents(submissionId);
      const events = editBufferRef.current.splice(0);
      if (events.length > 0) {
        fetch('/api/events/keystrokes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ submission_id: submissionId, events }),
        }).catch(() => {});
      }
      setLastSavedText(textRef.current);
    } catch { setSaveStatus('error'); toast.error('Network error'); return; }

    try {
      const finalRes = await fetch(`/api/submissions/${sessionId}/final`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question_index: questionIndex }),
      });
      if (finalRes.ok) {
        setIsFinal(true);
        setSaveStatus('saved');
        toast.success('Answer submitted');
      } else {
        setSaveStatus('error');
        toast.error('Failed to submit');
      }
    } catch { setSaveStatus('error'); toast.error('Network error'); }
  }

  const isDisabled = isClosed || isFinal;
  const hasUnsaved = text !== lastSavedText && !isFinal;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {isClosed && !isFinal && <div className="alert alert-error">Session closed</div>}
      {isFinal && <div className="alert alert-success">Final submission — no further edits allowed</div>}

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        <label htmlFor="response" style={{ fontWeight: 700, fontSize: 14 }}>Your Response</label>
        {hasUnsaved && !isDisabled && <span className="badge badge-orange">Unsaved draft</span>}
        <SaveStatusIndicator status={saveStatus} />
      </div>

      <textarea
        id="response"
        className="form-textarea"
        rows={14}
        disabled={isDisabled || !restored}
        value={text}
        onChange={(e) => { setText(e.target.value); setSaveStatus('idle'); onDirtyChange?.(true); }}
        onInput={handleInput}
        onPaste={handlePaste}
        placeholder={restored ? 'Write your answer here…' : 'Loading…'}
        style={{ opacity: isDisabled ? 0.6 : 1, cursor: isDisabled ? 'not-allowed' : 'text' }}
      />

      {!isDisabled && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={handleFinalSubmit} disabled={saveStatus === 'saving'} className="btn btn-primary">
            {saveStatus === 'saving' ? 'Saving…' : 'Submit Final Answer'}
          </button>
        </div>
      )}
    </div>
  );
}
