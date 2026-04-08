'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Exercise {
  id: string;
  slug: string;
  title: string;
  enabled: boolean;
  question_count: number;
  assigned_user_ids: string[];
}

interface Session {
  id: string;
  start_time: string | null;
  end_time: string | null;
  duration_limit: string | null;
  started_at: string | null;
}

interface Props {
  exercise: Exercise;
  sessions: Session[];
  assignedUsers: { id: string; username: string }[];
  allParticipants: { id: string; username: string }[];
}

export default function ExerciseManager({ exercise: initial, sessions, assignedUsers: initialAssigned, allParticipants }: Props) {
  const [exercise, setExercise] = useState(initial);
  const [assignedUsers, setAssignedUsers] = useState(initialAssigned);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Timing state (use first unstarted session if available)
  const unstartedSession = sessions.find((s) => !s.started_at);
  const [startTime, setStartTime] = useState(unstartedSession?.start_time?.slice(0, 16) ?? '');
  const [endTime, setEndTime] = useState(unstartedSession?.end_time?.slice(0, 16) ?? '');
  const [durationLimit, setDurationLimit] = useState(unstartedSession?.duration_limit ?? '');

  async function patch(body: Record<string, unknown>) {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/instructor/exercises/${exercise.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await res.text());
      const updated = await res.json();
      setExercise(updated);
      setSuccess('Saved.');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setSaving(false);
    }
  }

  function toggleEnabled() {
    patch({ enabled: !exercise.enabled });
  }

  function saveTiming() {
    patch({
      start_time: startTime || null,
      end_time: endTime || null,
      duration_limit: durationLimit || null,
    });
  }

  async function toggleAssignment(userId: string, currentlyAssigned: boolean) {
    const newIds = currentlyAssigned
      ? assignedUsers.filter((u) => u.id !== userId).map((u) => u.id)
      : [...assignedUsers.map((u) => u.id), userId];

    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/instructor/exercises/${exercise.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assign_user_ids: newIds }),
      });
      if (!res.ok) throw new Error(await res.text());
      const updated = await res.json();
      setExercise(updated);
      const updatedIds: string[] = updated.assigned_user_ids ?? [];
      setAssignedUsers(allParticipants.filter((p) => updatedIds.includes(p.id)));
      setSuccess('Saved.');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: 800, margin: '0 auto', padding: 24 }}>
      {/* Header */}
      <div style={{ marginBottom: 8 }}>
        <Link href="/instructor" style={{ color: '#64748b', fontSize: 13, textDecoration: 'none' }}>
          ← Dashboard
        </Link>
      </div>
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>{exercise.title}</h1>
      <p style={{ color: '#64748b', fontSize: 13, marginBottom: 24 }}>
        Slug: <code>{exercise.slug}</code> · {exercise.question_count} question(s)
      </p>

      {error && (
        <div style={{ background: '#fee2e2', color: '#991b1b', padding: '8px 12px', borderRadius: 6, marginBottom: 16 }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ background: '#dcfce7', color: '#166534', padding: '8px 12px', borderRadius: 6, marginBottom: 16 }}>
          {success}
        </div>
      )}

      {/* Enable / Disable */}
      <section style={sectionStyle}>
        <h2 style={sectionTitle}>Status</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{
            padding: '4px 12px',
            borderRadius: 4,
            fontWeight: 600,
            fontSize: 13,
            background: exercise.enabled ? '#dcfce7' : '#fee2e2',
            color: exercise.enabled ? '#166534' : '#991b1b',
          }}>
            {exercise.enabled ? 'Enabled' : 'Disabled'}
          </span>
          <button
            onClick={toggleEnabled}
            disabled={saving}
            style={btnStyle}
          >
            {exercise.enabled ? 'Disable' : 'Enable'}
          </button>
        </div>
      </section>

      {/* Session Timing */}
      <section style={sectionStyle}>
        <h2 style={sectionTitle}>Session Timing</h2>
        <p style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>
          Updates apply to participants who have not yet started their session.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
          <label style={labelStyle}>
            Start Time
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              style={inputStyle}
            />
          </label>
          <label style={labelStyle}>
            End Time
            <input
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              style={inputStyle}
            />
          </label>
          <label style={labelStyle}>
            Duration Limit (e.g. 1 hour)
            <input
              type="text"
              placeholder="e.g. 01:30:00"
              value={durationLimit}
              onChange={(e) => setDurationLimit(e.target.value)}
              style={inputStyle}
            />
          </label>
        </div>
        <button onClick={saveTiming} disabled={saving} style={btnStyle}>
          Save Timing
        </button>
      </section>

      {/* Assigned Participants */}
      <section style={sectionStyle}>
        <h2 style={sectionTitle}>Assigned Participants ({assignedUsers.length})</h2>
        {allParticipants.length === 0 ? (
          <p style={{ color: '#94a3b8', fontSize: 13 }}>No participant accounts exist yet.</p>
        ) : (
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {allParticipants.map((p) => {
              const assigned = assignedUsers.some((u) => u.id === p.id);
              return (
                <li key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9', fontSize: 14 }}>
                  <span style={{ color: assigned ? '#0f172a' : '#94a3b8' }}>{p.username}</span>
                  <button
                    onClick={() => toggleAssignment(p.id, assigned)}
                    disabled={saving}
                    style={{
                      padding: '3px 10px',
                      fontSize: 12,
                      fontWeight: 600,
                      border: 'none',
                      borderRadius: 4,
                      cursor: 'pointer',
                      background: assigned ? '#fee2e2' : '#dcfce7',
                      color: assigned ? '#991b1b' : '#166534',
                    }}
                  >
                    {assigned ? 'Remove' : 'Assign'}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Links */}
      <section style={sectionStyle}>
        <h2 style={sectionTitle}>Actions</h2>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link
            href={`/instructor/exercises/${exercise.id}/submissions`}
            style={{ ...btnStyle, textDecoration: 'none', display: 'inline-block' }}
          >
            View Submissions
          </Link>
          <a
            href={`/api/instructor/exercises/${exercise.id}/export?format=csv`}
            style={{ ...btnStyle, textDecoration: 'none', display: 'inline-block', background: '#059669' }}
          >
            Export CSV
          </a>
        </div>
      </section>
    </div>
  );
}

const sectionStyle: React.CSSProperties = {
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 8,
  padding: 20,
  marginBottom: 20,
};

const sectionTitle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 600,
  marginBottom: 12,
  marginTop: 0,
};

const btnStyle: React.CSSProperties = {
  padding: '8px 16px',
  background: '#2563eb',
  color: '#fff',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 600,
};

const labelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  fontSize: 13,
  color: '#475569',
};

const inputStyle: React.CSSProperties = {
  padding: '6px 10px',
  border: '1px solid #cbd5e1',
  borderRadius: 6,
  fontSize: 13,
};
