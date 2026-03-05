import React, { useState } from 'react';
import type { CiTool, Job, Template, Vm } from '../../types';
import { Button, Card, JobStatusBadge } from '../ui';

interface TemplateDetailProps {
  template: Template;
  vms: Vm[];
  jobs: Job[];
  loading: boolean;
  onBack: () => void;
  onRun: (tool: CiTool, targetHost: string) => Promise<void>;
  onViewLog: (job: Job) => void;
}

export function TemplateDetail({
  template,
  vms,
  jobs,
  loading,
  onBack,
  onRun,
  onViewLog,
}: TemplateDetailProps) {
  const [selectedVmId, setSelectedVmId] = useState('');
  const [running, setRunning] = useState(false);

  const templateJobs = jobs
    .filter((j) => j.tool === template.tool)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 20);

  const handleRun = async () => {
    if (!selectedVmId) return;
    const vm = vms.find((v) => v.id === selectedVmId);
    if (!vm) return;
    try {
      setRunning(true);
      await onRun(template.tool, vm.id);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* 헤더: 뒤로 + 템플릿 정보 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={onBack}
            style={{
              padding: '0.35rem 0.75rem',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: '#475569',
              background: 'white',
              border: '1px solid rgba(148,163,184,0.7)',
              borderRadius: '999px',
              cursor: 'pointer',
            }}
          >
            ← 템플릿 목록
          </button>
          <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>서비스 카탈로그</span>
        </div>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
            {template.name}
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem' }}>
            Tool: {template.tool} · Playbook: {template.playbook} · Port: {template.defaultPort}
          </p>
        </div>
      </div>

      {/* 좌측: 실행 폼 / 우측: 최근 실행 이력 (2열 또는 상하) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 340px) 1fr',
          gap: '1.25rem',
        }}
      >
        {/* 실행 폼 */}
        <Card title="실행" description="대상 VM을 선택한 뒤 Run을 누르세요.">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <label style={{ fontSize: '0.85rem' }}>
              <span style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>
                대상 VM
              </span>
              <select
                value={selectedVmId}
                onChange={(e) => setSelectedVmId(e.target.value)}
                style={{
                  width: '100%',
                  borderRadius: '0.5rem',
                  border: '1px solid rgba(148,163,184,0.8)',
                  padding: '0.5rem 0.65rem',
                  fontSize: '0.9rem',
                }}
              >
                <option value="">
                  {vms.length === 0 ? 'VM 관리에서 서버를 등록해 주세요' : 'VM 선택'}
                </option>
                {vms.map((vm) => (
                  <option key={vm.id} value={vm.id}>
                    {vm.name || vm.ip} ({vm.ip})
                  </option>
                ))}
              </select>
            </label>
            <Button onClick={handleRun} disabled={!selectedVmId || running}>
              {running ? '실행 중…' : 'Run'}
            </Button>
          </div>
        </Card>

        {/* 최근 실행 이력 */}
        <Card title="최근 실행" description="이 템플릿으로 실행된 작업 목록입니다.">
          <div
            style={{
              borderRadius: '0.6rem',
              border: '1px solid rgba(226,232,240,0.9)',
              overflow: 'hidden',
              backgroundColor: '#fafafa',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead style={{ backgroundColor: '#f1f5f9' }}>
                <tr>
                  <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem', fontWeight: 600, color: '#475569' }}>
                    실행 시각
                  </th>
                  <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem', fontWeight: 600, color: '#475569' }}>
                    대상 VM
                  </th>
                  <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem', fontWeight: 600, color: '#475569' }}>
                    상태
                  </th>
                  <th style={{ textAlign: 'right', padding: '0.5rem 0.75rem', fontWeight: 600, color: '#475569' }}>
                    액션
                  </th>
                </tr>
              </thead>
              <tbody>
                {templateJobs.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ padding: '1.25rem', textAlign: 'center', color: '#94a3b8' }}>
                      아직 실행 이력이 없습니다. 왼쪽에서 Run을 실행해 보세요.
                    </td>
                  </tr>
                )}
                {templateJobs.map((job) => (
                  <tr key={job.id} style={{ borderTop: '1px solid rgba(226,232,240,0.8)' }}>
                    <td style={{ padding: '0.5rem 0.75rem', color: '#64748b' }}>
                      {new Date(job.createdAt).toLocaleString('ko-KR')}
                    </td>
                    <td style={{ padding: '0.5rem 0.75rem' }}>{job.targetHost}</td>
                    <td style={{ padding: '0.5rem 0.75rem' }}>
                      <JobStatusBadge status={job.status} />
                    </td>
                    <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>
                      <Button variant="ghost" size="sm" onClick={() => onViewLog(job)}>
                        로그 보기
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
