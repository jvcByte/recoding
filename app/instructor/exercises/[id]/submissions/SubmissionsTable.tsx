'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Flag } from 'lucide-react';
import SearchInput from '@/app/components/SearchInput';

interface SubmissionRow {
  id: string; session_id: string; question_index: number;
  is_final: boolean; is_flagged: boolean; flag_reasons: string[] | null;
  submitted_at: string; username: string;
}

export default function SubmissionsTable({ submissions }: { submissions: SubmissionRow[] }) {
  const [search, setSearch] = useState('');
  const [filterFlagged, setFilterFlagged] = useState(false);

  const filtered = submissions.filter((s) => {
    const matchSearch = s.username.toLowerCase().includes(search.toLowerCase());
    const matchFlag = !filterFlagged || s.is_flagged;
    return matchSearch && matchFlag;
  });

  const flagged = submissions.filter((s) => s.is_flagged).length;

  return (
    <>
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <SearchInput value={search} onChange={setSearch} placeholder="Search by participant…" />
        <button
          className={`btn btn-sm ${filterFlagged ? 'btn-danger' : 'btn-ghost'}`}
          onClick={() => setFilterFlagged((f) => !f)}
        >
          <Flag size={11} /> {filterFlagged ? `Flagged (${flagged})` : `Show flagged only`}
        </button>
        <span style={{ fontSize: 11, color: 'var(--text3)', marginLeft: 'auto' }}>
          {filtered.length} of {submissions.length}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text3)' }}>
          {search || filterFlagged ? 'No submissions match your filter.' : 'No submissions yet.'}
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Participant</th>
                <th>Q#</th>
                <th>Status</th>
                <th>Flag</th>
                <th>Submitted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((sub) => (
                <tr key={sub.id}>
                  <td style={{ fontWeight: 600 }}>{sub.username}</td>
                  <td style={{ color: 'var(--text2)' }}>{sub.question_index + 1}</td>
                  <td>
                    <span className={`badge ${sub.is_final ? 'badge-green' : 'badge-gray'}`}>
                      {sub.is_final ? 'Final' : 'Draft'}
                    </span>
                  </td>
                  <td>
                    {sub.is_flagged
                      ? <span className="badge badge-red" title={sub.flag_reasons?.join(', ')} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Flag size={10} /> Flagged</span>
                      : <span style={{ color: 'var(--text3)' }}>—</span>
                    }
                  </td>
                  <td style={{ color: 'var(--text3)', fontSize: 12 }}>
                    {new Date(sub.submitted_at).toLocaleString()}
                  </td>
                  <td>
                    <Link href={`/instructor/submissions/${sub.id}`} className="btn btn-secondary btn-sm">
                      Review
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
