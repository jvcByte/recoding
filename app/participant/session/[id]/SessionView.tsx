'use client';

import { useEffect, useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import ResponseEditor from './ResponseEditor';
import CodeEditor from './CodeEditor';
import { AlertTriangle } from 'lucide-react';

interface QuestionStatus { question_index: number; has_draft: boolean; is_final: boolean; }
interface SessionState {
  session_id: string; exercise_slug: string; current_question_index: number; question_count: number;
  remaining_seconds: number | null; warning_low_time: boolean; question_statuses: QuestionStatus[];
}
interface Question {
  index: number;
  text: string;
  type: 'written' | 'code';
  language: string;
  starter: string;
}

function TimerDisplay({ remainingSeconds, warningLowTime }: { remainingSeconds: number | null; warningLowTime: boolean }) {
  if (remainingSeconds === null) return <div className="timer">∞</div>;
  const clamped = Math.max(0, remainingSeconds);
  const m = Math.floor(clamped / 60);
  const s = clamped % 60;
  return (
    <div className={`timer${warningLowTime ? ' warning' : ''}`}>
      {warningLowTime && <AlertTriangle size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />}
      {String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
    </div>
  );
}

function ProgressBar({ currentIndex, viewingIndex, questionCount, questionStatuses, onNavigate }: {
  currentIndex: number; viewingIndex: number; questionCount: number;
  questionStatuses: QuestionStatus[]; onNavigate: (i: number) => void;
}) {
  const statusMap = new Map(questionStatuses.map((s) => [s.question_index, s]));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
      {/* Counter */}
      <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>
        Q {viewingIndex + 1}
        <span style={{ color: 'var(--text3)', fontWeight: 400 }}> / {questionCount}</span>
      </span>

      {/* Dots */}
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
        {Array.from({ length: questionCount }, (_, i) => {
          const status = statusMap.get(i);
          const reachable = i <= currentIndex;
          let bg = 'var(--bg5)';
          let title = `Q${i + 1}: not started`;
          if (status?.is_final)       { bg = 'var(--green)';  title = `Q${i + 1}: final`; }
          else if (status?.has_draft) { bg = 'var(--orange)'; title = `Q${i + 1}: draft`; }
          else if (i === currentIndex){ bg = 'var(--accent)'; title = `Q${i + 1}: current`; }
          const isViewing = i === viewingIndex;
          return (
            <div
              key={i}
              title={reachable ? title : `Q${i + 1}: not yet reached`}
              onClick={() => reachable && onNavigate(i)}
              style={{
                width: isViewing ? 12 : 9,
                height: isViewing ? 12 : 9,
                borderRadius: '50%',
                background: bg,
                opacity: reachable ? 1 : 0.2,
                cursor: reachable ? 'pointer' : 'default',
                border: isViewing ? '2px solid rgba(255,255,255,0.5)' : '2px solid transparent',
                boxShadow: isViewing ? `0 0 8px ${bg}` : 'none',
                transition: 'transform 0.15s, box-shadow 0.15s',
                flexShrink: 0,
              }}
              onMouseEnter={e => { if (reachable) (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.35)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)'; }}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        {[
          { color: 'var(--accent)', label: 'current' },
          { color: 'var(--orange)', label: 'draft' },
          { color: 'var(--green)',  label: 'final' },
        ].map(({ color, label }) => (
          <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function SessionView({ exerciseId }: { exerciseId: string }) {
  const [sessionState, setSessionState] = useState<SessionState | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [viewingIndex, setViewingIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sessionClosed, setSessionClosed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [advancing, setAdvancing] = useState(false);
  const [advanceError, setAdvanceError] = useState<string | null>(null);
  // Local countdown — ticks every second, synced from server every 10s
  const [localRemaining, setLocalRemaining] = useState<number | null>(null);

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch(`/api/exercises/${exerciseId}/session`);
      // console.log(res);
      if (res.status === 423) { const d = await res.json(); setError(`Session not yet open. Opens at: ${d.opens_at ?? 'unknown'}`); return; }
      if (res.status === 410) { setSessionClosed(true); return; }
      if (!res.ok) { setError('Failed to load session.'); return; }
      const data: SessionState = await res.json();
      setSessionState(data);
      // Sync local countdown from server
      setLocalRemaining(data.remaining_seconds);
      setError(null);
    } catch { setError('Network error loading session.'); }
  }, [exerciseId]);

  const fetchQuestion = useCallback(async (index: number) => {
    try {
      const res = await fetch(`/api/exercises/${exerciseId}/question/${index}`);
      setQuestion(res.ok ? await res.json() : null);
    } catch { setQuestion(null); }
  }, [exerciseId]);

  const activeIndex = viewingIndex ?? sessionState?.current_question_index ?? 0;
  const isViewingCurrent = viewingIndex === null || viewingIndex === sessionState?.current_question_index;

  const handleAdvance = useCallback(async () => {
    setAdvancing(true); setAdvanceError(null);
    try {
      const res = await fetch(`/api/exercises/${exerciseId}/session/advance`, { method: 'POST' });
      if (!res.ok) { const d = await res.json().catch(() => ({})); setAdvanceError((d as { error?: string }).error ?? 'Failed to advance.'); return; }
      setViewingIndex(null);
      await fetchSession();
    } catch { setAdvanceError('Network error.'); }
    finally { setAdvancing(false); }
  }, [exerciseId, fetchSession]);

  const handleSubmitFinal = useCallback(async () => {
    if (!sessionState) return;
    setAdvancing(true); setAdvanceError(null);
    try {
      // Finalise the last question's submission
      const sessionId = sessionState.session_id;
      const questionIndex = sessionState.current_question_index;
      const res = await fetch(`/api/submissions/${sessionId}/final`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question_index: questionIndex }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        // 409 = already final, that's fine — still close
        if ((d as { error?: string }).error !== 'Submission is already final') {
          setAdvanceError((d as { error?: string }).error ?? 'Failed to submit.');
          return;
        }
      }
      setSessionClosed(true);
    } catch { setAdvanceError('Network error.'); }
    finally { setAdvancing(false); }
  }, [sessionState]);

  useEffect(() => { (async () => { setLoading(true); await fetchSession(); setLoading(false); })(); }, [fetchSession]);
  useEffect(() => { if (sessionState) fetchQuestion(activeIndex); }, [sessionState, activeIndex, fetchQuestion]);
  // Server sync every 10s
  useEffect(() => { const t = setInterval(fetchSession, 10_000); return () => clearInterval(t); }, [fetchSession]);
  // Local 1-second countdown
  useEffect(() => {
    if (localRemaining === null || sessionClosed) return;
    const t = setInterval(() => {
      setLocalRemaining((prev) => (prev !== null && prev > 0 ? prev - 1 : prev));
    }, 1000);
    return () => clearInterval(t);
  }, [localRemaining, sessionClosed]);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, color: 'var(--text3)' }}>
      Loading session…
    </div>
  );

  if (error) return (
    <div style={{ padding: '2rem 0' }}>
      <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>
      <a href="/participant" className="btn btn-ghost">← Back to exercises</a>
    </div>
  );

  if (!sessionState) {
    if (sessionClosed) return (
      <div style={{ padding: '2rem 0' }}>
        <div className="alert alert-error" style={{ marginBottom: '1rem', textAlign: 'center', fontSize: 15 }}>
          Session closed — your responses have been saved
        </div>
        <div style={{ textAlign: 'center' }}>
          <a href="/participant" className="btn btn-secondary">← Back to exercises</a>
        </div>
      </div>
    );
    return <div style={{ color: 'var(--text3)' }}>No session data.</div>;
  }

  const displayRemainingSeconds = sessionClosed ? 0 : localRemaining;

  return (
    <div className="session-layout">
      {sessionClosed && (
        <div className="alert alert-error" style={{ textAlign: 'center', fontWeight: 700 }}>
          Session closed — your responses have been saved
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <ProgressBar
          currentIndex={sessionState.current_question_index}
          viewingIndex={activeIndex}
          questionCount={sessionState.question_count}
          questionStatuses={sessionState.question_statuses}
          onNavigate={(i) => setViewingIndex(i === sessionState.current_question_index ? null : i)}
        />
        <div style={{ flexShrink: 0 }}>
          <TimerDisplay remainingSeconds={displayRemainingSeconds} warningLowTime={displayRemainingSeconds !== null && displayRemainingSeconds < 300} />
        </div>
      </div>

      {/* Question */}
      <div className="question-box">
        <div className="question-label">Question {activeIndex + 1}</div>
        {question
          ? <div className="question-text"><ReactMarkdown>{question.text}</ReactMarkdown></div>
          : <div style={{ color: 'var(--text3)' }}>Loading…</div>
        }
      </div>

      {/* Editor — code or written depending on question type */}
      {question?.type === 'code' ? (
        <CodeEditor
          sessionId={sessionState.session_id}
          questionIndex={activeIndex}
          language={question.language}
          starter={question.starter}
          isClosed={sessionClosed}
          exerciseSlug={sessionState.exercise_slug}
        />
      ) : (
        <ResponseEditor
          sessionId={sessionState.session_id}
          questionIndex={activeIndex}
          isClosed={sessionClosed}
        />
      )}

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {!isViewingCurrent ? (
          <button onClick={() => setViewingIndex(null)} className="btn btn-ghost">
            ← Back to Current
          </button>
        ) : <div />}

        {isViewingCurrent && sessionState.current_question_index + 1 < sessionState.question_count && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
            {advanceError && <span style={{ fontSize: 12, color: 'var(--red)' }}>{advanceError}</span>}
            <button
              onClick={handleAdvance}
              disabled={sessionClosed || advancing}
              className="btn btn-primary btn-lg"
            >
              {advancing ? 'Advancing…' : 'Next Question →'}
            </button>
          </div>
        )}

        {isViewingCurrent && sessionState.current_question_index + 1 === sessionState.question_count && !sessionClosed && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
            {advanceError && <span style={{ fontSize: 12, color: 'var(--red)' }}>{advanceError}</span>}
            <button
              onClick={handleSubmitFinal}
              disabled={sessionClosed || advancing}
              className="btn btn-success btn-lg"
            >
              {advancing ? 'Submitting…' : 'Submit Final Answer ✓'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
