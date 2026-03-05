import React from 'react';
import type { Job } from '../types';
import { Button, Card, JobStatusBadge } from './ui';

interface JobHistorySectionProps {
  jobs: Job[];
  loading: boolean;
  onSelectJob: (job: Job) => void;
}

export function JobHistorySection({ jobs, loading, onSelectJob }: JobHistorySectionProps) {
  return (
    <Card
      title="배포 이력"
      description="실행된 프로비저닝 작업과 현재 상태를 확인합니다."
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '0.4rem',
          fontSize: '0.8rem',
        }}
      >
        <span style={{ color: '#6b7280' }}>총 {jobs.length}건</span>
        {loading && <span style={{ color: '#9ca3af' }}>목록 새로고침 중…</span>}
      </div>
      <div
        style={{
          borderRadius: '0.7rem',
          border: '1px solid rgba(226,232,240,1)',
          overflow: 'hidden',
          backgroundColor: 'white',
        }}
      >
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '0.8rem',
          }}
        >
          <thead style={{ backgroundColor: '#f8fafc' }}>
            <tr>
              <th style={{ textAlign: 'left', padding: '0.45rem 0.7rem' }}>도구</th>
              <th style={{ textAlign: 'left', padding: '0.45rem 0.7rem' }}>대상 서버</th>
              <th style={{ textAlign: 'left', padding: '0.45rem 0.7rem' }}>상태</th>
              <th style={{ textAlign: 'left', padding: '0.45rem 0.7rem' }}>시작</th>
              <th style={{ textAlign: 'left', padding: '0.45rem 0.7rem' }}>상세</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job.id} style={{ borderTop: '1px solid rgba(226,232,240,1)' }}>
                <td style={{ padding: '0.5rem 0.7rem', textTransform: 'capitalize' }}>
                  {job.tool}
                </td>
                <td style={{ padding: '0.5rem 0.7rem' }}>{job.targetHost}</td>
                <td style={{ padding: '0.5rem 0.7rem' }}>
                  <JobStatusBadge status={job.status} />
                </td>
                <td style={{ padding: '0.5rem 0.7rem' }}>
                  {new Date(job.createdAt).toLocaleString()}
                </td>
                <td style={{ padding: '0.5rem 0.7rem' }}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onSelectJob(job)}
                  >
                    로그 보기
                  </Button>
                </td>
              </tr>
            ))}
            {jobs.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  style={{
                    padding: '1.25rem 0.7rem',
                    textAlign: 'center',
                    color: '#9ca3af',
                  }}
                >
                  아직 실행된 작업이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

