import React from 'react';
import type { View } from '../types';

interface TopBarProps {
  activeView: View;
  onChangeView: (view: View) => void;
}

export function TopBar({ activeView, onChangeView }: TopBarProps) {
  const items: { key: View; label: string }[] = [
    { key: 'dashboard', label: '대시보드' },
    { key: 'vms', label: 'VM 관리' },
    { key: 'catalog', label: '서비스 카탈로그' },
    { key: 'history', label: '배포 이력' },
  ];

  return (
    <div
      style={{
        borderRadius: '999px',
        border: '1px solid rgba(148,163,184,0.5)',
        padding: '0.15rem',
        display: 'inline-flex',
        backgroundColor: 'rgba(15,23,42,0.02)',
      }}
    >
      {items.map((item) => {
        const isActive = item.key === activeView;
        return (
          <button
            key={item.key}
            onClick={() => onChangeView(item.key)}
            style={{
              borderRadius: '999px',
              border: 'none',
              padding: '0.3rem 0.95rem',
              fontSize: '0.8rem',
              fontWeight: isActive ? 700 : 500,
              cursor: 'pointer',
              backgroundColor: isActive ? 'white' : 'transparent',
              boxShadow: isActive ? '0 6px 16px rgba(15,23,42,0.18)' : 'none',
              color: isActive ? '#0f172a' : '#6b7280',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
            }}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

