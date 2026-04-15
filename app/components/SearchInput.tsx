'use client';

import { Search } from 'lucide-react';

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  style?: React.CSSProperties;
}

export default function SearchInput({ value, onChange, placeholder = 'Search…', style }: Props) {
  return (
    <div className="search-wrap" style={style}>
      <Search size={13} className="search-icon" />
      <input
        className="search-input"
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
