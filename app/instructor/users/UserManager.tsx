'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Plus, X, KeyRound, Trash2, AlertTriangle } from 'lucide-react';

interface User { id: string; username: string; role: string; created_at: string; }
interface Props { initialUsers: User[]; currentUserId: string; }

export default function UserManager({ initialUsers, currentUserId }: Props) {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [showCreate, setShowCreate] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'participant' | 'instructor'>('participant');
  const [creating, setCreating] = useState(false);
  const [resetUserId, setResetUserId] = useState<string | null>(null);
  const [resetPassword, setResetPassword] = useState('');
  const [resetting, setResetting] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleCreate() {
    if (!newUsername.trim()) { toast.error('Username is required'); return; }
    if (newPassword.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setCreating(true);
    try {
      const res = await fetch('/api/instructor/users', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newUsername.trim(), password: newPassword, role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed');
      toast.success(`User "${data.username}" created`);
      setUsers((prev) => [data, ...prev]);
      setShowCreate(false); setNewUsername(''); setNewPassword(''); setNewRole('participant');
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Failed'); }
    finally { setCreating(false); }
  }

  async function handleResetPassword(userId: string) {
    if (resetPassword.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setResetting(true);
    try {
      const res = await fetch(`/api/instructor/users/${userId}/reset-password`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_password: resetPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed');
      toast.success('Password reset');
      setResetUserId(null); setResetPassword('');
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Failed'); }
    finally { setResetting(false); }
  }

  async function handleDelete(userId: string, username: string) {
    setDeletingId(userId);
    try {
      const res = await fetch(`/api/instructor/users/${userId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed');
      toast.success(`"${username}" deleted`);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setConfirmDeleteId(null);
      router.refresh();
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Failed'); }
    finally { setDeletingId(null); }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Create */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Create User</span>
          {!showCreate && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>
              <Plus size={12} /> New User
            </button>
          )}
        </div>
        {showCreate ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">Username</label>
                <input className="form-input" type="text" placeholder="username" value={newUsername} autoFocus onChange={(e) => setNewUsername(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCreate()} />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input className="form-input" type="password" placeholder="min 8 characters" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCreate()} />
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select className="form-select" value={newRole} onChange={(e) => setNewRole(e.target.value as 'participant' | 'instructor')}>
                  <option value="participant">Participant</option>
                  <option value="instructor">Instructor</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-primary btn-sm" disabled={creating} onClick={handleCreate}><Plus size={12} /> {creating ? 'Creating…' : 'Create'}</button>
              <button className="btn btn-ghost btn-sm" onClick={() => { setShowCreate(false); setNewUsername(''); setNewPassword(''); }}><X size={12} /> Cancel</button>
            </div>
          </div>
        ) : (
          <p style={{ color: 'var(--text3)', fontSize: 12 }}>Create participant or instructor accounts.</p>
        )}
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="card-header" style={{ padding: '0.85rem 1rem', marginBottom: 0 }}>
          <span className="card-title">All Users</span>
          <span className="badge badge-gray">{users.length}</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Username</th><th>Role</th><th>Created</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <>
                  <tr key={user.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text)' }}>{user.username}</td>
                    <td><span className={`badge ${user.role === 'instructor' ? 'badge-purple' : 'badge-gray'}`}>{user.role}</span></td>
                    <td style={{ color: 'var(--text3)' }}>{new Date(user.created_at).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => { setResetUserId(resetUserId === user.id ? null : user.id); setResetPassword(''); }}>
                          <KeyRound size={11} /> Reset Password
                        </button>
                        {user.role === 'participant' && user.id !== currentUserId && (
                          <button className="btn btn-danger btn-sm" onClick={() => setConfirmDeleteId(confirmDeleteId === user.id ? null : user.id)}>
                            <Trash2 size={11} /> Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {resetUserId === user.id && (
                    <tr key={`${user.id}-reset`}>
                      <td colSpan={4} style={{ background: 'var(--bg3)', padding: '0.75rem 1rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 12, color: 'var(--text3)', marginRight: 4 }}>New password for <strong style={{ color: 'var(--text2)' }}>{user.username}</strong>:</span>
                          <input className="form-input" type="password" placeholder="New password (min 8 chars)" value={resetPassword} autoFocus style={{ maxWidth: 280 }} onChange={(e) => setResetPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleResetPassword(user.id)} />
                          <button className="btn btn-primary btn-sm" disabled={resetting} onClick={() => handleResetPassword(user.id)}>{resetting ? 'Saving…' : 'Save'}</button>
                          <button className="btn btn-ghost btn-sm" onClick={() => { setResetUserId(null); setResetPassword(''); }}><X size={12} /></button>
                        </div>
                      </td>
                    </tr>
                  )}
                  {confirmDeleteId === user.id && (
                    <tr key={`${user.id}-delete`}>
                      <td colSpan={4} style={{ background: 'rgba(239,68,68,0.06)', borderLeft: '3px solid var(--red)', padding: '0.75rem 1rem' }}>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                          <AlertTriangle size={14} style={{ color: 'var(--red)', flexShrink: 0 }} />
                          <span style={{ fontSize: 13, color: 'var(--text2)' }}>
                            Delete <strong style={{ color: 'var(--text)' }}>{user.username}</strong>? This cannot be undone.
                          </span>
                          <button
                            className="btn btn-danger btn-sm"
                            disabled={deletingId === user.id}
                            onClick={() => handleDelete(user.id, user.username)}
                          >
                            {deletingId === user.id ? 'Deleting…' : 'Yes, delete'}
                          </button>
                          <button className="btn btn-ghost btn-sm" onClick={() => setConfirmDeleteId(null)}>
                            <X size={12} /> Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
