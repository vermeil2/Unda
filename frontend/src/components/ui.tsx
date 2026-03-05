import React, { useMemo } from 'react';
import type { CiTool, JobStatus } from '../types';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost';
  size?: 'sm' | 'md';
}

export function Button({
  variant = 'primary',
  size = 'md',
  style,
  ...rest
}: ButtonProps) {
  const base: React.CSSProperties = {
    borderRadius: '999px',
    padding: size === 'sm' ? '0.35rem 0.9rem' : '0.5rem 1.1rem',
    fontSize: '0.8rem',
    fontWeight: 600,
    cursor: 'pointer',
    border: '1px solid transparent',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.35rem',
    transition: 'background-color 0.15s, color 0.15s, border-color 0.15s, box-shadow 0.15s',
    whiteSpace: 'nowrap',
  };

  const variants: Record<NonNullable<ButtonProps['variant']>, React.CSSProperties> = {
    primary: {
      background: 'linear-gradient(135deg, #2563eb, #22c55e)',
      color: 'white',
      borderColor: 'transparent',
      boxShadow: '0 8px 20px rgba(37, 99, 235, 0.35)',
    },
    outline: {
      background: 'white',
      color: '#0f172a',
      borderColor: 'rgba(148, 163, 184, 0.8)',
    },
    ghost: {
      background: 'transparent',
      color: '#0f172a',
      borderColor: 'transparent',
    },
  };

  return (
    <button
      {...rest}
      style={{
        ...base,
        ...variants[variant],
        opacity: rest.disabled ? 0.6 : 1,
        ...style,
      }}
    />
  );
}

export function Card(
  props: React.PropsWithChildren<{ title?: string; description?: string }>,
) {
  return (
    <div
      style={{
        borderRadius: '0.9rem',
        border: '1px solid rgba(148, 163, 184, 0.35)',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        background:
          'radial-gradient(circle at top left, rgba(248, 250, 252, 0.96), white 55%, #f8fafc)',
        boxShadow: '0 16px 40px rgba(15, 23, 42, 0.08)',
      }}
    >
      {(props.title || props.description) && (
        <div>
          {props.title && (
            <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{props.title}</div>
          )}
          {props.description && (
            <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.15rem' }}>
              {props.description}
            </p>
          )}
        </div>
      )}
      {props.children}
    </div>
  );
}

export function JobStatusBadge({ status }: { status: JobStatus }) {
  const { label, color } = useMemo(() => {
    switch (status) {
      case 'PENDING':
        return { label: '대기 중', color: '#64748b' };
      case 'RUNNING':
        return { label: '실행 중', color: '#0ea5e9' };
      case 'SUCCESS':
        return { label: '완료', color: '#22c55e' };
      case 'FAILED':
        return { label: '실패', color: '#ef4444' };
      default:
        return { label: status, color: '#6b7280' };
    }
  }, [status]);

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '999px',
        padding: '0.1rem 0.6rem',
        fontSize: '0.75rem',
        fontWeight: 600,
        backgroundColor: `${color}22`,
        color,
        border: `1px solid ${color}55`,
      }}
    >
      {label}
    </span>
  );
}

export function DeploymentStepper({ status }: { status: JobStatus }) {
  const steps = [
    { key: 'prepare', label: '준비' },
    { key: 'run', label: '실행' },
    { key: 'done', label: '완료' },
  ] as const;

  const activeIndex = (() => {
    switch (status) {
      case 'PENDING':
        return 0;
      case 'RUNNING':
        return 1;
      case 'SUCCESS':
      case 'FAILED':
        return 2;
      default:
        return 0;
    }
  })();

  const progress = status === 'PENDING' ? 33 : status === 'RUNNING' ? 66 : 100;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {steps.map((step, index) => {
          const completed = index < activeIndex;
          const isActive = index === activeIndex;
          const bg = completed || isActive ? '#22c55e' : '#1f2937';

          return (
            <div
              key={step.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                flex: 1,
                minWidth: 0,
              }}
            >
              <div
                style={{
                  width: '1.25rem',
                  height: '1.25rem',
                  borderRadius: '999px',
                  backgroundColor: bg,
                  border: '2px solid rgba(15,23,42,0.8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.7rem',
                  color: 'white',
                }}
              >
                {index + 1}
              </div>
              <span
                style={{
                  fontSize: '0.8rem',
                  color: completed || isActive ? '#e5e7eb' : '#6b7280',
                  whiteSpace: 'nowrap',
                }}
              >
                {step.label}
              </span>
              {index < steps.length - 1 && (
                <div
                  style={{
                    flex: 1,
                    height: 2,
                    background:
                      index < activeIndex ? 'linear-gradient(to right, #22c55e, #0ea5e9)' : '#111827',
                    borderRadius: 999,
                    opacity: index < activeIndex ? 1 : 0.4,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
      <div
        style={{
          height: 4,
          borderRadius: 999,
          backgroundColor: '#111827',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${progress}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #22c55e, #0ea5e9)',
            transition: 'width 0.3s ease-out',
          }}
        />
      </div>
    </div>
  );
}

export const TOOL_LABEL: Record<CiTool, string> = {
  jenkins: 'Jenkins 설치하기',
  nexus: 'Nexus 배포',
  harbor: 'Harbor 설정',
  sonarqube: 'SonarQube 설치',
};

export const TOOL_DESCRIPTION: Record<CiTool, string> = {
  jenkins: 'CI 파이프라인 실행용 Jenkins 서버를 설치합니다.',
  nexus: '아티팩트 저장소 Nexus 를 배포합니다.',
  harbor: '컨테이너 이미지를 위한 Harbor 레지스트리를 설정합니다.',
  sonarqube: '코드 품질 분석 도구 SonarQube 를 설치합니다.',
};

