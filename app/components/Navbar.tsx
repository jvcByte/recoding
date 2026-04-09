import Link from 'next/link';
import LogoutButton from './LogoutButton';
import { GraduationCap, User } from 'lucide-react';

interface NavLink { href: string; label: string; }
interface Props { username?: string; role?: string; links?: NavLink[]; }

export default function Navbar({ username, role, links = [] }: Props) {
  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-inner">
          <Link href={role === 'instructor' ? '/instructor' : '/participant'} className="navbar-brand">
            <div className="logo-mark">01</div>
            <span style={{ color: 'var(--text2)', fontWeight: 400 }}>Recoding</span>
          </Link>

          {links.length > 0 && (
            <div className="navbar-nav">
              {links.map((l) => (
                <Link key={l.href} href={l.href} className="nav-link">{l.label}</Link>
              ))}
            </div>
          )}

          <div className="navbar-right">
            {username && (
              <span className="navbar-user">
                {role === 'instructor'
                  ? <GraduationCap size={11} />
                  : <User size={11} />
                }
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
