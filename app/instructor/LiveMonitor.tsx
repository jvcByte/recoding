'use client';

import { useEffect, useRef, useState } from 'react';

type PasteEvent = {
  type: 'paste';
  submission_id: string;
  session_id: string;
  username: string;
  exercise_title: string;
  char_count: number;
  occurred_at: string;
};

type FocusEvent = {
  type: 'focus';
  session_id: string;
  username: string;
  exercise_title: string;
  lost_at: string;
  regained_at: string | null;
  duration_ms: number | null;
  occurred_at: string;
};

type KeystrokeBatchEvent = {
  type: 'keystroke_batch';
  submission_id: string;
  session_id: string;
  username: string;
  exercise_title: string;
  char_count: number;
  event_count: number;
  occurred_at: string;
};

type ErrorEvent = {
  type: 'error';
  message: string;
  occurred_at?: string;
};

type HeartbeatEvent = { type: 'heartbeat' };
type LiveEvent = PasteEvent | FocusEvent | KeystrokeBatchEvent | ErrorEvent;

const MAX_EVENTS = 100;

function formatTime(iso: string): string {
  try { return new Date(iso).toLocaleTimeString(); } catch { return iso; }
}

function getUsername(event: LiveEvent): string {
  if (event.type === 'error') return '—';
  return (event as PasteEvent).username ?? '—';
}

function getExercise(event: LiveEvent): string {
  if (event.type === 'error') return '—';
  return (event as PasteEvent).exercise_title ?? '—';
}

function getTime(event: LiveEvent): string {
  if (event.type === 'error') return event.occurred_at ? formatTime(event.occurred_at) : '—';
  return formatTime(event.occurred_at);
}

function EventDetail({ event }: { event: LiveEvent }): React.ReactElement {
  switch (event.type) {
    case 'paste':
      return <span style={{ color: 'var(--red)' }}>{event.char_count} chars pasted</span>;
    case 'focus':
      return <span>{event.duration_ms != null ? `away ${(event.duration_ms / 1000).toFixed(1)}s` : 'focus lost'}</span>;
    case 'keystroke_batch':
      return <span style={{ color: 'var(--text3)' }}>{event.event_count} keystrokes · {event.char_count} chars</span>;
    case 'error':
      return <span style={{ color: 'var(--red)' }}>{event.message}</span>;
  }
}

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
      try { parsed = JSON.parse(e.data); } catch { return; }
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
    return () => { es.close(); esRef.current = null; };
  }, []);

  return (
    <div style={{ fontSize: 12 }}>
      {/* Status bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: connected ? 'var(--green)' : 'var(--red)', display: 'inline-block', boxShadow: connected ? '0 0 6px var(--green)' : 'none' }} />
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
        <div style={{ color: 'var(--text3)', padding: '2rem 0', textAlign: 'center' }}>
          Waiting for events…
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Type</th>
                <th>Username</th>
                <th>Exercise</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {events.map((ev, i) => (
                <tr key={i}>
                  <td style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--text3)', whiteSpace: 'nowrap' }}>
                    {getTime(ev)}
                  </td>
                  <td>
                    <span className={`badge ${
                      ev.type === 'paste' ? 'badge-red' :
                      ev.type === 'focus' ? 'badge-orange' :
                      ev.type === 'keystroke_batch' ? 'badge-purple' :
                      'badge-gray'
                    }`}>
                      {ev.type === 'keystroke_batch' ? 'keys' : ev.type}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--text)' }}>{getUsername(ev)}</td>
                  <td style={{ color: 'var(--text2)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {getExercise(ev)}
                  </td>
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
