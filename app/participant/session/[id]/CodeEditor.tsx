'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import type * as Monaco from 'monaco-editor';
import { Play, RotateCcw, Pause, AlertTriangle } from 'lucide-react';

interface RunResult {
  stdout: string;
  stderr: string;
  compile_output: string;
  exit_code: number | null;
}

interface EditEvent {
  event_type: 'insert' | 'delete';
  position: number;
  char_count: number;
  occurred_at: string;
}

interface Props {
  sessionId: string;
  questionIndex: number;
  language: string;
  starter: string;
  isClosed: boolean;
}

export default function CodeEditor({ sessionId, questionIndex, language, starter, isClosed }: Props) {
  const [code, setCode] = useState(starter);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'failed'>('idle');
  const [stdin, setStdin] = useState('');
  const [showStdin, setShowStdin] = useState(false);
  const [showPasteBanner, setShowPasteBanner] = useState(false);

  const codeRef = useRef(code);
  codeRef.current = code;
  const lastSavedRef = useRef('');
  const submissionIdRef = useRef<string | null>(null);
  const editBufferRef = useRef<EditEvent[]>([]);
  const prevLengthRef = useRef(starter.length);
  const pasteBannerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const focusLostAtRef = useRef<string | null>(null);
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);

  // ── Reset on question change ──────────────────────────────────────────────
  useEffect(() => {
    setCode(starter);
    setResult(null);
    setSaveStatus('idle');
    setShowPasteBanner(false);
    lastSavedRef.current = '';
    submissionIdRef.current = null;
    editBufferRef.current = [];
    prevLengthRef.current = starter.length;

    async function restore() {
      try {
        const res = await fetch(`/api/submissions/${sessionId}/restore?q=${questionIndex}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.response_text) {
          setCode(data.response_text);
          lastSavedRef.current = data.response_text;
          prevLengthRef.current = data.response_text.length;
        }
      } catch { /* silent */ }
    }
    restore();
  }, [sessionId, questionIndex, starter]);

  // ── Autosave ──────────────────────────────────────────────────────────────
  const doAutosave = useCallback(async () => {
    const current = codeRef.current;
    if (current === lastSavedRef.current || isClosed) return;
    setSaveStatus('saving');
    try {
      const res = await fetch(`/api/submissions/${sessionId}/autosave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question_index: questionIndex, response_text: current }),
      });
      if (res.ok) {
        const data = await res.json();
        submissionIdRef.current = data.submission_id;

        // Flush edit buffer
        const events = editBufferRef.current.splice(0);
        if (events.length > 0 && submissionIdRef.current) {
          fetch('/api/events/keystrokes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ submission_id: submissionIdRef.current, events }),
          }).catch(() => {});
        }

        lastSavedRef.current = current;
        setSaveStatus('saved');
      } else {
        setSaveStatus('failed');
      }
    } catch { setSaveStatus('failed'); }
  }, [sessionId, questionIndex, isClosed]);

  useEffect(() => {
    const t = setInterval(doAutosave, 30_000);
    return () => clearInterval(t);
  }, [doAutosave]);

  // ── Monaco mount — wire paste + change events ─────────────────────────────
  const handleEditorMount: OnMount = useCallback((editor) => {
    editorRef.current = editor;

    // Paste detection via Monaco's onDidPaste
    editor.onDidPaste((e) => {
      const charCount = e.range
        ? editor.getModel()?.getValueInRange(e.range)?.length ?? 0
        : 0;
      const occurredAt = new Date().toISOString();

      // Show banner
      setShowPasteBanner(true);
      if (pasteBannerTimerRef.current) clearTimeout(pasteBannerTimerRef.current);
      pasteBannerTimerRef.current = setTimeout(() => setShowPasteBanner(false), 5000);

      // Fire paste event to API
      const fire = (submissionId: string) => {
        fetch('/api/events/paste', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ submission_id: submissionId, char_count: charCount, occurred_at: occurredAt }),
        }).catch(() => {});
      };

      if (submissionIdRef.current) {
        fire(submissionIdRef.current);
      } else {
        // Trigger an autosave to get a submission_id, then fire
        doAutosave().then(() => {
          if (submissionIdRef.current) fire(submissionIdRef.current);
        });
      }
    });

    // Edit event tracking via content change
    editor.onDidChangeModelContent((e) => {
      const newLength = editor.getModel()?.getValueLength() ?? 0;
      const oldLength = prevLengthRef.current;
      const diff = newLength - oldLength;
      prevLengthRef.current = newLength;

      if (diff !== 0) {
        const pos = e.changes[0]?.rangeOffset ?? 0;
        editBufferRef.current.push({
          event_type: diff > 0 ? 'insert' : 'delete',
          position: pos,
          char_count: Math.abs(diff),
          occurred_at: new Date().toISOString(),
        });
      }
    });
  }, [doAutosave]);

  // ── Focus / visibility monitoring ─────────────────────────────────────────
  useEffect(() => {
    if (isClosed) return;

    function recordFocusLoss() {
      if (focusLostAtRef.current === null) focusLostAtRef.current = new Date().toISOString();
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
        body: JSON.stringify({ session_id: sessionId, lost_at: lostAt, regained_at: regainedAt, duration_ms: durationMs }),
      }).catch(() => {});
    }

    function handleVisibility() {
      if (document.visibilityState === 'hidden') recordFocusLoss();
      else recordFocusRegain();
    }

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('blur', recordFocusLoss);
    window.addEventListener('focus', recordFocusRegain);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('blur', recordFocusLoss);
      window.removeEventListener('focus', recordFocusRegain);
    };
  }, [sessionId, isClosed]);

  // ── Cleanup ───────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => { if (pasteBannerTimerRef.current) clearTimeout(pasteBannerTimerRef.current); };
  }, []);

  // ── Run code ──────────────────────────────────────────────────────────────
  async function runCode() {
    setRunning(true);
    setResult(null);
    await doAutosave();
    try {
      const res = await fetch('/api/run-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codeRef.current, language, stdin }),
      });
      const data = await res.json();
      setResult(res.ok ? data as RunResult : { stdout: '', stderr: data.error ?? 'Unknown error', compile_output: '', exit_code: 1 });
    } catch (err) {
      setResult({ stdout: '', stderr: (err as Error).message, compile_output: '', exit_code: 1 });
    } finally {
      setRunning(false);
    }
  }

  const hasOutput = result && (result.stdout || result.stderr || result.compile_output);
  const success = result?.exit_code === 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {showPasteBanner && (
        <div className="alert alert-warning" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertTriangle size={14} /> Paste detected — this activity is being recorded
        </div>
      )}

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {language}
        </span>
        <div style={{ flex: 1 }} />
        {saveStatus === 'saving' && <span style={{ fontSize: 12, color: 'var(--text3)' }}>Saving…</span>}
        {saveStatus === 'saved' && <span style={{ fontSize: 12, color: 'var(--green)' }}>Saved</span>}
        {saveStatus === 'failed' && <span style={{ fontSize: 12, color: 'var(--red)' }}>Save failed</span>}
        <button onClick={() => setShowStdin((s) => !s)} className="btn btn-ghost btn-sm">
          {showStdin ? 'Hide stdin' : 'stdin'}
        </button>
        <button onClick={runCode} disabled={running || isClosed} className="btn btn-success" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Play size={13} /> {running ? 'Running…' : 'Run'}
        </button>
      </div>

      {showStdin && (
        <div className="form-group">
          <label className="form-label">stdin (optional)</label>
          <textarea
            className="form-textarea"
            rows={3}
            value={stdin}
            onChange={(e) => setStdin(e.target.value)}
            placeholder="Input to pass via stdin…"
            style={{ minHeight: 'unset', fontFamily: 'monospace', fontSize: 13 }}
          />
        </div>
      )}

      {/* Monaco editor */}
      <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
        <Editor
          height="420px"
          language={language}
          value={code}
          onChange={(val) => { setCode(val ?? ''); setSaveStatus('idle'); }}
          onMount={handleEditorMount}
          theme="vs-dark"
          options={{
            fontSize: 14,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            lineNumbers: 'on',
            readOnly: isClosed,
            wordWrap: 'on',
            tabSize: 4,
            automaticLayout: true,
            padding: { top: 12, bottom: 12 },
          }}
        />
      </div>

      {/* Output panel */}
      {hasOutput && (
        <div style={{
          background: 'var(--bg3)',
          border: `1px solid ${success ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`,
          borderRadius: 'var(--radius)',
          overflow: 'hidden',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border)', background: success ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: success ? 'var(--green)' : 'var(--red)' }}>
              {success ? `Exit 0` : `Exit ${result?.exit_code ?? '?'}`}
            </span>
            <button onClick={() => setResult(null)} className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }}>Clear</button>
          </div>
          {result?.compile_output && (
            <div style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--red)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>Compile Error</div>
              <pre style={{ margin: 0, fontSize: 12, color: '#fca5a5', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{result.compile_output}</pre>
            </div>
          )}
          {result?.stdout && (
            <div style={{ padding: '0.75rem', borderBottom: result?.stderr ? '1px solid var(--border)' : undefined }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--green)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>stdout</div>
              <pre style={{ margin: 0, fontSize: 12, color: 'var(--text)', whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: 300, overflowY: 'auto' }}>{result.stdout}</pre>
            </div>
          )}
          {result?.stderr && (
            <div style={{ padding: '0.75rem' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--red)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>stderr</div>
              <pre style={{ margin: 0, fontSize: 12, color: '#fca5a5', whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: 200, overflowY: 'auto' }}>{result.stderr}</pre>
            </div>
          )}
        </div>
      )}

      {running && !result && (
        <div style={{ textAlign: 'center', color: 'var(--text3)', fontSize: 13, padding: '1rem' }}>
          Compiling and running…
        </div>
      )}
    </div>
  );
}
