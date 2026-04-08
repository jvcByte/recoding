'use client';

import { useState, useRef, useEffect } from 'react';

interface EditEvent {
  id: string;
  event_type: 'insert' | 'delete';
  position: number;
  char_count: number;
  occurred_at: string;
}

interface Props {
  editEvents: EditEvent[];
  finalText: string;
}

/**
 * Reconstructs the response text step-by-step from edit events.
 * Since we only have position + char_count (no raw chars), we reconstruct
 * a visual representation showing insertions and deletions as markers.
 */
export default function TypingReplay({ editEvents, finalText }: Props) {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const total = editEvents.length;

  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => {
        setStep((prev) => {
          if (prev >= total) {
            setPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 150);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [playing, total]);

  function togglePlay() {
    if (step >= total) {
      setStep(0);
      setPlaying(true);
    } else {
      setPlaying((p) => !p);
    }
  }

  // Build a summary of events up to current step
  const visibleEvents = editEvents.slice(0, step);
  const insertCount = visibleEvents.filter((e) => e.event_type === 'insert').reduce((s, e) => s + e.char_count, 0);
  const deleteCount = visibleEvents.filter((e) => e.event_type === 'delete').reduce((s, e) => s + e.char_count, 0);

  const progress = total > 0 ? Math.round((step / total) * 100) : 0;

  return (
    <div style={{ fontFamily: 'monospace', fontSize: 13 }}>
      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <button
          onClick={togglePlay}
          disabled={total === 0}
          style={{
            padding: '6px 16px',
            background: playing ? 'var(--red)' : 'var(--accent)',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            cursor: total === 0 ? 'not-allowed' : 'pointer',
            fontWeight: 600,
            fontSize: 13,
          }}
        >
          {playing ? '⏸ Pause' : step >= total && total > 0 ? '↺ Replay' : '▶ Play'}
        </button>
        <span style={{ color: 'var(--text3)' }}>
          Step {step} / {total}
        </span>
        <input
          type="range"
          min={0}
          max={total}
          value={step}
          onChange={(e) => { setPlaying(false); setStep(Number(e.target.value)); }}
          style={{ flex: 1 }}
        />
        <span style={{ color: 'var(--text3)' }}>{progress}%</span>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 12, fontSize: 12, color: 'var(--text3)' }}>
        <span>Insertions: <strong style={{ color: '#16a34a' }}>+{insertCount} chars</strong></span>
        <span>Deletions: <strong style={{ color: '#dc2626' }}>−{deleteCount} chars</strong></span>
      </div>

      {/* Event log */}
      <div style={{
        background: '#0f172a',
        color: '#e2e8f0',
        borderRadius: 6,
        padding: 12,
        maxHeight: 200,
        overflowY: 'auto',
      }}>
        {total === 0 ? (
          <span style={{ color: '#475569' }}>No edit events recorded.</span>
        ) : (
          visibleEvents.slice(-20).map((ev, i) => (
            <div key={ev.id ?? i} style={{ marginBottom: 2 }}>
              <span style={{ color: '#64748b' }}>{new Date(ev.occurred_at).toLocaleTimeString()} </span>
              <span style={{ color: ev.event_type === 'insert' ? '#4ade80' : '#f87171' }}>
                {ev.event_type === 'insert' ? '+' : '−'}
              </span>
              <span> {ev.char_count} chars @ pos {ev.position}</span>
            </div>
          ))
        )}
      </div>

      {/* Final text preview at end */}
      {step === total && total > 0 && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 4 }}>Final response text:</div>
          <div style={{
            background: 'var(--bg3)',
            border: '1px solid var(--border)',
            borderRadius: 6,
            padding: 12,
            whiteSpace: 'pre-wrap',
            fontSize: 13,
            color: 'var(--text)',
            maxHeight: 200,
            overflowY: 'auto',
          }}>
            {finalText || <span style={{ color: 'var(--text3)' }}>(empty)</span>}
          </div>
        </div>
      )}
    </div>
  );
}
