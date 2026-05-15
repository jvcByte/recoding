'use client';

interface Props {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPage: (p: number) => void;
}

export default function Pagination({ page, totalPages, total, pageSize, onPage }: Props) {
  if (totalPages <= 1) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 1rem', borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text3)' }}>
      <span>{from}–{to} of {total}</span>
      <div style={{ display: 'flex', gap: '0.25rem' }}>
        <button className="btn btn-ghost btn-sm" disabled={page === 1} onClick={() => onPage(1)}>«</button>
        <button className="btn btn-ghost btn-sm" disabled={page === 1} onClick={() => onPage(page - 1)}>‹</button>
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
          .reduce<(number | '…')[]>((acc, p, i, arr) => {
            if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push('…');
            acc.push(p);
            return acc;
          }, [])
          .map((p, i) =>
            p === '…'
              ? <span key={`ellipsis-${i}`} style={{ padding: '0 0.25rem', color: 'var(--text3)' }}>…</span>
              : <button
                  key={p}
                  className={`btn btn-sm ${p === page ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => onPage(p as number)}
                  style={{ minWidth: 28 }}
                >
                  {p}
                </button>
          )}
        <button className="btn btn-ghost btn-sm" disabled={page === totalPages} onClick={() => onPage(page + 1)}>›</button>
        <button className="btn btn-ghost btn-sm" disabled={page === totalPages} onClick={() => onPage(totalPages)}>»</button>
      </div>
    </div>
  );
}
