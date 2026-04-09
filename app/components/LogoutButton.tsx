'use client';

import { signOut } from 'next-auth/react';
import { LogOut } from 'lucide-react';

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/login' })}
      className="btn btn-ghost btn-sm"
      title="Sign out"
    >
      <LogOut size={12} />
      <span>Sign out</span>
    </button>
  );
}
