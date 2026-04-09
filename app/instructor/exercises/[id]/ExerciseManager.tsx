'use client';

import { useState } from 'react';
import Link from 'next/link';
import { UserCheck, UserX } from 'lucide-react';
import { toast } from 'sonner';

interface Exercise {
  id: string; slug: string; title: string; enabled: boolean;
  question_count: number; assigned_user_ids: string[];
  start_time: string | null; end_time: string | null; duration_limit: string | null;
}
interface Session {
  id: string; start_time: string | null; end_time: string | null;
  duration_limit: string | null; started_at: string | null;
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

  const unstartedSession = sessions.find((s) => !s.started_at);
  const [startTime, setStartTime] = useState(
    (initial.start_time ?? unstartedSession?.start_time)?.slice(0, 16) ?? ''
  );
  const [endTime, setEndTime] = useState(
    (initial.end_time ?? unstartedSession?.end_time)?.slice(0, 16) ?? ''
  );
  const [durationLimit, setDurationLimit] = useState(
    initial.duration_limit ?? unstartedSession?.duration_limit ?? ''
  );

  async function patch(body: Record<string, unknown>) {
    setSaving(true);
    try {
      const res = await fetch(`/api/instructor/exercises/${exercise.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await res.text());
      const updated = await res.json();
      setExercise(updated);
      toast.success('Saved');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.name : 'Unknown error');
    } finally {
      setSaving(false);
    }
  }

  async function toggleAssignment(userId: string, currentlyAssigned: boolean) {
    const newIds = currentlyAssigned
      ? assignedUsers.filter((u) => u.id !== userId).map((u) => u.id)
      : [...assignedUsers.map((u) => u.id), userId];
    setSaving(true);
    try {
      const res = await fetch(`/api/instructor/exercises/${exercise.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assign_user_ids: newIds }),
      });
      if (!res.ok) throw new Error(await res.text());
      const updated = await res.json();
      setExercise(updated);
      const updatedIds: string[] = updated.assigned_user_ids ?? [];
      setAssignedUsers(allParticipants.filter((p) => updatedIds.includes(p.id)));
      toast.success('Assignment updated');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* Status */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Status</span>
          <span className={`badge ${exercise.enabled ? 'badge-green' : 'badge-gray'}`}>
            {exercise.enabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: '1rem' }}>
          Participants can only access enabled exercises.
        </p>
        <button
          onClick={() => patch({ enabled: !exercise.enabled })}
          disabled={saving}
          className={`btn ${exercise.enabled ? 'btn-danger' : 'btn-success'}`}
        >
          {exercise.enabled ? 'Disable Exercise' : 'Enable Exercise'}
        </button>
      </div>

      {/* Timing */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Session Timing</span>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: '1rem' }}>
          Applies to all open (non-closed) sessions for this exercise.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Start Time</label>
            <input className="form-input" type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">End Time</label>
            <input className="form-input" type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Duration Limit</label>
            <input className="form-input" type="text" placeholder="e.g. 01:30:00" value={durationLimit} onChange={(e) => setDurationLimit(e.target.value)} />
          </div>
        </div>
        <button
          onClick={() => patch({ start_time: startTime || null, end_time: endTime || null, duration_limit: durationLimit || null })}
          disabled={saving}
          className="btn btn-primary"
        >
          Save Timing
        </button>
      </div>

      {/* Participants */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Participants</span>
          <span className="badge badge-purple">{assignedUsers.length} assigned</span>
        </div>
        {allParticipants.length === 0 ? (
          <p style={{ color: 'var(--text3)', fontSize: 13 }}>No participant accounts exist yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {allParticipants.map((p) => {
              const assigned = assignedUsers.some((u) => u.id === p.id);
              return (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.75rem', background: 'var(--bg3)', borderRadius: 'var(--radius-sm)', border: `1px solid ${assigned ? 'rgba(99,102,241,0.3)' : 'var(--border)'}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {assigned
                      ? <UserCheck size={15} style={{ color: 'var(--green)' }} />
                      : <UserX size={15} style={{ color: 'var(--text3)' }} />
                    }
                    <span style={{ fontWeight: assigned ? 600 : 400, color: assigned ? 'var(--text)' : 'var(--text3)', fontSize: 13 }}>{p.username}</span>
                  </div>
                  <button
                    onClick={() => toggleAssignment(p.id, assigned)}
                    disabled={saving}
                    className={`btn btn-sm ${assigned ? 'btn-danger' : 'btn-success'}`}
                  >
                    {assigned ? 'Remove' : 'Assign'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="card">
        <div className="card-header"><span className="card-title">Actions</span></div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link href={`/instructor/exercises/${exercise.id}/submissions`} className="btn btn-primary">
            View Submissions
          </Link>
          <a href={`/api/instructor/exercises/${exercise.id}/export?format=csv`} className="btn btn-success">
            Export CSV
          </a>
        </div>
      </div>
    </div>
  );
}
