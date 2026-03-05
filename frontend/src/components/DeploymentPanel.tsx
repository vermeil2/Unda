import React, { useEffect, useRef } from 'react';
import type { Job } from '../types';
import { Button, DeploymentStepper, JobStatusBadge, TOOL_LABEL } from './ui';

interface DeploymentPanelProps {
  job: Job | null;
  logs: string[];
  onClose: () => void;
  streamStatus?: 'connecting' | 'live' | 'done' | 'error';
}

export function DeploymentPanel({
  job,
  logs,
  onClose,
  streamStatus,
}: DeploymentPanelProps) {
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!logContainerRef.current) return;
    logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
  }, [logs]);

  if (!job) return null;

  const statusMessage =
    streamStatus === 'connecting'
      ? '로그 스트림 연결 중...'
      : streamStatus === 'live'
        ? '실시간 Ansible 로그'
        : streamStatus === 'done'
          ? '스트림 종료'
          : streamStatus === 'error'
            ? '스트림 오류 (폴링으로 재시도 중)'
            : '';

  return (
    <div
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 40,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          maxWidth: '1120px',
          margin: '0 auto 1rem',
          borderRadius: '0.85rem',
          overflow: 'hidden',
          boxShadow: '0 -18px 40px rgba(15,23,42,0.6)',
          border: '1px solid rgba(15,23,42,0.7)',
          pointerEvents: 'auto',
        }}
      >
        <div
          style={{
            background:
              'radial-gradient(circle at top left, #0b1120, #020617 55%, #020617)',
            color: 'white',
            padding: '0.8rem 1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.6rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '0.75rem',
            }}
          >
            <div>
              <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>Deployment Stepper</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>
                {TOOL_LABEL[job.tool]} · {job.targetHost}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <JobStatusBadge status={job.status} />
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                style={{ color: '#9ca3af' }}
              >
                숨기기
              </Button>
            </div>
          </div>

          <DeploymentStepper status={job.status} />

          <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>
            {statusMessage ||
              '준비 - 실행 - 완료 단계에 따라 상태가 자동으로 반영됩니다. 아래 터미널에서 실시간 Ansible 로그를 확인할 수 있습니다.'}
          </div>
        </div>

        <div
          ref={logContainerRef}
          style={{
            backgroundColor: '#0f172a',
            color: '#a5f3fc',
            fontFamily:
              'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            fontSize: '0.75rem',
            lineHeight: 1.45,
            maxHeight: '280px',
            overflow: 'auto',
            padding: '0.6rem 0.85rem',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
          }}
        >
          {logs.length === 0 && streamStatus !== 'error' ? (
            <div style={{ color: '#64748b' }}>로그를 불러오는 중...</div>
          ) : (
            logs.map((line, idx) => (
              <div key={idx} style={{ marginBottom: '0.1rem' }}>
                {line}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

