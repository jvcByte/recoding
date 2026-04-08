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
        style={{
          width: '100%',
          padding: '8px 10px',
          border: '1px solid #cbd5e1',
          borderRadius: 6,
          fontSize: 13,
          fontFamily: 'sans-serif',
          resize: 'vertical',
          boxSizing: 'border-box',
        }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
        <button
          onClick={save}
          disabled={saving}
          style={{
            padding: '7px 16px',
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            cursor: saving ? 'not-allowed' : 'pointer',
            fontWeight: 600,
            fontSize: 13,
          }}
        >
          {saving ? 'Saving…' : 'Save Note'}
        </button>
        {saved && <span style={{ color: '#16a34a', fontSize: 13 }}>Saved ✓</span>}
        {error && <span style={{ color: '#dc2626', fontSize: 13 }}>{error}</span>}
      </div>
    </div>
  );
}
