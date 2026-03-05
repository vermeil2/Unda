import React from 'react';
import type { Job, Template } from '../../types';
import { Button, JobStatusBadge } from '../ui';
import { TEMPLATES } from './templates';

interface TemplatesListProps {
  jobs: Job[];
  onSelectTemplate: (template: Template) => void;
}

function getLastJobForTool(jobs: Job[], tool: Template['tool']): Job | undefined {
  const filtered = jobs.filter((j) => j.tool === tool);
  if (filtered.length === 0) return undefined;
  return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
}

export function TemplatesList({ jobs, onSelectTemplate }: TemplatesListProps) {
  return (
    <div
      style={{
        borderRadius: '0.75rem',
        border: '1px solid rgba(148,163,184,0.35)',
        overflow: 'hidden',
        backgroundColor: 'white',
        boxShadow: '0 4px 20px rgba(15,23,42,0.06)',
      }}
    >
      <div
        style={{
          padding: '0.75rem 1rem',
          borderBottom: '1px solid rgba(226,232,240,0.9)',
          backgroundColor: '#f8fafc',
          fontSize: '0.8rem',
          fontWeight: 600,
          color: '#475569',
        }}
      >
        Task Templates
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
        <thead style={{ backgroundColor: '#f1f5f9' }}>
          <tr>
            <th style={{ textAlign: 'left', padding: '0.6rem 1rem', fontWeight: 600, color: '#475569' }}>
              이름
            </th>
            <th style={{ textAlign: 'left', padding: '0.6rem 1rem', fontWeight: 600, color: '#475569' }}>
              도구
            </th>
            <th style={{ textAlign: 'left', padding: '0.6rem 1rem', fontWeight: 600, color: '#475569' }}>
              포트
            </th>
            <th style={{ textAlign: 'left', padding: '0.6rem 1rem', fontWeight: 600, color: '#475569' }}>
              마지막 실행
            </th>
            <th style={{ textAlign: 'left', padding: '0.6rem 1rem', fontWeight: 600, color: '#475569' }}>
              상태
            </th>
            <th style={{ textAlign: 'right', padding: '0.6rem 1rem', fontWeight: 600, color: '#475569' }}>
              액션
            </th>
          </tr>
        </thead>
        <tbody>
          {TEMPLATES.map((template) => {
            const lastJob = getLastJobForTool(jobs, template.tool);
            return (
              <tr
                key={template.id}
                onClick={() => onSelectTemplate(template)}
                style={{
                  borderTop: '1px solid rgba(226,232,240,0.8)',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8fafc';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                }}
              >
                <td style={{ padding: '0.65rem 1rem', fontWeight: 600 }}>
                  {template.name}
                </td>
                <td style={{ padding: '0.65rem 1rem', color: '#64748b', textTransform: 'capitalize' }}>
                  {template.tool}
                </td>
                <td style={{ padding: '0.65rem 1rem', color: '#64748b' }}>
                  {template.defaultPort}
                </td>
                <td style={{ padding: '0.65rem 1rem', color: '#64748b', fontSize: '0.8rem' }}>
                  {lastJob
                    ? new Date(lastJob.createdAt).toLocaleString('ko-KR')
                    : '—'}
                </td>
                <td style={{ padding: '0.65rem 1rem' }}>
                  {lastJob ? (
                    <JobStatusBadge status={lastJob.status} />
                  ) : (
                    <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>—</span>
                  )}
                </td>
                <td style={{ padding: '0.65rem 1rem', textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onSelectTemplate(template)}
                  >
                    열기
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
