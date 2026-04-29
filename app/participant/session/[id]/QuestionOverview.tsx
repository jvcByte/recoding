'use client';

interface QuestionSummary {
  index: number;
  status: string;
  reachable: boolean;
  points?: number | null;
}

interface Props {
  questions: QuestionSummary[];
  currentIndex: number;
  onNavigate: (index: number) => void;
  onClose: () => void;
}

function statusColor(status: string): string {
  switch (status) {
    case 'final':       return 'var(--green)';
    case 'skipped':     return 'var(--orange)';
    case 'draft':       return '#f59e0b80';
    default:            return 'var(--bg5)';
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case 'final':       return 'Final';
    case 'skipped':     return 'Skipped';
    case 'draft':       return 'Draft';
    default:            return 'Not started';
  }
}

export default function QuestionOverview({ questions, currentIndex, onNavigate, onClose }: Props) {
  return (
    <div style={{
      background: 'var(--bg2)',
      border: '1px solid var(--border2)',
      borderRadius: 'var(--radius-lg)',
      padding: '1.25rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Question Overview
        </span>
        <button onClick={onClose} className="btn btn-ghost btn-sm">Close</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        {questions.map((q) => {
          const isCurrent = q.index === currentIndex;
          return (
            <button
              key={q.index}
              onClick={() => q.reachable && onNavigate(q.index)}
              disabled={!q.reachable}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.5rem 0.75rem',
                background: isCurrent ? 'var(--bg4)' : 'var(--bg3)',
                border: `1px solid ${isCurrent ? 'var(--border2)' : 'var(--border)'}`,
                borderRadius: 'var(--radius)',
                cursor: q.reachable ? 'pointer' : 'default',
                opacity: q.reachable ? 1 : 0.4,
                textAlign: 'left',
                width: '100%',
                transition: 'background 0.1s',
              }}
            >
              <span style={{
                width: 10, height: 10, borderRadius: '50%',
                background: isCurrent ? 'var(--accent)' : statusColor(q.status),
                flexShrink: 0,
              }} />
              <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: isCurrent ? 600 : 400 }}>
                Question {q.index + 1}
              </span>
              <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {isCurrent ? 'current' : statusLabel(q.status)}
              </span>
              {q.points != null && (
                <span style={{ fontSize: 10, color: 'var(--accent2)', fontWeight: 600 }}>
                  {q.points}pt{q.points !== 1 ? 's' : ''}
                </span>
              )}
              {!q.reachable && (
                <span style={{ fontSize: 10, color: 'var(--text4)' }}>🔒</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
