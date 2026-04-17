'use client';

import { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import { Plus, Trash2, Edit3, ChevronDown, ChevronUp, Save, X, Upload, FileText, RefreshCw } from 'lucide-react';

interface Question {
  id: string;
  question_index: number;
  text: string;
  type: 'written' | 'code';
  language: string;
  starter: string;
}

const CODE_EXERCISE_SLUGS = new Set(['ascii-art', 'ascii-art-web', 'go-reloaded']);

function defaultsForSlug(slug: string): { type: string; language: string } {
  if (CODE_EXERCISE_SLUGS.has(slug)) return { type: 'code', language: 'go' };
  return { type: 'written', language: 'text' };
}

interface Props {
  exerciseId: string;
  exerciseSlug: string;
  initialQuestions: Question[];
}

export default function QuestionManager({ exerciseId, exerciseSlug, initialQuestions }: Props) {
  const defaults = defaultsForSlug(exerciseSlug);
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<Question>>({});
  const [adding, setAdding] = useState(false);
  const [newQ, setNewQ] = useState({ text: '', type: defaults.type, language: defaults.language, starter: '' });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [uploadType, setUploadType] = useState(defaults.type);
  const [uploadLang, setUploadLang] = useState(defaults.language);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.md')) { toast.error('Only .md files are supported'); return; }
    await uploadFile(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function uploadFile(file: File) {
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('type', uploadType);
      form.append('language', uploadLang);
      const res = await fetch(`/api/instructor/exercises/${exerciseId}/questions/upload`, { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Upload failed');
      toast.success(`Imported ${data.imported} questions`);
      window.location.reload();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function syncFromFiles() {
    if (!confirm('Sync questions from docs files? This will replace all current questions.')) return;
    setSyncing(true);
    try {
      const res = await fetch(`/api/instructor/exercises/${exerciseId}/questions/sync`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Sync failed');
      toast.success(`Synced ${data.synced} questions from files`);
      window.location.reload();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Sync failed');
    } finally {
      setSyncing(false);
    }
  }

  function handleDrop(e: React.DragEvent) {    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.md')) { toast.error('Only .md files are supported'); return; }
    uploadFile(file);
  }

  async function saveEdit(id: string) {
    setSaving(true);
    try {
      const res = await fetch(`/api/instructor/exercises/${exerciseId}/questions/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editDraft),
      });
      if (!res.ok) throw new Error(await res.text());
      const updated = await res.json();
      setQuestions((qs) => qs.map((q) => q.id === id ? { ...q, ...updated } : q));
      setEditing(null);
      toast.success('Question updated');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to save');
    } finally { setSaving(false); }
  }

  async function deleteQuestion(id: string, index: number) {
    if (!confirm(`Delete question ${index + 1}? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/instructor/exercises/${exerciseId}/questions/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await res.text());
      setQuestions((qs) => qs.filter((q) => q.id !== id).map((q, i) => ({ ...q, question_index: i })));
      toast.success('Question deleted');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete');
    }
  }

  async function addQuestion() {
    if (!newQ.text.trim()) { toast.error('Question text is required'); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/instructor/exercises/${exerciseId}/questions`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newQ),
      });
      if (!res.ok) throw new Error(await res.text());
      const created = await res.json();
      setQuestions((qs) => [...qs, created]);
      setNewQ({ text: '', type: 'written', language: 'text', starter: '' });
      setAdding(false);
      toast.success('Question added');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to add');
    } finally { setSaving(false); }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* ── Question list ── */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="card-header" style={{ padding: '0.85rem 1rem', marginBottom: 0 }}>
          <span className="card-title">Questions</span>
          <span className="badge badge-gray">{questions.length}</span>
        </div>

        {questions.length === 0 ? (
          <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>
            No questions yet — add one below or upload a .md file.
          </div>
        ) : (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '40px 90px 1fr auto', gap: '0.75rem', padding: '0.5rem 1rem', background: 'var(--bg3)', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
              {['#', 'Type', 'Preview', 'Actions'].map((h) => (
                <span key={h} style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</span>
              ))}
            </div>

            {questions.map((q, idx) => (
              <div key={q.id} style={{ borderBottom: idx < questions.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div
                  style={{ display: 'grid', gridTemplateColumns: '40px 90px 1fr auto', gap: '0.75rem', padding: '0.75rem 1rem', alignItems: 'center', cursor: 'pointer', background: expanded === q.id ? 'var(--bg3)' : 'transparent', transition: 'background 0.1s' }}
                  onClick={() => setExpanded(expanded === q.id ? null : q.id)}
                >
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent2)', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 'var(--radius-sm)', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {q.question_index + 1}
                  </span>
                  <span className={`badge ${q.type === 'code' ? 'badge-purple' : 'badge-gray'}`}>
                    {q.type === 'code' ? q.language : 'written'}
                  </span>
                  <span style={{ fontSize: 13, color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    {q.text.split('\n')[0].replace(/^#+\s*/, '').slice(0, 100)}
                    {expanded === q.id ? <ChevronUp size={13} style={{ color: 'var(--text3)', flexShrink: 0 }} /> : <ChevronDown size={13} style={{ color: 'var(--text3)', flexShrink: 0 }} />}
                  </span>
                  <div style={{ display: 'flex', gap: '0.35rem' }} onClick={(e) => e.stopPropagation()}>
                    <button className="btn btn-ghost btn-sm" title="Edit" onClick={() => { setEditing(q.id); setEditDraft({ text: q.text, type: q.type, language: q.language, starter: q.starter }); setExpanded(q.id); }}>
                      <Edit3 size={12} />
                    </button>
                    <button className="btn btn-danger btn-sm" title="Delete" onClick={() => deleteQuestion(q.id, q.question_index)}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                {expanded === q.id && (
                  <div style={{ borderTop: '1px solid var(--border)', padding: '1rem', background: 'var(--bg3)' }}>
                    {editing === q.id ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                        <div className="form-group">
                          <label className="form-label">Question Text (Markdown)</label>
                          <textarea className="form-textarea" rows={8} value={editDraft.text ?? ''} onChange={(e) => setEditDraft((d) => ({ ...d, text: e.target.value }))} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
                          <div className="form-group">
                            <label className="form-label">Type</label>
                            <select className="form-select" value={editDraft.type ?? 'written'} onChange={(e) => setEditDraft((d) => ({ ...d, type: e.target.value as 'written' | 'code' }))}>
                              <option value="written">Written</option>
                              <option value="code">Code</option>
                            </select>
                          </div>
                          {editDraft.type === 'code' && (
                            <div className="form-group">
                              <label className="form-label">Language</label>
                              <select className="form-select" value={editDraft.language ?? 'go'} onChange={(e) => setEditDraft((d) => ({ ...d, language: e.target.value }))}>
                                <option value="go">Go</option>
                                <option value="python">Python</option>
                                <option value="javascript">JavaScript</option>
                              </select>
                            </div>
                          )}
                        </div>
                        {editDraft.type === 'code' && (
                          <div className="form-group">
                            <label className="form-label">Starter Code</label>
                            <textarea className="form-textarea" rows={8} style={{ fontFamily: "'Fira Code', monospace", fontSize: 12 }} value={editDraft.starter ?? ''} onChange={(e) => setEditDraft((d) => ({ ...d, starter: e.target.value }))} />
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn btn-success" disabled={saving} onClick={() => saveEdit(q.id)}><Save size={12} /> {saving ? 'Saving…' : 'Save changes'}</button>
                          <button className="btn btn-ghost" onClick={() => setEditing(null)}><X size={12} /> Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div className="question-text">
                        <ReactMarkdown>{q.text}</ReactMarkdown>
                        {q.type === 'code' && q.starter && (
                          <div style={{ marginTop: '1rem' }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>Starter Code</div>
                            <pre style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '0.75rem', fontSize: 12, overflowX: 'auto', color: 'var(--text2)', fontFamily: "'Fira Code', monospace" }}>{q.starter}</pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Upload card ── */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Bulk Import from Markdown</span>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button className="btn btn-sm btn-secondary" disabled={syncing} onClick={syncFromFiles} title="Re-read questions from docs/ files and update the database">
              <RefreshCw size={12} /> {syncing ? 'Syncing…' : 'Sync from files'}
            </button>
            <span className="badge badge-orange">Replaces all questions</span>
          </div>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: '1rem', lineHeight: 1.7 }}>
          Upload a <code style={{ background: 'var(--bg3)', border: '1px solid var(--border)', padding: '1px 5px', borderRadius: 3, color: 'var(--accent2)' }}>.md</code> file
          with sections like <code style={{ background: 'var(--bg3)', border: '1px solid var(--border)', padding: '1px 5px', borderRadius: 3, color: 'var(--accent2)' }}>## Question 1</code>.
          Each section becomes a question.
        </p>
        <div
          onClick={() => !uploading && fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          style={{ border: `2px dashed ${dragOver ? 'var(--accent)' : 'var(--border2)'}`, borderRadius: 'var(--radius-lg)', padding: '2rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem', cursor: uploading ? 'not-allowed' : 'pointer', background: dragOver ? 'var(--glow2)' : 'var(--bg3)', transition: 'border-color 0.15s, background 0.15s', marginBottom: '1rem', opacity: uploading ? 0.6 : 1 }}
        >
          {uploading
            ? <Upload size={28} style={{ color: 'var(--accent2)' }} />
            : <FileText size={28} style={{ color: dragOver ? 'var(--accent2)' : 'var(--text3)' }} />
          }
          <span style={{ fontSize: 13, fontWeight: 600, color: dragOver ? 'var(--text)' : 'var(--text2)' }}>
            {uploading ? 'Uploading…' : 'Drop a .md file here or click to browse'}
          </span>
          <span style={{ fontSize: 11, color: 'var(--text3)' }}>Markdown format · .md files only</span>
        </div>
        <input ref={fileInputRef} type="file" accept=".md" style={{ display: 'none' }} onChange={handleUpload} />
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ minWidth: 130 }}>
            <label className="form-label">Question Type</label>
            <select className="form-select" value={uploadType} onChange={(e) => { setUploadType(e.target.value); if (e.target.value !== 'code') setUploadLang('text'); }}>
              <option value="written">Written</option>
              <option value="code">Code</option>
            </select>
          </div>
          {uploadType === 'code' && (
            <div className="form-group" style={{ minWidth: 130 }}>
              <label className="form-label">Language</label>
              <select className="form-select" value={uploadLang} onChange={(e) => setUploadLang(e.target.value)}>
                <option value="go">Go</option>
                <option value="python">Python</option>
                <option value="javascript">JavaScript</option>
              </select>
            </div>
          )}
          <button className="btn btn-secondary" disabled={uploading} onClick={() => fileInputRef.current?.click()} style={{ marginBottom: '0.4rem' }}>
            <Upload size={13} /> {uploading ? 'Uploading…' : 'Choose file'}
          </button>
        </div>
      </div>

      {/* ── Add question ── */}
      {adding ? (
        <div className="card card-glow">
          <div className="card-header">
            <span className="card-title">New Question</span>
            <button className="btn btn-ghost btn-sm" onClick={() => setAdding(false)}><X size={13} /> Discard</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div className="form-group">
              <label className="form-label">Question Text (Markdown)</label>
              <textarea className="form-textarea" rows={8} placeholder="Write your question in Markdown…" value={newQ.text} onChange={(e) => setNewQ((q) => ({ ...q, text: e.target.value }))} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">Type</label>
                <select className="form-select" value={newQ.type} onChange={(e) => setNewQ((q) => ({ ...q, type: e.target.value }))}>
                  <option value="written">Written</option>
                  <option value="code">Code</option>
                </select>
              </div>
              {newQ.type === 'code' && (
                <div className="form-group">
                  <label className="form-label">Language</label>
                  <select className="form-select" value={newQ.language} onChange={(e) => setNewQ((q) => ({ ...q, language: e.target.value }))}>
                    <option value="go">Go</option>
                    <option value="python">Python</option>
                    <option value="javascript">JavaScript</option>
                  </select>
                </div>
              )}
            </div>
            {newQ.type === 'code' && (
              <div className="form-group">
                <label className="form-label">Starter Code</label>
                <textarea className="form-textarea" rows={8} style={{ fontFamily: "'Fira Code', monospace", fontSize: 12 }} placeholder={'package main\n\nfunc main() {\n  // TODO\n}'} value={newQ.starter} onChange={(e) => setNewQ((q) => ({ ...q, starter: e.target.value }))} />
              </div>
            )}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-primary" disabled={saving} onClick={addQuestion}><Plus size={13} /> {saving ? 'Adding…' : 'Add Question'}</button>
              <button className="btn btn-ghost" onClick={() => setAdding(false)}><X size={12} /> Cancel</button>
            </div>
          </div>
        </div>
      ) : (
        <button className="btn btn-secondary" onClick={() => setAdding(true)} style={{ alignSelf: 'flex-start' }}>
          <Plus size={13} /> Add Question
        </button>
      )}
    </div>
  );
}
