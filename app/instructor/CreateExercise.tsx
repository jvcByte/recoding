'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Plus, X } from 'lucide-react';

export default function CreateExercise() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [saving, setSaving] = useState(false);

  function autoSlug(t: string) {
    return t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  async function create() {
    if (!title.trim()) { toast.error('Title is required'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/instructor/exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), slug: slug.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to create');
      toast.success(`Exercise "${data.title}" created`);
      setOpen(false);
      setTitle('');
      setSlug('');
      router.push(`/instructor/exercises/${data.id}`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to create');
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button className="btn btn-primary" onClick={() => setOpen(true)}>
        <Plus size={13} /> New Exercise
      </button>
    );
  }

  return (
    <div className="card card-glow" style={{ marginBottom: '1.5rem' }}>
      <div className="card-header">
        <span className="card-title">New Exercise</span>
        <button className="btn btn-ghost btn-sm" onClick={() => setOpen(false)}>
          <X size={13} />
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        <div className="form-group">
          <label className="form-label">Title</label>
          <input
            className="form-input"
            type="text"
            placeholder="e.g. ASCII Art"
            value={title}
            autoFocus
            onChange={(e) => {
              setTitle(e.target.value);
              if (!slug) setSlug(autoSlug(e.target.value));
            }}
            onKeyDown={(e) => e.key === 'Enter' && create()}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Slug <span style={{ color: 'var(--text3)', fontWeight: 400, textTransform: 'none' }}>(auto-generated, must be unique)</span></label>
          <input
            className="form-input"
            type="text"
            placeholder="ascii-art"
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-primary" disabled={saving} onClick={create}>
            <Plus size={13} /> {saving ? 'Creating…' : 'Create Exercise'}
          </button>
          <button className="btn btn-ghost" onClick={() => setOpen(false)}>
            <X size={12} /> Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
