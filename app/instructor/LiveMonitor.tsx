'use client';

import { useEffect, useRef, useState } from 'react';

// ── Types ────────────────────────────────────────────────────────────────────

type PasteEvent = {
  type: 'paste';
  submission_id: string;
  session_id: string;
  char_count: number;
  occurred_at: string;
};

type FocusEvent = {
  type: 'focus';
  session_id: string;
  lost_at: string;
  regained_at: string | null;
  duration_ms: number | null;
  occurred_at: string;
};

type KeystrokeBatchEvent = {
  type: 'keystroke_batch';
  submission_id: string;
  session_id: string;
  char_count: number;
  event_count: number;
  occurred_at: string;
};

type ErrorEvent = {
  type: 'error';
  message: string;
  occurred_at?: string;
};

type HeartbeatEvent = {
  type: 'heartbeat';
};

type LiveEvent = PasteEvent | FocusEvent | KeystrokeBatchEvent | ErrorEvent;

const MAX_EVENTS = 50;

// ── Helpers ──────────────────────────────────────────────────────────────────

function truncate(id: string, len = 8): string {
  return id.length > len ? id.slice(0, len) + '…' : id;
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString();
  } catch {
    return iso;
  }
}

// ── Badge styles ─────────────────────────────────────────────────────────────

const badgeBase: React.CSSProperties = {
  display: 'inline-block',
  padding: '2px 8px',
  borderRadius: 4,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: 0.5,
  textTransform: 'uppercase',
  color: '#fff',
  minWidth: 80,
  textAlign: 'center',
};

const badges: Record<string, React.CSSProperties> = {
  paste:           { ...badgeBase, background: '#dc2626' },
  focus:           { ...badgeBase, background: '#ea580c' },
  keystroke_batch: { ...badgeBase, background: '#2563eb' },
  error:           { ...badgeBase, background: '#7f1d1d' },
};

// ── Detail renderer ───────────────────────────────────────────────────────────

function EventDetail({ event }: { event: LiveEvent }): React.ReactElement {
  switch (event.type) {
    case 'paste':
      return <span>{event.char_count} chars pasted</span>;
    case 'focus':
      return (
        <span>
          focus lost
          {event.duration_ms != null ? ` · ${event.duration_ms} ms` : ''}
        </span>
      );
    case 'keystroke_batch':
      return <span>{event.event_count} keystrokes</span>;
    case 'error':
      return <span style={{ color: '#fca5a5' }}>{event.message}</span>;
  }
}

function sessionId(event: LiveEvent): string {
  if (event.type === 'paste' || event.type === 'keystroke_batch' || event.type === 'focus') {
    return truncate(event.session_id);
  }
  return '—';
}

function occurredAt(event: LiveEvent): string {
  if (event.type === 'error') return event.occurred_at ? formatTime(event.occurred_at) : '—';
  return formatTime(event.occurred_at);
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function LiveMonitor() {
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const [lastHeartbeat, setLastHeartbeat] = useState<string | null>(null);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const es = new EventSource('/api/events/stream');
    esRef.current = es;

    es.onopen = () => setConnected(true);

    es.onmessage = (e: MessageEvent) => {
      let parsed: LiveEvent | HeartbeatEvent;
      try {
        parsed = JSON.parse(e.data);
      } catch {
        return;
      }

      if (parsed.type === 'heartbeat') {
        setLastHeartbeat(new Date().toLocaleTimeString());
        return;
      }

      setEvents((prev) => {
        const next = [parsed as LiveEvent, ...prev];
        return next.length > MAX_EVENTS ? next.slice(0, MAX_EVENTS) : next;
      });
    };

    es.onerror = () => setConnected(false);

    return () => {
      es.close();
      esRef.current = null;
    };
  }, []);

  // ── Render ──────────────────────────────────────────────────────────────────

  const containerStyle: React.CSSProperties = {
    fontFamily: 'monospace',
    fontSize: 13,
    background: '#0f172a',
    color: '#e2e8f0',
    borderRadius: 8,
    padding: 16,
    minHeight: 200,
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  };

  const dotStyle: React.CSSProperties = {
    width: 10,
    height: 10,
    borderRadius: '50%',
    background: connected ? '#22c55e' : '#ef4444',
    display: 'inline-block',
  };

  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
  };

  const thStyle: React.CSSProperties = {
    textAlign: 'left',
    padding: '4px 8px',
    color: '#94a3b8',
    fontWeight: 600,
    borderBottom: '1px solid #1e293b',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  };

  const tdStyle: React.CSSProperties = {
    padding: '5px 8px',
    borderBottom: '1px solid #1e293b',
    verticalAlign: 'middle',
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <span style={dotStyle} />
        <span style={{ fontWeight: 700, fontSize: 14 }}>
          {connected ? 'Connected' : 'Disconnected'}
        </span>
        {lastHeartbeat && (
          <span style={{ color: '#64748b', fontSize: 11 }}>
            last heartbeat {lastHeartbeat}
          </span>
        )}
      </div>

      {events.length === 0 ? (
        <div style={{ color: '#475569', padding: '24px 0', textAlign: 'center' }}>
          Waiting for events…
        </div>
      ) : (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Time</th>
              <th style={thStyle}>Type</th>
              <th style={thStyle}>Session</th>
              <th style={thStyle}>Details</th>
            </tr>
          </thead>
          <tbody>
            {events.map((ev, i) => (
              <tr key={i}>
                <td style={tdStyle}>{occurredAt(ev)}</td>
                <td style={tdStyle}>
                  <span style={badges[ev.type] ?? badgeBase}>{ev.type}</span>
                </td>
                <td style={{ ...tdStyle, color: '#94a3b8' }}>{sessionId(ev)}</td>
                <td style={tdStyle}>
                  <EventDetail event={ev} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
