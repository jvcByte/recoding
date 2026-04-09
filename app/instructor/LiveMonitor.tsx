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

  return (
    <div style={{ fontFamily: 'monospace', fontSize: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <span style={{
          width: 7, height: 7, borderRadius: '50%',
          background: connected ? 'var(--green)' : 'var(--red)',
          display: 'inline-block',
          boxShadow: connected ? '0 0 6px var(--green)' : 'none',
        }} />
        <span style={{ fontSize: 11, color: connected ? 'var(--green)' : 'var(--text3)', fontWeight: 600 }}>
          {connected ? 'Connected' : 'Disconnected'}
        </span>
        {lastHeartbeat && (
          <span style={{ color: 'var(--text3)', fontSize: 10, marginLeft: 'auto' }}>
            heartbeat {lastHeartbeat}
          </span>
        )}
      </div>

      {events.length === 0 ? (
        <div style={{ color: 'var(--text3)', padding: '2rem 0', textAlign: 'center', fontSize: 12 }}>
          Waiting for events…
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Type</th>
                <th>Session</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {events.map((ev, i) => (
                <tr key={i}>
                  <td style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--text3)' }}>{occurredAt(ev)}</td>
                  <td>
                    <span className={`badge ${ev.type === 'paste' ? 'badge-red' : ev.type === 'focus' ? 'badge-orange' : ev.type === 'keystroke_batch' ? 'badge-purple' : 'badge-gray'}`}>
                      {ev.type}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text3)', fontFamily: 'monospace' }}>{sessionId(ev)}</td>
                  <td><EventDetail event={ev} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
