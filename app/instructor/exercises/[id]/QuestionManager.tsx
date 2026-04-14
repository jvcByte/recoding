'use client';

import { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import { Plus, Trash2, Edit3, ChevronDown, ChevronUp, Save, X, Upload } from 'lucide-react';

interface Question {
  id: string;
  question_index: number;
  text: string;
  type: 'written' | 'code';
  language: string;
  starter: string;
}

interface Props {
  exerciseId: string;
  initialQuestions: Question[];
}

export default function QuestionManager({ exerciseId, initialQuestions }: Props) {
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<Question>>({});
  const [adding, setAdding] = useState(false);
  const [newQ, setNewQ] = useState({ text: '', type: 'written', language: 'text', starter: '' });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadType, setUploadType] = useState('written');
  const [uploadLang, setUploadLang] = useState('text');
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.md')) { toast.error('Only .md files are supported'); return; }

    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('type', uploadType);
      form.append('language', uploadLang);

      const res = await fetch(`/api/instructor/exercises/${exerciseId}/questions/upload`, {
        method: 'POST',
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Upload failed');

      toast.success(`Imported ${data.imported} questions`);
      // Reload page to show new questions
      window.location.reload();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function saveEdit(id: string) {
    setSaving(true);
    try {
      const res = await fetch(`/api/instructor/exercises/${exerciseId}/questions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editDraft),
      });
      if (!res.ok) throw new Error(await res.text());
      const updated = await res.json();
      setQuestions((qs) => qs.map((q) => q.id === id ? { ...q, ...updated } : q));
      setEditing(null);
      toast.success('Question updated');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
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
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newQ),
      });
      if (!res.ok) throw new Error(await res.text());
      const created = await res.json();
      setQuestions((qs) => [...qs, created]);
      setNewQ({ text: '', type: 'written', language: 'text', starter: '' });
      setAdding(false);
      toast.success('Question added');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to add');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {questions.length === 0 && !adding && (
        <div className="card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text3)' }}>
          No questions yet. Add the first one below.
        </div>
      )}

      {questions.map((q) => (
        <div key={q.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.85rem 1rem', cursor: 'pointer' }}
            onClick={() => setExpanded(expanded === q.id ? null : q.id)}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', minWidth: 24 }}>
              Q{q.question_index + 1}
            </span>
            <span className={`badge ${q.type === 'code' ? 'badge-purple' : 'badge-gray'}`}>
              {q.type === 'code' ? q.language : 'written'}
            </span>
            <span style={{ flex: 1, fontSize: 13, color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {q.text.split('\n')[0].replace(/^#+\s*/, '').slice(0, 80)}
            </span>
            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
              <button className="btn btn-ghost btn-sm" onClick={() => { setEditing(q.id); setEditDraft({ text: q.text, type: q.type, language: q.language, starter: q.starter }); setExpanded(q.id); }}>
                <Edit3 size={12} />
              </button>
              <button className="btn btn-danger btn-sm" onClick={() => deleteQuestion(q.id, q.question_index)}>
                <Trash2 size={12} />
              </button>
            </div>
            {expanded === q.id ? <ChevronUp size={14} style={{ color: 'var(--text3)', flexShrink: 0 }} /> : <ChevronDown size={14} style={{ color: 'var(--text3)', flexShrink: 0 }} />}
          </div>

          {/* Expanded content */}
          {expanded === q.id && (
            <div style={{ borderTop: '1px solid var(--border)', padding: '1rem' }}>
              {editing === q.id ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">Question Text (Markdown)</label>
                    <textarea className="form-textarea" rows={8} value={editDraft.text ?? ''} onChange={(e) => setEditDraft((d) => ({ ...d, text: e.target.value }))} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
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
                      <textarea className="form-textarea" rows={8} style={{ fontFamily: 'monospace', fontSize: 12 }} value={editDraft.starter ?? ''} onChange={(e) => setEditDraft((d) => ({ ...d, starter: e.target.value }))} />
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-primary" disabled={saving} onClick={() => saveEdit(q.id)}>
                      <Save size={12} /> {saving ? 'Saving…' : 'Save'}
                    </button>
                    <button className="btn btn-ghost" onClick={() => setEditing(null)}>
                      <X size={12} /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="question-text">
                  <ReactMarkdown>{q.text}</ReactMarkdown>
                  {q.type === 'code' && q.starter && (
                    <div style={{ marginTop: '1rem' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>Starter Code</div>
                      <pre style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '0.75rem', fontSize: 12, overflowX: 'auto', color: 'var(--text2)' }}>{q.starter}</pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Upload .md file */}
      <div className="card" style={{ padding: '1rem' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
          Bulk Upload from .md File
        </div>
        <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: '0.75rem' }}>
          Upload a Markdown file with headings like <code style={{ background: 'var(--bg3)', padding: '1px 5px', borderRadius: 3 }}>## Question 1</code> or <code style={{ background: 'var(--bg3)', padding: '1px 5px', borderRadius: 3 }}>## Drill 1</code>. Each section becomes a question. <strong style={{ color: 'var(--red)' }}>This replaces all existing questions.</strong>
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ minWidth: 120 }}>
            <label className="form-label">Question Type</label>
            <select className="form-select" value={uploadType} onChange={(e) => { setUploadType(e.target.value); if (e.target.value !== 'code') setUploadLang('text'); }}>
              <option value="written">Written</option>
              <option value="code">Code</option>
            </select>
          </div>
          {uploadType === 'code' && (
            <div className="form-group" style={{ minWidth: 120 }}>
              <label className="form-label">Language</label>
              <select className="form-select" value={uploadLang} onChange={(e) => setUploadLang(e.target.value)}>
                <option value="go">Go</option>
                <option value="python">Python</option>
                <option value="javascript">JavaScript</option>
              </select>
            </div>
          )}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".md"
              style={{ display: 'none' }}
              onChange={handleUpload}
            />
            <button
              className="btn btn-secondary"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={13} /> {uploading ? 'Uploading…' : 'Choose .md file'}
            </button>
          </div>
        </div>
      </div>

      {/* Add new question */}
      {adding ? (
        <div className="card">
          <div className="card-header"><span className="card-title">New Question</span></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label">Question Text (Markdown)</label>
              <textarea className="form-textarea" rows={8} placeholder="Write your question in Markdown…" value={newQ.text} onChange={(e) => setNewQ((q) => ({ ...q, text: e.target.value }))} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
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
                <textarea className="form-textarea" rows={8} style={{ fontFamily: 'monospace', fontSize: 12 }} placeholder="package main&#10;&#10;func main() {&#10;  // TODO&#10;}" value={newQ.starter} onChange={(e) => setNewQ((q) => ({ ...q, starter: e.target.value }))} />
              </div>
            )}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-primary" disabled={saving} onClick={addQuestion}>
                <Plus size={12} /> {saving ? 'Adding…' : 'Add Question'}
              </button>
              <button className="btn btn-ghost" onClick={() => setAdding(false)}>
                <X size={12} /> Cancel
              </button>
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
