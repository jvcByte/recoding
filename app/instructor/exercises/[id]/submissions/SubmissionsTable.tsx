'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Flag, ChevronDown, ChevronRight, ShieldCheck, ShieldX, RotateCcw } from 'lucide-react';
import SearchInput from '@/app/components/SearchInput';
import { toast } from 'sonner';
import type { ParticipantRow } from './page';

export default function SubmissionsTable({ participants }: { participants: ParticipantRow[] }) {
  const [search, setSearch] = useState('');
  const [filterFlagged, setFilterFlagged] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [overriding, setOverriding] = useState<string | null>(null);
  const [localOverride, setLocalOverride] = useState<Record<string, boolean | null>>({});

  async function handleOverride(sessionId: string, value: boolean | null) {
    setOverriding(sessionId);
    try {
      const res = await fetch(`/api/instructor/sessions/${sessionId}/override-pass`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passed_override: value }),
      });
      if (!res.ok) throw new Error('Failed');
      setLocalOverride((prev) => ({ ...prev, [sessionId]: value }));
      toast.success(value === true ? 'Manually passed' : value === false ? 'Manually failed' : 'Override cleared');
    } catch {
      toast.error('Failed to update');
    } finally {
      setOverriding(null);
    }
  }

  const filtered = participants.filter((p) => {
    const matchSearch = p.username.toLowerCase().includes(search.toLowerCase());
    const matchFlag = !filterFlagged || p.is_flagged;
    return matchSearch && matchFlag;
  });

  const flaggedCount = participants.filter((p) => p.is_flagged).length;

  function toggleExpand(sessionId: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(sessionId) ? next.delete(sessionId) : next.add(sessionId);
      return next;
    });
  }

  return (
    <>
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <SearchInput value={search} onChange={setSearch} placeholder="Search by participant…" />
        <button
          className={`btn btn-sm ${filterFlagged ? 'btn-danger' : 'btn-ghost'}`}
          onClick={() => setFilterFlagged((f) => !f)}
        >
          <Flag size={11} /> {filterFlagged ? `Flagged (${flaggedCount})` : 'Show flagged only'}
        </button>
        <span style={{ fontSize: 11, color: 'var(--text3)', marginLeft: 'auto' }}>
          {filtered.length} of {participants.length}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text3)' }}>
          {search || filterFlagged ? 'No participants match your filter.' : 'No submissions yet.'}
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: 24 }} />
                <th>Participant</th>
                <th>Progress</th>
                <th>Flag</th>
                <th>Score</th>
                <th>Last Activity</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const isExpanded = expanded.has(p.session_id);
                // local override takes precedence over DB value
                const effectivePassed = p.session_id in localOverride
                  ? localOverride[p.session_id]
                  : p.passed;
                const isOverridden = p.passed_override !== null || p.session_id in localOverride;

                return (
                  <>
                    {/* Summary row */}
                    <tr
                      key={p.session_id}
                      style={{ cursor: p.submissions.length > 0 ? 'pointer' : 'default' }}
                      onClick={() => p.submissions.length > 0 && toggleExpand(p.session_id)}
                    >
                      <td style={{ color: 'var(--text3)', paddingRight: 0 }}>
                        {p.submissions.length > 0
                          ? isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />
                          : null}
                      </td>
                      <td style={{ fontWeight: 600 }}>{p.username}</td>
                      <td>
                        <span style={{ fontSize: 13 }}>
                          {p.final_count}
                          <span style={{ color: 'var(--text3)' }}>/{p.total_questions}</span>
                        </span>
                        {p.final_count === p.total_questions && (
                          <span className="badge badge-green" style={{ marginLeft: 6, fontSize: 10 }}>Done</span>
                        )}
                      </td>
                      <td>
                        {p.is_flagged
                          ? <span className="badge badge-red" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <Flag size={10} /> {p.flag_count}
                            </span>
                          : <span style={{ color: 'var(--text3)' }}>—</span>
                        }
                      </td>
                      <td style={{
                        fontWeight: 600,
                        color: effectivePassed === false ? 'var(--red)' : effectivePassed === true ? 'var(--green)' : 'var(--text)',
                      }}>
                        {p.score !== null ? `${p.score.toFixed(1)}%` : '—'}
                        {effectivePassed === true && <span style={{ marginLeft: 4, fontSize: 10, color: 'var(--green)' }}>✓</span>}
                        {effectivePassed === false && <span style={{ marginLeft: 4, fontSize: 10, color: 'var(--red)' }}>✗</span>}
                        {isOverridden && <span style={{ marginLeft: 4, fontSize: 9, color: 'var(--text3)', fontWeight: 400 }}>(manual)</span>}
                      </td>
                      <td style={{ color: 'var(--text3)', fontSize: 12 }}>{p.last_submitted_at}</td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: '0.3rem' }}>
                          {effectivePassed !== true && (
                            <button
                              className="btn btn-sm btn-success"
                              disabled={overriding === p.session_id}
                              onClick={() => handleOverride(p.session_id, true)}
                              title="Manually pass"
                              style={{ fontSize: 11 }}
                            >
                              <ShieldCheck size={11} /> Pass
                            </button>
                          )}
                          {effectivePassed !== false && (
                            <button
                              className="btn btn-sm btn-danger"
                              disabled={overriding === p.session_id}
                              onClick={() => handleOverride(p.session_id, false)}
                              title="Manually fail"
                              style={{ fontSize: 11 }}
                            >
                              <ShieldX size={11} /> Fail
                            </button>
                          )}
                          {isOverridden && (
                            <button
                              className="btn btn-sm btn-ghost"
                              disabled={overriding === p.session_id}
                              onClick={() => handleOverride(p.session_id, null)}
                              title="Clear override"
                              style={{ fontSize: 11 }}
                            >
                              <RotateCcw size={11} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Expanded question rows */}
                    {isExpanded && p.submissions.map((sub) => (
                      <tr key={sub.id} style={{ background: 'var(--bg3)' }}>
                        <td />
                        <td style={{ color: 'var(--text3)', fontSize: 12, paddingLeft: '1.5rem' }}>
                          Q{sub.question_index + 1}
                        </td>
                        <td>
                          <span className={`badge ${sub.is_final ? 'badge-green' : 'badge-gray'}`} style={{ fontSize: 10 }}>
                            {sub.is_final ? 'Final' : 'Draft'}
                          </span>
                        </td>
                        <td>
                          {sub.is_flagged
                            ? <span className="badge badge-red" style={{ fontSize: 10, display: 'inline-flex', alignItems: 'center', gap: 3 }}><Flag size={9} /> Flagged</span>
                            : <span style={{ color: 'var(--text3)' }}>—</span>
                          }
                        </td>
                        <td />
                        <td style={{ color: 'var(--text3)', fontSize: 11 }}>
                          {new Date(sub.submitted_at).toLocaleTimeString()}
                        </td>
                        <td>
                          <Link href={`/instructor/submissions/${sub.id}`} className="btn btn-ghost btn-sm" style={{ fontSize: 11 }}>
                            Review
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
