'use client';

import { useState } from 'react';
import SearchInput from '@/app/components/SearchInput';
import Pagination from '@/app/components/Pagination';
import { formatWAT } from '@/lib/format';
import { ChevronDown, ChevronRight, Flag } from 'lucide-react';
import type { HistorySession } from '@/lib/history-db';

const PAGE_SIZE = 25;

type Row = HistorySession & { username: string };

interface UserSummary {
  username: string;
  sessions: Row[];
  totalFinal: number;
  totalQuestions: number;
  passed: boolean | null;
  score: number | null;
  lastActivity: string | null;
}

export default function PastRecodingTable({ rows, cohort }: { rows: Row[]; cohort: string }) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // Group sessions by username
  const userMap = new Map<string, Row[]>();
  for (const r of rows) {
    if (!userMap.has(r.username)) userMap.set(r.username, []);
    userMap.get(r.username)!.push(r);
  }

  const users: UserSummary[] = Array.from(userMap.entries()).map(([username, sessions]) => {
    const totalFinal = sessions.reduce((s, r) => s + r.final_count, 0);
    const totalQuestions = sessions.reduce((s, r) => s + r.question_count, 0);
    // Use the most recent session's pass/score
    const latest = sessions.sort((a, b) =>
      new Date(b.closed_at ?? 0).getTime() - new Date(a.closed_at ?? 0).getTime()
    )[0];
    return {
      username,
      sessions,
      totalFinal,
      totalQuestions,
      passed: latest.passed,
      score: latest.score,
      lastActivity: latest.closed_at,
    };
  }).sort((a, b) => a.username.localeCompare(b.username));

  const filtered = users.filter((u) =>
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const passedCount = users.filter((u) => u.passed === true).length;
  const failedCount = users.filter((u) => u.passed === false).length;

  function toggle(username: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(username) ? next.delete(username) : next.add(username);
      return next;
    });
  }

  return (
    <div className="card" style={{ marginBottom: '1rem' }}>
      <div className="card-header">
        <span className="card-title">{cohort}</span>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search participant…" />
          <span className="badge badge-green">{passedCount} passed</span>
          <span className="badge badge-red">{failedCount} failed</span>
          <span className="badge badge-gray">{users.length} participants</span>
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th style={{ width: 24 }} />
              <th>Participant</th>
              <th>Exercise</th>
              <th>Score</th>
              <th>Result</th>
              <th>Questions</th>
              <th>Completed</th>
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text3)', padding: '2rem' }}>
                {search ? `No results for "${search}"` : 'No data'}
              </td></tr>
            ) : paged.map((u) => {
              const isExpanded = expanded.has(u.username);
              return (
                <>
                  {/* User summary row */}
                  <tr
                    key={u.username}
                    style={{ cursor: 'pointer' }}
                    onClick={() => toggle(u.username)}
                  >
                    <td style={{ color: 'var(--text3)', paddingRight: 0 }}>
                      {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                    </td>
                    <td style={{ fontWeight: 600 }}>{u.username}</td>
                    <td style={{ color: 'var(--text3)', fontSize: 12 }}>
                      {u.sessions.map((s) => s.exercise_title).join(', ')}
                    </td>
                    <td style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600,
                      color: u.passed === false ? 'var(--red)' : u.passed === true ? 'var(--green)' : 'var(--text)' }}>
                      {u.score !== null ? `${Number(u.score).toFixed(1)}%` : '—'}
                    </td>
                    <td>
                      {u.passed === true
                        ? <span className="badge badge-green">Pass</span>
                        : u.passed === false
                          ? <span className="badge badge-red">Fail</span>
                          : <span className="badge badge-gray">—</span>}
                    </td>
                    <td style={{ color: 'var(--text2)' }}>{u.totalFinal}/{u.totalQuestions}</td>
                    <td style={{ color: 'var(--text3)', fontSize: 12 }}>
                      {u.lastActivity ? formatWAT(u.lastActivity) : '—'}
                    </td>
                  </tr>

                  {/* Expanded: per-question submissions */}
                  {isExpanded && u.sessions.map((session) =>
                    (session.submissions ?? []).map((sub) => (
                      <tr key={`${u.username}-${session.exercise_slug}-${sub.question_index}`}
                        style={{ background: 'var(--bg3)' }}>
                        <td />
                        <td style={{ color: 'var(--text3)', fontSize: 12, paddingLeft: '1.5rem' }}>
                          Q{sub.question_index + 1}
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--text2)' }}>{session.exercise_title}</td>
                        <td>
                          {sub.tests_passed === true
                            ? <span className="badge badge-green" style={{ fontSize: 10 }}>Tests ✓</span>
                            : sub.tests_passed === false
                              ? <span className="badge badge-red" style={{ fontSize: 10 }}>Tests ✗</span>
                              : null}
                        </td>
                        <td>
                          <span className={`badge ${sub.is_final ? 'badge-green' : 'badge-gray'}`} style={{ fontSize: 10 }}>
                            {sub.is_final ? 'Final' : 'Draft'}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text3)', fontSize: 11 }}>
                          {sub.response_text
                            ? <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text2)' }}>
                                {sub.response_text.slice(0, 60)}{sub.response_text.length > 60 ? '…' : ''}
                              </span>
                            : <span style={{ color: 'var(--text3)' }}>—</span>}
                        </td>
                        <td style={{ color: 'var(--text3)', fontSize: 11 }}>
                          {formatWAT(sub.submitted_at)}
                        </td>
                      </tr>
                    ))
                  )}
                </>
              );
            })}
          </tbody>
        </table>
        <Pagination page={page} totalPages={totalPages} total={filtered.length} pageSize={PAGE_SIZE} onPage={setPage} />
      </div>
    </div>
  );
}
