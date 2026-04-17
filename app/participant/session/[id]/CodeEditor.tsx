'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Editor, { OnMount, loader } from '@monaco-editor/react';
import type * as Monaco from 'monaco-editor';
import { Play } from 'lucide-react';
import { toast } from 'sonner';

// Define both themes matching the site palette
loader.init().then((monaco) => {
  monaco.editor.defineTheme('recoding-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment',   foreground: '475569', fontStyle: 'italic' },
      { token: 'keyword',   foreground: '818cf8' },
      { token: 'string',    foreground: '6ee7b7' },
      { token: 'number',    foreground: 'fcd34d' },
      { token: 'type',      foreground: '7dd3fc' },
      { token: 'function',  foreground: 'c4b5fd' },
      { token: 'delimiter', foreground: '94a3b8' },
    ],
    colors: {
      'editor.background':                      '#0c0f14',
      'editor.foreground':                      '#e2e8f0',
      'editor.lineHighlightBackground':         '#111520',
      'editor.selectionBackground':             '#2d3a5280',
      'editorLineNumber.foreground':            '#2d3a52',
      'editorLineNumber.activeForeground':      '#6366f1',
      'editorCursor.foreground':                '#6366f1',
      'editorWidget.background':                '#111520',
      'editorWidget.border':                    '#1e2d45',
      'editorSuggestWidget.background':         '#111520',
      'editorSuggestWidget.border':             '#1e2d45',
      'editorSuggestWidget.foreground':         '#e2e8f0',
      'editorSuggestWidget.selectedBackground': '#1e2d45',
      'editorSuggestWidget.highlightForeground':'#818cf8',
      'editorHoverWidget.background':           '#111520',
      'editorHoverWidget.border':               '#1e2d45',
      'scrollbarSlider.background':             '#1e2d4560',
      'scrollbarSlider.hoverBackground':        '#1e2d4590',
    },
  });

  monaco.editor.defineTheme('recoding-light', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'comment',   foreground: '78716c', fontStyle: 'italic' },
      { token: 'keyword',   foreground: '4f46e5' },
      { token: 'string',    foreground: '059669' },
      { token: 'number',    foreground: 'd97706' },
      { token: 'type',      foreground: '0369a1' },
      { token: 'function',  foreground: '7c3aed' },
      { token: 'delimiter', foreground: '78716c' },
    ],
    colors: {
      'editor.background':                      '#faf7f2',
      'editor.foreground':                      '#1c1917',
      'editor.lineHighlightBackground':         '#ede8df',
      'editor.selectionBackground':             '#6366f130',
      'editorLineNumber.foreground':            '#a8a29e',
      'editorLineNumber.activeForeground':      '#4f46e5',
      'editorCursor.foreground':                '#4f46e5',
      'editorWidget.background':                '#faf7f2',
      'editorWidget.border':                    '#e4ddd2',
      'editorSuggestWidget.background':         '#faf7f2',
      'editorSuggestWidget.border':             '#e4ddd2',
      'editorSuggestWidget.foreground':         '#1c1917',
      'editorSuggestWidget.selectedBackground': '#ede8df',
      'editorSuggestWidget.highlightForeground':'#4f46e5',
      'editorHoverWidget.background':           '#faf7f2',
      'editorHoverWidget.border':               '#e4ddd2',
      'scrollbarSlider.background':             '#e4ddd260',
      'scrollbarSlider.hoverBackground':        '#e4ddd290',
    },
  });
});

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
  exerciseSlug: string;
}

export default function CodeEditor({ sessionId, questionIndex, language, starter, isClosed, exerciseSlug }: Props) {
  const [code, setCode] = useState(starter);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'failed'>('idle');
  const [stdin, setStdin] = useState('');
  const [showStdin, setShowStdin] = useState(exerciseSlug === 'go-reloaded');
  const [editorTheme, setEditorTheme] = useState('recoding-dark');

  const codeRef = useRef(code);
  codeRef.current = code;
  const lastSavedRef = useRef('');
  const submissionIdRef = useRef<string | null>(null);
  const editBufferRef = useRef<EditEvent[]>([]);
  const prevLengthRef = useRef(starter.length);
  const focusLostAtRef = useRef<string | null>(null);
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);

  // Sync Monaco theme with site theme
  useEffect(() => {
    function syncTheme() {
      const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
      setEditorTheme(isDark ? 'recoding-dark' : 'recoding-light');
    }
    syncTheme();
    const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    setCode(starter);
    setResult(null);
    setSaveStatus('idle');
    lastSavedRef.current = '';
    submissionIdRef.current = null;
    editBufferRef.current = [];
    prevLengthRef.current = starter.length;

    async function restore() {
      try {
        const res = await fetch(`/api/submissions/${sessionId}/restore?q=${questionIndex}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.response_text && data.response_text.trim().length > starter.trim().length) {
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
        toast.error('Save failed');
      }
    } catch { setSaveStatus('failed'); toast.error('Save failed'); }
  }, [sessionId, questionIndex, isClosed]);

  useEffect(() => {
    const t = setInterval(doAutosave, 30_000);
    return () => clearInterval(t);
  }, [doAutosave]);

  // ── Monaco mount — wire paste + change events ─────────────────────────────
  const handleEditorMount: OnMount = useCallback((editor) => {
    editorRef.current = editor;
    editor.updateOptions({ suggest: { showIcons: true } });

    // Paste detection via Monaco's onDidPaste
    editor.onDidPaste((e) => {
      const charCount = e.range
        ? editor.getModel()?.getValueInRange(e.range)?.length ?? 0
        : 0;
      const occurredAt = new Date().toISOString();

      // Show toast instead of banner
      toast.warning('Paste detected — this activity is being recorded', { duration: 4000 });

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

  // ── Run code ──────────────────────────────────────────────────────────────
  async function runCode() {
    setRunning(true);
    setResult(null);
    await doAutosave();
    try {
      const res = await fetch('/api/run-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codeRef.current, language, stdin, exercise: exerciseSlug }),
      });
      const data = await res.json();
      setResult(res.ok ? data as RunResult : { stdout: '', stderr: data.error ?? 'Unknown error', compile_output: '', exit_code: 1 });
    } catch (err) {
      setResult({ stdout: '', stderr: (err as Error).message, compile_output: '', exit_code: 1 });
    } finally {
      setRunning(false);
    }
  }

  const hasOutput = result !== null;
  const success = result?.exit_code === 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
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
            placeholder={exerciseSlug === 'go-reloaded' ? 'Type your test input here…' : 'Input to pass via stdin…'}
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
          theme={editorTheme}
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
          {result?.stdout ? (
            <div style={{ padding: '0.75rem', borderBottom: result?.stderr ? '1px solid var(--border)' : undefined }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--green)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>stdout</div>
              <pre style={{ margin: 0, fontSize: 12, color: 'var(--text)', whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: 300, overflowY: 'auto' }}>{result.stdout}</pre>
            </div>
          ) : !result?.stderr && !result?.compile_output && (
            <div style={{ padding: '0.75rem' }}>
              <span style={{ fontSize: 12, color: 'var(--text3)', fontStyle: 'italic' }}>No output — your program ran but printed nothing. Did you forget to provide stdin?</span>
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
