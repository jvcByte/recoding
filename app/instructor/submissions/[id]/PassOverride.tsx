'use client';

import { useState } from 'react';
import { ShieldCheck, ShieldX, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  submissionId: string;
  manuallyPassed: boolean | null;
}

export default function PassOverride({ submissionId, manuallyPassed }: Props) {
  const [value, setValue] = useState<boolean | null>(manuallyPassed);
  const [loading, setLoading] = useState(false);

  async function apply(newValue: boolean | null) {
    setLoading(true);
    try {
      const res = await fetch(`/api/instructor/submissions/${submissionId}/manual-pass`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manually_passed: newValue }),
      });
      if (!res.ok) throw new Error('Failed');
      setValue(newValue);
      toast.success(
        newValue === true ? 'Question marked as passed'
        : newValue === false ? 'Question marked as failed'
        : 'Override cleared'
      );
    } catch {
      toast.error('Failed to update');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card" style={{ marginBottom: '1.25rem' }}>
      <div className="card-header">
        <span className="card-title">Manual Grade</span>
        {value === true && (
          <span className="badge badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
            <ShieldCheck size={12} /> Passed by instructor
          </span>
        )}
        {value === false && (
          <span className="badge badge-red" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
            <ShieldX size={12} /> Failed by instructor
          </span>
        )}
        {value === null && (
          <span style={{ fontSize: 12, color: 'var(--text3)' }}>Not graded manually</span>
        )}
      </div>
      <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: '1rem' }}>
        Override the automated result for this specific question.
      </p>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          className={`btn btn-sm ${value === true ? 'btn-success' : 'btn-ghost'}`}
          disabled={loading || value === true}
          onClick={() => apply(true)}
        >
          <ShieldCheck size={12} /> Mark as Passed
        </button>
        <button
          className={`btn btn-sm ${value === false ? 'btn-danger' : 'btn-ghost'}`}
          disabled={loading || value === false}
          onClick={() => apply(false)}
        >
          <ShieldX size={12} /> Mark as Failed
        </button>
        {value !== null && (
          <button className="btn btn-sm btn-ghost" disabled={loading} onClick={() => apply(null)}>
            <RotateCcw size={11} /> Clear
          </button>
        )}
      </div>
    </div>
  );
}
