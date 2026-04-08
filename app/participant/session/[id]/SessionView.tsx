'use client';

import { useEffect, useState, useCallback } from 'react';
import ResponseEditor from './ResponseEditor';

// ── Types ────────────────────────────────────────────────────────────────────

interface QuestionStatus {
  question_index: number;
  has_draft: boolean;
  is_final: boolean;
}

interface SessionState {
  session_id: string;
  current_question_index: number;
  question_count: number;
  remaining_seconds: number | null;
  warning_low_time: boolean;
  question_statuses: QuestionStatus[];
}

interface Question {
  index: number;
  text: string;
}

// ── TimerDisplay ─────────────────────────────────────────────────────────────

function TimerDisplay({
  remainingSeconds,
  warningLowTime,
}: {
  remainingSeconds: number | null;
  warningLowTime: boolean;
}) {
  if (remainingSeconds === null) {
    return <div style={{ fontSize: '1.25rem' }}>No time limit</div>;
  }

  const clamped = Math.max(0, remainingSeconds);
  const minutes = Math.floor(clamped / 60);
  const seconds = clamped % 60;
  const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <div
      style={{
        fontSize: '1.5rem',
        fontWeight: 'bold',
        color: warningLowTime ? 'red' : 'inherit',
        border: warningLowTime ? '2px solid red' : '2px solid #ccc',
        borderRadius: 6,
        padding: '0.25rem 0.75rem',
        display: 'inline-block',
      }}
    >
      {warningLowTime && <span style={{ marginRight: 6 }}>⚠️</span>}
      {formatted}
    </div>
  );
}

// ── ProgressBar ──────────────────────────────────────────────────────────────

function ProgressBar({
  currentIndex,
  questionCount,
  questionStatuses,
}: {
  currentIndex: number;
  questionCount: number;
  questionStatuses: QuestionStatus[];
}) {
  const statusMap = new Map(questionStatuses.map((s) => [s.question_index, s]));

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
      <span style={{ fontWeight: 'bold' }}>
        Question {currentIndex + 1} of {questionCount}
      </span>
      <div style={{ display: 'flex', gap: 4 }}>
        {Array.from({ length: questionCount }, (_, i) => {
          const status = statusMap.get(i);
          let bg = '#e0e0e0';
          let title = `Question ${i + 1}: not started`;

          if (status?.is_final) {
            bg = '#4caf50';
            title = `Question ${i + 1}: final`;
          } else if (status?.has_draft) {
            bg = '#ff9800';
            title = `Question ${i + 1}: draft`;
          } else if (i === currentIndex) {
            bg = '#2196f3';
            title = `Question ${i + 1}: current`;
          }

          return (
            <div
              key={i}
              title={title}
              style={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                background: bg,
                border: i === currentIndex ? '2px solid #000' : '2px solid transparent',
              }}
            />
          );
        })}
      </div>
      <div style={{ fontSize: '0.8rem', color: '#555', display: 'flex', gap: 8 }}>
        <span>🔵 current</span>
        <span style={{ color: '#ff9800' }}>🟠 draft</span>
        <span style={{ color: '#4caf50' }}>🟢 final</span>
      </div>
    </div>
  );
}

// ── QuestionDisplay ──────────────────────────────────────────────────────────

function QuestionDisplay({ question }: { question: Question | null }) {
  if (!question) {
    return <div style={{ padding: '1rem', color: '#888' }}>Loading question…</div>;
  }

  return (
    <div style={{ border: '1px solid #ddd', borderRadius: 6, padding: '1rem' }}>
      <h3 style={{ margin: '0 0 0.75rem' }}>Question {question.index + 1}</h3>
      <pre
        style={{
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          fontFamily: 'inherit',
          margin: 0,
          lineHeight: 1.6,
        }}
      >
        {question.text}
      </pre>
    </div>
  );
}

// ── SessionView ──────────────────────────────────────────────────────────────

export default function SessionView({ exerciseId }: { exerciseId: string }) {
  const [sessionState, setSessionState] = useState<SessionState | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sessionClosed, setSessionClosed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [advancing, setAdvancing] = useState(false);
  const [advanceError, setAdvanceError] = useState<string | null>(null);

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch(`/api/exercises/${exerciseId}/session`);
      if (res.status === 423) {
        const data = await res.json();
        setError(`Session not yet open. Opens at: ${data.opens_at ?? 'unknown'}`);
        return;
      }
      if (res.status === 410) {
        // Keep sessionState alive so ResponseEditor can show "Session closed"
        setSessionClosed(true);
        return;
      }
      if (!res.ok) {
        setError('Failed to load session.');
        return;
      }
      const data: SessionState = await res.json();
      setSessionState(data);
      setError(null);
    } catch {
      setError('Network error loading session.');
    }
  }, [exerciseId]);

  const fetchQuestion = useCallback(async (index: number) => {
    try {
      const res = await fetch(`/api/exercises/${exerciseId}/question/${index}`);
      if (!res.ok) {
        setQuestion(null);
        return;
      }
      const data: Question = await res.json();
      setQuestion(data);
    } catch {
      setQuestion(null);
    }
  }, [exerciseId]);

  const handleAdvance = useCallback(async () => {
    setAdvancing(true);
    setAdvanceError(null);
    try {
      const res = await fetch(`/api/exercises/${exerciseId}/session/advance`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setAdvanceError((data as { error?: string }).error ?? 'Failed to advance question.');
        return;
      }
      await fetchSession();
    } catch {
      setAdvanceError('Network error advancing question.');
    } finally {
      setAdvancing(false);
    }
  }, [exerciseId, fetchSession]);

  // Initial load
  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchSession();
      setLoading(false);
    })();
  }, [fetchSession]);

  // Fetch question when session state changes
  useEffect(() => {
    if (sessionState) {
      fetchQuestion(sessionState.current_question_index);
    }
  }, [sessionState, fetchQuestion]);

  // Poll every 10 seconds to update remaining time
  useEffect(() => {
    const interval = setInterval(() => {
      fetchSession();
    }, 10_000);
    return () => clearInterval(interval);
  }, [fetchSession]);

  if (loading) {
    return <div style={{ padding: '2rem' }}>Loading session…</div>;
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', color: 'red' }}>
        <p>{error}</p>
        <a href="/participant">← Back to catalogue</a>
      </div>
    );
  }

  if (!sessionState) {
    if (sessionClosed) {
      return (
        <div style={{ padding: '2rem' }}>
          <div
            style={{
              background: '#f44336',
              color: '#fff',
              padding: '0.75rem 1rem',
              borderRadius: 6,
              fontWeight: 'bold',
              fontSize: '1rem',
              textAlign: 'center',
              marginBottom: '1rem',
            }}
          >
            Session closed — your responses have been saved
          </div>
          <a href="/participant">← Back to catalogue</a>
        </div>
      );
    }
    return <div style={{ padding: '2rem' }}>No session data.</div>;
  }

  // When closed, clamp remaining time to 0
  const displayRemainingSeconds = sessionClosed ? 0 : sessionState.remaining_seconds;

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Session-closed banner */}
      {sessionClosed && (
        <div
          style={{
            background: '#f44336',
            color: '#fff',
            padding: '0.75rem 1rem',
            borderRadius: 6,
            fontWeight: 'bold',
            fontSize: '1rem',
            textAlign: 'center',
          }}
        >
          Session closed — your responses have been saved
        </div>
      )}

      {/* Header row: progress + timer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <ProgressBar
          currentIndex={sessionState.current_question_index}
          questionCount={sessionState.question_count}
          questionStatuses={sessionState.question_statuses}
        />
        <TimerDisplay
          remainingSeconds={displayRemainingSeconds}
          warningLowTime={sessionState.warning_low_time}
        />
      </div>

      {/* Question */}
      <QuestionDisplay question={question} />

      {/* Response editor */}
      <ResponseEditor
        sessionId={sessionState.session_id}
        questionIndex={sessionState.current_question_index}
        isClosed={sessionClosed}
      />

      {/* Next Question button */}
      {sessionState.current_question_index + 1 < sessionState.question_count && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
          {advanceError && (
            <span style={{ fontSize: '0.85rem', color: '#f44336' }}>{advanceError}</span>
          )}
          <button
            onClick={handleAdvance}
            disabled={sessionClosed || advancing}
            style={{
              padding: '0.5rem 1.5rem',
              fontSize: '1rem',
              borderRadius: 4,
              cursor: sessionClosed || advancing ? 'not-allowed' : 'pointer',
              opacity: sessionClosed || advancing ? 0.5 : 1,
            }}
          >
            {advancing ? 'Advancing…' : 'Next Question →'}
          </button>
        </div>
      )}
    </main>
  );
}
