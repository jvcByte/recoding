'use client';

import { useState } from 'react';
import Link from 'next/link';
import { UserCheck, UserX } from 'lucide-react';
import { toast } from 'sonner';

interface Exercise {
  id: string; slug: string; title: string; enabled: boolean;
  question_count: number; assigned_user_ids: string[];
  start_time: string | null; end_time: string | null; duration_limit: string | null;
  pass_mark: number | null;
  min_questions_required: number | null;
  flag_fails: boolean;
  max_paste_chars: number | null;
  max_focus_loss: number | null;
  min_edit_events: number | null;
  min_response_length: number | null;
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
  const [recalculating, setRecalculating] = useState(false);

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
  const [passMark, setPassMark] = useState<string>(
    initial.pass_mark != null ? String(initial.pass_mark) : ''
  );
  const [minQuestions, setMinQuestions] = useState<string>(
    initial.min_questions_required != null ? String(initial.min_questions_required) : ''
  );
  const [flagFails, setFlagFails] = useState<boolean>(initial.flag_fails ?? false);
  const [maxPasteChars, setMaxPasteChars] = useState<string>(
    initial.max_paste_chars != null ? String(initial.max_paste_chars) : ''
  );
  const [maxFocusLoss, setMaxFocusLoss] = useState<string>(
    initial.max_focus_loss != null ? String(initial.max_focus_loss) : ''
  );
  const [minEditEvents, setMinEditEvents] = useState<string>(
    initial.min_edit_events != null ? String(initial.min_edit_events) : ''
  );
  const [minResponseLength, setMinResponseLength] = useState<string>(
    initial.min_response_length != null ? String(initial.min_response_length) : ''
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
      toast.error(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setSaving(false);
    }
  }

  async function toggleAssignment(userId: string, currentlyAssigned: boolean) {
    const newIds = userId === '__all__'
      ? allParticipants.map((u) => u.id)
      : currentlyAssigned
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
          onClick={() => {
            const toUTC = (local: string) => local ? new Date(local).toISOString() : null;
            patch({ start_time: toUTC(startTime), end_time: toUTC(endTime), duration_limit: durationLimit || null });
          }}
          disabled={saving}
          className="btn btn-primary"
        >
          Save Timing
        </button>
      </div>

      

      {/* Scoring */}
      <div className="card">
        <div className="card-header"><span className="card-title">Scoring &amp; Pass Constraints</span></div>
        <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: '1rem' }}>
          A participant passes only if all configured constraints are met. Leave a field blank to disable that constraint.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Pass Mark (%)</label>
            <input
              className="form-input"
              type="number" min={0} max={100} step={1}
              placeholder="e.g. 50"
              value={passMark}
              onChange={(e) => setPassMark(e.target.value)}
            />
            <span style={{ fontSize: 11, color: 'var(--text3)' }}>Score must be ≥ this value</span>
          </div>
          <div className="form-group">
            <label className="form-label">Min Questions Required</label>
            <input
              className="form-input"
              type="number" min={1} max={exercise.question_count} step={1}
              placeholder={`e.g. ${exercise.question_count}`}
              value={minQuestions}
              onChange={(e) => setMinQuestions(e.target.value)}
            />
            <span style={{ fontSize: 11, color: 'var(--text3)' }}>Must answer at least this many</span>
          </div>
          <div className="form-group">
            <label className="form-label">Max Paste Characters</label>
            <input
              className="form-input"
              type="number" min={0} step={1}
              placeholder="e.g. 200"
              value={maxPasteChars}
              onChange={(e) => setMaxPasteChars(e.target.value)}
            />
            <span style={{ fontSize: 11, color: 'var(--text3)' }}>Total pasted chars must be ≤ this</span>
          </div>
          <div className="form-group">
            <label className="form-label">Max Focus Loss Events</label>
            <input
              className="form-input"
              type="number" min={0} step={1}
              placeholder={`default: ${process.env.FLAG_FOCUS_LOSS_THRESHOLD ?? 3}`}
              value={maxFocusLoss}
              onChange={(e) => setMaxFocusLoss(e.target.value)}
            />
            <span style={{ fontSize: 11, color: 'var(--text3)' }}>Overrides env default ({process.env.FLAG_FOCUS_LOSS_THRESHOLD ?? 3})</span>
          </div>
          <div className="form-group">
            <label className="form-label">Min Edit Events (low-edit flag)</label>
            <input
              className="form-input"
              type="number" min={0} step={1}
              placeholder={`default: ${process.env.FLAG_MIN_EDIT_EVENTS ?? 10}`}
              value={minEditEvents}
              onChange={(e) => setMinEditEvents(e.target.value)}
            />
            <span style={{ fontSize: 11, color: 'var(--text3)' }}>Flag if edits below this (default {process.env.FLAG_MIN_EDIT_EVENTS ?? 10})</span>
          </div>
          <div className="form-group">
            <label className="form-label">Min Response Length (low-edit flag)</label>
            <input
              className="form-input"
              type="number" min={0} step={1}
              placeholder={`default: ${process.env.FLAG_MIN_RESPONSE_LENGTH ?? 200}`}
              value={minResponseLength}
              onChange={(e) => setMinResponseLength(e.target.value)}
            />
            <span style={{ fontSize: 11, color: 'var(--text3)' }}>Only check edit count if response ≥ this length</span>
          </div>
        </div>
        <div className="form-group" style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: 13 }}>
            <input
              type="checkbox"
              checked={flagFails}
              onChange={(e) => setFlagFails(e.target.checked)}
              style={{ width: 15, height: 15 }}
            />
            Any active flag = automatic fail
          </label>
        </div>
        <button
          onClick={() => patch({
            pass_mark: passMark === '' ? null : Number(passMark),
            min_questions_required: minQuestions === '' ? null : Number(minQuestions),
            flag_fails: flagFails,
            max_paste_chars: maxPasteChars === '' ? null : Number(maxPasteChars),
            max_focus_loss: maxFocusLoss === '' ? null : Number(maxFocusLoss),
            min_edit_events: minEditEvents === '' ? null : Number(minEditEvents),
            min_response_length: minResponseLength === '' ? null : Number(minResponseLength),
          })}
          disabled={saving}
          className="btn btn-primary"
        >
          {saving ? 'Saving…' : 'Save Constraints'}
        </button>
        <button
          onClick={async () => {
            setRecalculating(true);
            try {
              const res = await fetch(`/api/instructor/exercises/${exercise.id}/recalculate-scores`, { method: 'POST' });
              if (!res.ok) throw new Error(await res.text());
              const data = await res.json();
              toast.success(`Scores recalculated for ${data.recalculated} session(s)`);
            } catch (e: unknown) {
              toast.error(e instanceof Error ? e.message : 'Failed');
            } finally {
              setRecalculating(false);
            }
          }}
          disabled={recalculating || saving}
          className="btn btn-secondary"
        >
          {recalculating ? 'Recalculating…' : 'Recalculate Scores'}
        </button>
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

      {/* Participants */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Participants</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="badge badge-purple">{assignedUsers.length} assigned</span>
            {assignedUsers.length < allParticipants.length && (
              <button
                onClick={() => toggleAssignment('__all__', false)}
                disabled={saving}
                className="btn btn-sm btn-primary"
              >
                Assign All
              </button>
            )}
          </div>
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
    </div>
  );
}
