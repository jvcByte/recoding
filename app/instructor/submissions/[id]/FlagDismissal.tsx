'use client';

import { useState } from 'react';
import { Flag, X, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

interface DismissedFlag {
  reason: string;
  dismissed_by: string;
  dismissed_at: string;
  dismissed_by_username?: string;
}

interface Props {
  submissionId: string;
  flagReasons: string[];
  dismissedFlags: DismissedFlag[];
}

export default function FlagDismissal({ submissionId, flagReasons, dismissedFlags: initial }: Props) {
  const [dismissedFlags, setDismissedFlags] = useState<DismissedFlag[]>(initial);
  const [loading, setLoading] = useState<string | null>(null);

  const dismissedReasons = new Set(dismissedFlags.map((d) => d.reason));

  async function toggle(reason: string, restore: boolean) {
    setLoading(reason);
    try {
      const res = await fetch(`/api/instructor/submissions/${submissionId}/dismiss-flag`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, restore }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Request failed');
      }
      const data = await res.json();
      setDismissedFlags(data.dismissed_flags ?? []);
      toast.success(restore ? 'Flag restored' : 'Flag dismissed');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(null);
    }
  }

  if (flagReasons.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {flagReasons.map((reason) => {
        const dismissed = dismissedFlags.find((d) => d.reason === reason);
        const isDismissed = dismissedReasons.has(reason);
        const isLoading = loading === reason;

        return (
          <div
            key={reason}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: '0.75rem',
              padding: '0.6rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              background: isDismissed ? 'var(--bg3)' : 'rgba(239,68,68,0.07)',
              border: `1px solid ${isDismissed ? 'var(--border)' : 'rgba(239,68,68,0.25)'}`,
              opacity: isDismissed ? 0.6 : 1,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', flex: 1 }}>
              <Flag size={13} style={{ color: isDismissed ? 'var(--text3)' : 'var(--red)', marginTop: 2, flexShrink: 0 }} />
              <div>
                <span style={{
                  fontSize: 13,
                  color: isDismissed ? 'var(--text3)' : 'var(--text)',
                  textDecoration: isDismissed ? 'line-through' : 'none',
                }}>
                  {reason}
                </span>
                {dismissed && (
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
                    Dismissed {new Date(dismissed.dismissed_at).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => toggle(reason, isDismissed)}
              disabled={isLoading}
              className={`btn btn-sm ${isDismissed ? 'btn-ghost' : 'btn-secondary'}`}
              style={{ flexShrink: 0 }}
              title={isDismissed ? 'Restore flag' : 'Dismiss flag'}
            >
              {isLoading
                ? '…'
                : isDismissed
                  ? <><RotateCcw size={11} /> Restore</>
                  : <><X size={11} /> Dismiss</>
              }
            </button>
          </div>
        );
      })}
    </div>
  );
}
