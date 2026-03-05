import React, { useEffect, useRef } from 'react';
import type { Job } from '../types';
import { Button, DeploymentStepper, JobStatusBadge, TOOL_LABEL } from './ui';

interface DeploymentConsoleProps {
  job: Job;
  logs: string[];
  onClose: () => void;
  streamStatus?: 'connecting' | 'live' | 'done' | 'error';
}

/**
 * Jenkins 파이프라인 콘솔처럼 메인 영역을 채우는 배포 로그 뷰.
 * 하단 고정 패널이 아니라, 현재 뷰의 전체 콘텐츠로 사용한다.
 */
export function DeploymentConsole({
  job,
  logs,
  onClose,
  streamStatus,
}: DeploymentConsoleProps) {
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!logContainerRef.current) return;
    logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
  }, [logs]);

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
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
        flex: 1,
        minHeight: 0,
        overflow: 'hidden',
        borderRadius: '0.75rem',
        overflow: 'hidden',
        border: '1px solid rgba(15,23,42,0.2)',
        boxShadow: '0 4px 24px rgba(15,23,42,0.12)',
        backgroundColor: '#0f172a',
      }}
    >
      {/* 헤더: 제목 + 상태 + 닫기 */}
      <div
        style={{
          flexShrink: 0,
          background: 'linear-gradient(180deg, #0f172a 0%, #020617 100%)',
          color: 'white',
          padding: '0.85rem 1.1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.6rem',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
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
            <div style={{ fontSize: '0.7rem', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              배포 콘솔
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 600, marginTop: '0.15rem' }}>
              {TOOL_LABEL[job.tool]} · {job.targetHost}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <JobStatusBadge status={job.status} />
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              style={{ color: '#94a3b8' }}
            >
              닫기
            </Button>
          </div>
        </div>

        <DeploymentStepper status={job.status} />

        <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>
          {statusMessage ||
            '아래에서 Ansible 실행 로그를 실시간으로 확인할 수 있습니다.'}
        </div>
      </div>

      {/* 로그 영역: 남은 공간 꽉 채움 (Jenkins 콘솔 느낌) */}
      <div
        ref={logContainerRef}
        style={{
          flex: 1,
          minHeight: '320px',
          backgroundColor: '#0c1222',
          color: '#a5f3fc',
          fontFamily:
            'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
          fontSize: '0.8rem',
          lineHeight: 1.5,
          overflow: 'auto',
          padding: '0.75rem 1rem',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
        }}
      >
        {logs.length === 0 && streamStatus !== 'error' ? (
          <div style={{ color: '#64748b' }}>로그를 불러오는 중...</div>
        ) : (
          logs.map((line, idx) => (
            <div key={idx} style={{ marginBottom: '0.05rem' }}>
              {line}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
