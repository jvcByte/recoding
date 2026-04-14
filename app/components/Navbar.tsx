import Link from 'next/link';
import LogoutButton from './LogoutButton';
import { GraduationCap, User, Hexagon } from 'lucide-react';

interface NavLink { href: string; label: string; }
interface Props { username?: string; role?: string; links?: NavLink[]; }

const defaultLinks: Record<string, NavLink[]> = {
  instructor: [
    { href: '/instructor', label: 'Dashboard' },
    { href: '/instructor/users', label: 'Users' },
  ],
  participant: [
    { href: '/participant', label: 'Exercises' },
    { href: '/participant/settings', label: 'Settings' },
  ],
};

export default function Navbar({ username, role, links }: Props) {
  const navLinks = links ?? (role ? (defaultLinks[role] ?? []) : []);

  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-inner">
          <Link href={role === 'instructor' ? '/instructor' : '/participant'} className="navbar-brand">
            <Hexagon size={20} strokeWidth={1.5} style={{ color: 'var(--accent2)' }} />
            <span style={{ color: 'var(--text2)', fontWeight: 400 }}>Recoding</span>
          </Link>

          {navLinks.length > 0 && (
            <div className="navbar-nav">
              {navLinks.map((l) => (
                <Link key={l.href} href={l.href} className="nav-link">{l.label}</Link>
              ))}
            </div>
          )}

          <div className="navbar-right">
            {username && (
              <span className="navbar-user">
                {role === 'instructor' ? <GraduationCap size={11} /> : <User size={11} />}
                {username}
              </span>
            )}
            <LogoutButton />
          </div>
        </div>
      </div>
    </nav>
  );
}
