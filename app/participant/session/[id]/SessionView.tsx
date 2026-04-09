'use client';

import { useEffect, useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import ResponseEditor from './ResponseEditor';
import CodeEditor from './CodeEditor';
import { AlertTriangle, Check, Circle } from 'lucide-react';

interface QuestionStatus { question_index: number; has_draft: boolean; is_final: boolean; }
interface SessionState {
  session_id: string; current_question_index: number; question_count: number;
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
    <div className="progress-bar">
      <span style={{ fontWeight: 700, fontSize: 15 }}>
        Q {viewingIndex + 1} <span style={{ color: 'var(--text3)', fontWeight: 400 }}>of {questionCount}</span>
      </span>
      <div className="progress-dots">
        {Array.from({ length: questionCount }, (_, i) => {
          const status = statusMap.get(i);
          const reachable = i <= currentIndex;
          let color = 'var(--bg3)';
          let title = `Question ${i + 1}: not started`;
          if (status?.is_final) { color = 'var(--green)'; title = `Q${i + 1}: final`; }
          else if (status?.has_draft) { color = 'var(--orange)'; title = `Q${i + 1}: draft`; }
          else if (i === currentIndex) { color = 'var(--accent)'; title = `Q${i + 1}: current`; }
          return (
            <div
              key={i}
              title={reachable ? title : `Q${i + 1}: not yet reached`}
              onClick={() => reachable && onNavigate(i)}
              className={`progress-dot${reachable ? ' clickable' : ''}${i === viewingIndex ? ' active' : ''}`}
              style={{ background: color, opacity: reachable ? 1 : 0.3 }}
            />
          );
        })}
      </div>
      <div style={{ fontSize: 11, color: 'var(--text3)', display: 'flex', gap: 10, alignItems: 'center' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'var(--accent)' }}><Circle size={8} fill="currentColor" /> current</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'var(--orange)' }}><Circle size={8} fill="currentColor" /> draft</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'var(--green)' }}><Circle size={8} fill="currentColor" /> final</span>
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

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch(`/api/exercises/${exerciseId}/session`);
      if (res.status === 423) { const d = await res.json(); setError(`Session not yet open. Opens at: ${d.opens_at ?? 'unknown'}`); return; }
      if (res.status === 410) { setSessionClosed(true); return; }
      if (!res.ok) { setError('Failed to load session.'); return; }
      const data: SessionState = await res.json();
      setSessionState(data); setError(null);
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

  useEffect(() => { (async () => { setLoading(true); await fetchSession(); setLoading(false); })(); }, [fetchSession]);
  useEffect(() => { if (sessionState) fetchQuestion(activeIndex); }, [sessionState, activeIndex, fetchQuestion]);
  useEffect(() => { const t = setInterval(fetchSession, 10_000); return () => clearInterval(t); }, [fetchSession]);

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

  const displayRemainingSeconds = sessionClosed ? 0 : sessionState.remaining_seconds;

  return (
    <div className="session-layout">
      {sessionClosed && (
        <div className="alert alert-error" style={{ textAlign: 'center', fontWeight: 700 }}>
          Session closed — your responses have been saved
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <ProgressBar
          currentIndex={sessionState.current_question_index}
          viewingIndex={activeIndex}
          questionCount={sessionState.question_count}
          questionStatuses={sessionState.question_statuses}
          onNavigate={(i) => setViewingIndex(i === sessionState.current_question_index ? null : i)}
        />
        <TimerDisplay remainingSeconds={displayRemainingSeconds} warningLowTime={sessionState.warning_low_time} />
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
      </div>
    </div>
  );
}
