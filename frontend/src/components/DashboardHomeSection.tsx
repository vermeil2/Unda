import React from 'react';
import type { CiTool, Job, Vm } from '../types';
import { Card, JobStatusBadge, TOOL_LABEL } from './ui';

interface DashboardHomeSectionProps {
  vms: Vm[];
  jobs: Job[];
}

export function DashboardHomeSection({ vms, jobs }: DashboardHomeSectionProps) {
  const lastJob = jobs[0];
  const successCount = jobs.filter((j) => j.status === 'SUCCESS').length;
  const runningCount = jobs.filter((j) => j.status === 'RUNNING').length;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '2fr 3fr',
        gap: '0.9rem',
      }}
    >
      <Card title="요약" description="현재 인프라 상태를 한눈에 확인합니다.">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: '0.6rem',
            fontSize: '0.8rem',
          }}
        >
          <div
            style={{
              padding: '0.6rem 0.75rem',
              borderRadius: '0.7rem',
              backgroundColor: '#eff6ff',
            }}
          >
            <div style={{ color: '#1d4ed8', fontSize: '0.75rem' }}>등록된 VM</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{vms.length}대</div>
            <div style={{ color: '#6b7280' }}>
              SSH OK {vms.filter((v) => v.sshConnected).length}대
            </div>
          </div>
          <div
            style={{
              padding: '0.6rem 0.75rem',
              borderRadius: '0.7rem',
              backgroundColor: '#ecfdf5',
            }}
          >
            <div style={{ color: '#16a34a', fontSize: '0.75rem' }}>성공한 배포</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{successCount}건</div>
            <div style={{ color: '#6b7280' }}>실행 중 {runningCount}건</div>
          </div>
        </div>
        {lastJob && (
          <div
            style={{
              marginTop: '0.75rem',
              fontSize: '0.8rem',
              padding: '0.6rem 0.75rem',
              borderRadius: '0.7rem',
              border: '1px dashed rgba(148,163,184,0.7)',
              backgroundColor: 'rgba(248,250,252,0.8)',
            }}
          >
            <div style={{ marginBottom: '0.2rem' }}>최근 배포</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
              <div>
                <div style={{ fontWeight: 600 }}>
                  {TOOL_LABEL[lastJob.tool as CiTool]} · {lastJob.targetHost}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                  {new Date(lastJob.createdAt).toLocaleString()}
                </div>
              </div>
              <JobStatusBadge status={lastJob.status} />
            </div>
          </div>
        )}
      </Card>

      <Card
        title="빠른 시작"
        description="서비스 카탈로그에서 도구를 선택하고 VM 을 지정해 바로 배포할 수 있습니다."
      >
        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.45rem',
            fontSize: '0.8rem',
          }}
        >
          {(['jenkins', 'nexus', 'harbor', 'sonarqube'] as CiTool[]).map((tool) => (
            <li
              key={tool}
              style={{
                padding: '0.4rem 0.7rem',
                borderRadius: '999px',
                border: '1px solid rgba(148,163,184,0.7)',
                backgroundColor: 'rgba(248,250,252,0.9)',
              }}
            >
              {TOOL_LABEL[tool]}
            </li>
          ))}
        </ul>
        <p style={{ marginTop: '0.7rem', fontSize: '0.75rem', color: '#6b7280' }}>
          상단 메뉴에서 <strong>서비스 카탈로그</strong>를 선택하면 설치 가능한 도구 목록과
          VM 선택 옵션을 자세히 볼 수 있습니다.
        </p>
      </Card>
    </div>
  );
}

