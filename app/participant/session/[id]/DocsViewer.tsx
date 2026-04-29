'use client';

import { useState } from 'react';
import { ExternalLink, Search } from 'lucide-react';
import { searchDocs, GO_STDLIB_DOCS } from './offline-docs/go-stdlib';

// Whitelisted documentation domains
const ALLOWED_DOMAINS = [
  'pkg.go.dev',
  'golang.org',
  'go.dev',
  'docs.python.org',
  'developer.mozilla.org',
  'nodejs.org',
  'typescriptlang.org',
];

const DEFAULT_DOCS: Array<{ label: string; url: string; language: string }> = [
  { label: 'Go Standard Library', url: 'https://pkg.go.dev/std', language: 'go' },
  { label: 'Go Tour', url: 'https://go.dev/tour/welcome/1', language: 'go' },
  { label: 'Python Docs', url: 'https://docs.python.org/3/', language: 'python' },
  { label: 'MDN JavaScript', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript', language: 'javascript' },
  { label: 'TypeScript Handbook', url: 'https://www.typescriptlang.org/docs/', language: 'typescript' },
];

interface DocLink {
  package?: string;
  url: string;
  label?: string;
}

interface Props {
  language?: string;
  documentationLinks?: DocLink[] | null;
  onClose: () => void;
}

function isAllowedUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ALLOWED_DOMAINS.some((d) => parsed.hostname === d || parsed.hostname.endsWith(`.${d}`));
  } catch {
    return false;
  }
}

export default function DocsViewer({ language, documentationLinks, onClose }: Props) {
  const [activeUrl, setActiveUrl] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [tab, setTab] = useState<'online' | 'offline'>('online');

  // Build doc list: question-specific links first, then defaults for the language
  const questionLinks: Array<{ label: string; url: string }> = (documentationLinks ?? [])
    .filter((l) => isAllowedUrl(l.url))
    .map((l) => ({ label: l.package ?? l.label ?? l.url, url: l.url }));

  const defaultLinks = DEFAULT_DOCS.filter((d) => !language || d.language === language);

  const allLinks = [
    ...questionLinks,
    ...defaultLinks.filter((d) => !questionLinks.some((q) => q.url === d.url)),
  ];

  const filtered = searchQuery
    ? allLinks.filter((l) => l.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : allLinks;

  const currentUrl = activeUrl ?? filtered[0]?.url ?? null;

  return (
    <div style={{
      background: 'var(--bg2)',
      border: '1px solid var(--border2)',
      borderRadius: 'var(--radius-lg)',
      display: 'flex',
      flexDirection: 'column',
      height: 500,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)', background: 'var(--bg3)' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Documentation
        </span>
        <button onClick={() => setTab('online')} className={`btn btn-sm ${tab === 'online' ? 'btn-primary' : 'btn-ghost'}`}>Online</button>
        {language === 'go' && (
          <button onClick={() => setTab('offline')} className={`btn btn-sm ${tab === 'offline' ? 'btn-primary' : 'btn-ghost'}`}>Offline</button>
        )}
        <div style={{ flex: 1 }} />
        {tab === 'online' && currentUrl && (
          <a href={currentUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm" title="Open in new tab">
            <ExternalLink size={11} />
          </a>
        )}
        <button onClick={onClose} className="btn btn-ghost btn-sm">Close</button>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {tab === 'online' ? (
          <>
            {/* Sidebar */}
            <div style={{ width: 180, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>
              <div style={{ padding: '0.5rem', borderBottom: '1px solid var(--border)' }}>
                <div className="search-wrap">
                  <Search size={12} className="search-icon" />
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Search docs…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ fontSize: 11, padding: '0.3rem 0.5rem 0.3rem 1.75rem' }}
                  />
                </div>
              </div>
              <div style={{ overflowY: 'auto', flex: 1 }}>
                {filtered.map((link) => (
                  <button
                    key={link.url}
                    onClick={() => setActiveUrl(link.url)}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      padding: '0.5rem 0.75rem',
                      fontSize: 12,
                      color: activeUrl === link.url || (!activeUrl && link.url === filtered[0]?.url) ? 'var(--text)' : 'var(--text2)',
                      background: activeUrl === link.url || (!activeUrl && link.url === filtered[0]?.url) ? 'var(--bg4)' : 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--border)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {link.label}
                  </button>
                ))}
                {filtered.length === 0 && (
                  <div style={{ padding: '0.75rem', fontSize: 11, color: 'var(--text3)' }}>No results</div>
                )}
              </div>
            </div>

            {/* iframe */}
            <div style={{ flex: 1, overflow: 'hidden' }}>
              {currentUrl ? (
                <iframe
                  src={currentUrl}
                  style={{ width: '100%', height: '100%', border: 'none' }}
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                  title="Documentation"
                />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text3)', fontSize: 13 }}>
                  Select a documentation page
                </div>
              )}
            </div>
          </>
        ) : (
          /* Offline docs panel */
          <OfflineDocsPanel searchQuery={searchQuery} onSearchChange={setSearchQuery} />
        )}
      </div>
    </div>
  );
}

function OfflineDocsPanel({ searchQuery, onSearchChange }: { searchQuery: string; onSearchChange: (q: string) => void }) {
  const results = searchQuery.trim() ? searchDocs(searchQuery) : GO_STDLIB_DOCS.slice(0, 20);
  const packages = Array.from(new Set(GO_STDLIB_DOCS.map((d) => d.package)));

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <div className="search-wrap" style={{ flex: 1 }}>
          <Search size={12} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search Go stdlib (fmt, strings, os…)"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{ fontSize: 11, padding: '0.3rem 0.5rem 0.3rem 1.75rem' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
          {packages.map((pkg) => (
            <button key={pkg} onClick={() => onSearchChange(pkg)} className="btn btn-ghost btn-sm" style={{ fontSize: 10, padding: '0.15rem 0.4rem' }}>
              {pkg}
            </button>
          ))}
        </div>
      </div>
      <div style={{ overflowY: 'auto', flex: 1, padding: '0.5rem' }}>
        {results.map((entry, i) => (
          <div key={i} style={{ padding: '0.6rem 0.75rem', marginBottom: '0.4rem', background: 'var(--bg3)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
              <span style={{ fontSize: 10, color: 'var(--accent2)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{entry.package}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', fontFamily: 'monospace' }}>{entry.symbol}</span>
            </div>
            <pre style={{ margin: '0 0 0.3rem', fontSize: 11, color: 'var(--accent2)', fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{entry.signature}</pre>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text2)', lineHeight: 1.5 }}>{entry.description}</p>
            {entry.example && (
              <pre style={{ margin: '0.4rem 0 0', fontSize: 11, color: 'var(--green)', fontFamily: 'monospace', background: 'var(--bg4)', padding: '0.3rem 0.5rem', borderRadius: 4, whiteSpace: 'pre-wrap' }}>{entry.example}</pre>
            )}
          </div>
        ))}
        {results.length === 0 && (
          <div style={{ padding: '1rem', color: 'var(--text3)', fontSize: 13, textAlign: 'center' }}>No results for &quot;{searchQuery}&quot;</div>
        )}
      </div>
    </div>
  );
}
