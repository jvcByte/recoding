'use client';

import { Cloud, CloudOff, Check, AlertCircle, Loader2 } from 'lucide-react';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'offline' | 'error';

interface SaveStatusIndicatorProps {
  status: SaveStatus;
  className?: string;
}

export default function SaveStatusIndicator({ status, className = '' }: SaveStatusIndicatorProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'idle':
        return {
          icon: null,
          text: '',
          color: 'var(--text3)',
          show: false,
        };
      case 'saving':
        return {
          icon: <Loader2 size={14} className="animate-spin" />,
          text: 'Saving…',
          color: 'var(--text3)',
          show: true,
        };
      case 'saved':
        return {
          icon: <Check size={14} />,
          text: 'Saved',
          color: 'var(--green)',
          show: true,
        };
      case 'offline':
        return {
          icon: <CloudOff size={14} />,
          text: 'Offline',
          color: 'var(--orange)',
          show: true,
        };
      case 'error':
        return {
          icon: <AlertCircle size={14} />,
          text: 'Save failed',
          color: 'var(--red)',
          show: true,
        };
      default:
        return {
          icon: null,
          text: '',
          color: 'var(--text3)',
          show: false,
        };
    }
  };

  const config = getStatusConfig();

  if (!config.show) {
    return null;
  }

  return (
    <div
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.375rem',
        fontSize: 12,
        fontWeight: 500,
        color: config.color,
      }}
      role="status"
      aria-live="polite"
      aria-label={config.text}
    >
      {config.icon}
      <span>{config.text}</span>
    </div>
  );
}
