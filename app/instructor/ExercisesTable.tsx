'use client';

import { useState } from 'react';
import Link from 'next/link';
import SearchInput from '@/app/components/SearchInput';
import Pagination from '@/app/components/Pagination';

const PAGE_SIZE = 20;

interface Exercise {
  id: string;
  slug: string;
  title: string;
  enabled: boolean;
  question_count: number;
  assigned_user_ids: string[];
}

export default function ExercisesTable({ exercises }: { exercises: Exercise[] }) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const filtered = exercises.filter((ex) =>
    ex.title.toLowerCase().includes(search.toLowerCase()) ||
    ex.slug.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleSearch(v: string) { setSearch(v); setPage(1); }

  return (
    <div className="card" style={{ marginBottom: '1.5rem' }}>
      <div className="card-header">
        <span className="card-title">Exercises</span>
        <SearchInput value={search} onChange={handleSearch} placeholder="Search exercises…" />
      </div>
      {exercises.length === 0 ? (
        <p style={{ color: 'var(--text3)', fontSize: 13 }}>No exercises yet. Create one above.</p>
      ) : filtered.length === 0 ? (
        <p style={{ color: 'var(--text3)', fontSize: 13 }}>No exercises match "{search}"</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Questions</th>
                <th>Assigned</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((ex) => (
                <tr key={ex.id}>
                  <td style={{ fontWeight: 600 }}>{ex.title}</td>
                  <td>
                    <span className={`badge ${ex.enabled ? 'badge-green' : 'badge-gray'}`}>
                      {ex.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text2)' }}>{ex.question_count}</td>
                  <td style={{ color: 'var(--text2)' }}>{ex.assigned_user_ids.length}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <Link href={`/instructor/exercises/${ex.id}`} className="btn btn-secondary btn-sm">Manage</Link>
                      <Link href={`/instructor/exercises/${ex.id}/submissions`} className="btn btn-ghost btn-sm">Submissions</Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={page} totalPages={totalPages} total={filtered.length} pageSize={PAGE_SIZE} onPage={setPage} />
        </div>
      )}
    </div>
  );
}
