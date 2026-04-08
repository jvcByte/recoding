'use client';

import { useState } from 'react';

interface Props {
  submissionId: string;
  initialNote: string | null;
}

export default function ReviewNote({ submissionId, initialNote }: Props) {
  const [note, setNote] = useState(initialNote ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch(`/api/instructor/submissions/${submissionId}/review`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ review_note: note }),
      });
      if (!res.ok) throw new Error(await res.text());
      setSaved(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <textarea
        value={note}
        onChange={(e) => { setNote(e.target.value); setSaved(false); }}
        rows={4}
        placeholder="Add a review note…"
        className="form-textarea"
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
        <button onClick={save} disabled={saving} className="btn btn-primary btn-sm">
          {saving ? 'Saving…' : 'Save Note'}
        </button>
        {saved && <span style={{ color: 'var(--green)', fontSize: 13 }}>✓ Saved</span>}
        {error && <span style={{ color: 'var(--red)', fontSize: 13 }}>{error}</span>}
      </div>
    </div>
  );
}
