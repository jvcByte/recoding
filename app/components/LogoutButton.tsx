'use client';

import { signOut } from 'next-auth/react';

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/login' })}
      style={{
        padding: '6px 14px',
        background: 'transparent',
        border: '1px solid #cbd5e1',
        borderRadius: 6,
        cursor: 'pointer',
        fontSize: 13,
        color: '#475569',
      }}
    >
      Log out
    </button>
  );
}
