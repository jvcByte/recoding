'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { KeyRound } from 'lucide-react';

export default function ChangePasswordForm() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (next.length < 8) { toast.error('New password must be at least 8 characters'); return; }
    if (next === current) { toast.error('New password must differ from current password'); return; }
    if (next !== confirm) { toast.error('Passwords do not match'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/user/change-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_password: current, new_password: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed');
      toast.success('Password changed successfully');
      setCurrent(''); setNext(''); setConfirm('');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to change password');
    } finally { setSaving(false); }
  }

  return (
    <div className="card" style={{ maxWidth: 420 }}>
      <div className="card-header">
        <span className="card-title">Change Password</span>
        <KeyRound size={14} style={{ color: 'var(--text3)' }} />
      </div>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        <div className="form-group">
          <label className="form-label">Current Password</label>
          <input className="form-input" type="password" placeholder="Enter current password" value={current} required onChange={(e) => setCurrent(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">New Password</label>
          <input className="form-input" type="password" placeholder="Min 8 characters" value={next} required onChange={(e) => setNext(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Confirm New Password</label>
          <input className="form-input" type="password" placeholder="Repeat new password" value={confirm} required onChange={(e) => setConfirm(e.target.value)} />
        </div>
        <button className="btn btn-primary" type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Update Password'}
        </button>
      </form>
    </div>
  );
}
