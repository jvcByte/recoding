'use client';

import { useState } from 'react';
import { toast } from 'sonner';

interface Props {
  submissionId: string;
  initialNote: string | null;
}

export default function ReviewNote({ submissionId, initialNote }: Props) {
  const [note, setNote] = useState(initialNote ?? '');
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/instructor/submissions/${submissionId}/review`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ review_note: note }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success('Review note saved');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={4}
        placeholder="Add a review note…"
        className="form-textarea"
      />
      <div style={{ marginTop: 8 }}>
        <button onClick={save} disabled={saving} className="btn btn-primary btn-sm">
          {saving ? 'Saving…' : 'Save Note'}
        </button>
      </div>
    </div>
  );
}
