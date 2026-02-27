import React, { useEffect, useMemo, useState } from 'react';

// 타입 정의
type CiTool = 'jenkins' | 'nexus' | 'harbor' | 'sonarqube';
type JobStatus = 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED';

interface Job {
  id: string;
  tool: CiTool;
  targetHost: string;
  createdAt: string;
  updatedAt: string;
  status: JobStatus;
  message?: string;
}

// 상태 뱃지
function JobStatusBadge({ status }: { status: JobStatus }) {
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

// 간단한 카드 & 버튼 (shadcn 스타일 느낌)
function Card(props: React.PropsWithChildren<{ title: string }>) {
  return (
    <div
      style={{
        borderRadius: '0.75rem',
        border: '1px solid rgba(148, 163, 184, 0.4)',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        background:
          'radial-gradient(circle at top left, rgba(248, 250, 252, 0.9), white)',
        boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
      }}
    >
      <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{props.title}</div>
      {props.children}
    </div>
  );
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline';
}

function Button({ variant = 'primary', style, ...rest }: ButtonProps) {
  const base: React.CSSProperties = {
    borderRadius: '999px',
    padding: '0.45rem 0.9rem',
    fontSize: '0.85rem',
    fontWeight: 600,
    cursor: 'pointer',
    border: '1px solid transparent',
    transition: 'background-color 0.15s, color 0.15s, border-color 0.15s',
  };

  const variants: Record<ButtonProps['variant'], React.CSSProperties> = {
    primary: {
      background: 'linear-gradient(135deg, #2563eb, #22c55e)',
      color: 'white',
      borderColor: 'transparent',
    },
    outline: {
      background: 'white',
      color: '#0f172a',
      borderColor: 'rgba(148, 163, 184, 0.8)',
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

// CI 도구 카드
const TOOL_LABEL: Record<CiTool, string> = {
  jenkins: 'Jenkins 설치하기',
  nexus: 'Nexus 배포',
  harbor: 'Harbor 설정',
  sonarqube: 'SonarQube 설치',
};

interface ToolCardProps {
  tool: CiTool;
  availableHosts: string[];
  onJobCreated: () => void;
}

function ToolCard({ tool, availableHosts, onJobCreated }: ToolCardProps) {
  const [targetHost, setTargetHost] = useState<string>('');
  const [loading, setLoading] = useState(false);

  async function createJob(tool: CiTool, host: string) {
    const res = await fetch(`/api/v1/tools/${tool}/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetHost: host }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || '작업 생성에 실패했습니다.');
    }
    return (await res.json()) as Job;
  }

  const handleClick = async () => {
    if (!targetHost) return;
    try {
      setLoading(true);
      await createJob(tool, targetHost);
      onJobCreated();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title={TOOL_LABEL[tool]}>
      <p style={{ fontSize: '0.8rem', color: '#6b7280' }}>
        대상 서버를 선택한 뒤 설치를 실행합니다.
      </p>
      <select
        value={targetHost}
        onChange={(e) => setTargetHost(e.target.value)}
        style={{
          width: '100%',
          borderRadius: '0.5rem',
          border: '1px solid rgba(148, 163, 184, 0.8)',
          padding: '0.45rem 0.6rem',
          fontSize: '0.85rem',
        }}
      >
        <option value="">대상 서버 선택</option>
        {availableHosts.map((host) => (
          <option key={host} value={host}>
            {host}
          </option>
        ))}
      </select>
      <Button
        onClick={handleClick}
        disabled={!targetHost || loading}
        style={{ marginTop: '0.4rem', width: '100%' }}
      >
        {loading ? '실행 중...' : '설치 실행'}
      </Button>
    </Card>
  );
}

// 작업 목록 테이블
interface JobListProps {
  jobs: Job[];
  onSelectJob: (job: Job) => void;
}

function JobList({ jobs, onSelectJob }: JobListProps) {
  return (
    <div
      style={{
        borderRadius: '0.75rem',
        border: '1px solid rgba(148, 163, 184, 0.4)',
        overflow: 'hidden',
        backgroundColor: 'white',
      }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
        <thead style={{ backgroundColor: '#f8fafc' }}>
          <tr>
            <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem' }}>도구</th>
            <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem' }}>대상 서버</th>
            <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem' }}>상태</th>
            <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem' }}>시작 시각</th>
            <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem' }}>액션</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr key={job.id} style={{ borderTop: '1px solid rgba(226, 232, 240, 1)' }}>
              <td style={{ padding: '0.55rem 0.75rem', textTransform: 'capitalize' }}>
                {job.tool}
              </td>
              <td style={{ padding: '0.55rem 0.75rem' }}>{job.targetHost}</td>
              <td style={{ padding: '0.55rem 0.75rem' }}>
                <JobStatusBadge status={job.status} />
              </td>
              <td style={{ padding: '0.55rem 0.75rem' }}>
                {new Date(job.createdAt).toLocaleString()}
              </td>
              <td style={{ padding: '0.55rem 0.75rem' }}>
                <Button
                  variant="outline"
                  onClick={() => onSelectJob(job)}
                  style={{ paddingInline: '0.7rem', paddingBlock: '0.35rem' }}
                >
                  상세 보기
                </Button>
              </td>
            </tr>
          ))}
          {jobs.length === 0 && (
            <tr>
              <td
                colSpan={5}
                style={{
                  padding: '1.5rem 0.75rem',
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
  );
}

// 작업 상세 + 로그 패널
interface JobDetailProps {
  job: Job | null;
  logs: string[];
  onClose: () => void;
}

function JobDetail({ job, logs, onClose }: JobDetailProps) {
  if (!job) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        display: 'flex',
        justifyContent: 'flex-end',
        zIndex: 50,
      }}
      onClick={onClose}
    >
      <aside
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(480px, 100%)',
          height: '100%',
          backgroundColor: '#0b1120',
          color: 'white',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          boxShadow: '-20px 0 40px rgba(15,23,42,0.6)',
        }}
      >
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
          }}
        >
          <div>
            <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>작업 상세</div>
            <div style={{ fontSize: '1rem', fontWeight: 600 }}>
              {job.tool} · {job.targetHost}
            </div>
          </div>
          <JobStatusBadge status={job.status} />
        </header>

        {job.message && (
          <p
            style={{
              fontSize: '0.8rem',
              whiteSpace: 'pre-line',
              backgroundColor: 'rgba(15,23,42,0.7)',
              borderRadius: '0.5rem',
              padding: '0.6rem 0.7rem',
              border: '1px solid rgba(148,163,184,0.4)',
            }}
          >
            {job.message}
          </p>
        )}

        <section style={{ fontSize: '0.8rem', display: 'flex', gap: '0.75rem' }}>
          <div style={{ flex: 1 }}>
            <div style={{ opacity: 0.7 }}>시작 시각</div>
            <div>{new Date(job.createdAt).toLocaleString()}</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ opacity: 0.7 }}>업데이트</div>
            <div>{new Date(job.updatedAt).toLocaleString()}</div>
          </div>
        </section>

        <section style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: '0.8rem', marginBottom: '0.35rem' }}>실시간 로그</div>
          <div
            style={{
              flex: 1,
              minHeight: 0,
              borderRadius: '0.5rem',
              border: '1px solid rgba(30,64,175,0.7)',
              backgroundColor: '#020617',
              padding: '0.5rem',
              overflow: 'auto',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
              fontSize: '0.75rem',
              color: '#bbf7d0',
            }}
          >
            {logs.length === 0 ? (
              <div style={{ color: '#6b7280' }}>로그를 불러오는 중입니다...</div>
            ) : (
              logs.map((line, idx) => <div key={idx}>{line}</div>)
            )}
          </div>
        </section>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="outline" onClick={onClose}>
            닫기
          </Button>
        </div>
      </aside>
    </div>
  );
}

// 메인 대시보드
const MOCK_HOSTS = ['ci-vm-01', 'ci-vm-02'];

async function fetchJobs(): Promise<Job[]> {
  const res = await fetch('/api/v1/jobs');
  if (!res.ok) {
    throw new Error('작업 목록을 불러오지 못했습니다.');
  }
  return res.json();
}

function subscribeJobLogs(jobId: string, onLine: (line: string) => void) {
  const es = new EventSource(`/api/v1/jobs/${jobId}/logs`);
  es.onmessage = (event) => {
    onLine(event.data);
  };
  es.onerror = () => {
    es.close();
  };
  return () => es.close();
}

const App: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoadingJobs(true);
        const data = await fetchJobs();
        setJobs(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingJobs(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!selectedJob) return;
    setLogs([]);
    const unsubscribe = subscribeJobLogs(selectedJob.id, (line) =>
      setLogs((prev) => [...prev, line]),
    );
    return unsubscribe;
  }, [selectedJob?.id]);

  const handleJobCreated = async () => {
    try {
      const data = await fetchJobs();
      setJobs(data);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(circle at top left, #eff6ff, #f9fafb 55%, #f1f5f9)',
        color: '#0f172a',
        padding: '1.5rem 1.25rem 2rem',
      }}
    >
      <div
        style={{
          maxWidth: '1120px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
        }}
      >
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <div>
            <h1
              style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                letterSpacing: '-0.03em',
              }}
            >
              CI 도구 프로비저닝 대시보드
            </h1>
            <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.25rem' }}>
              Jenkins, Nexus, Harbor, SonarQube를 한 화면에서 설치하고 실행 이력을 확인합니다.
            </p>
          </div>
        </header>

        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '0.9rem',
          }}
        >
          <ToolCard tool="jenkins" availableHosts={MOCK_HOSTS} onJobCreated={handleJobCreated} />
          <ToolCard tool="nexus" availableHosts={MOCK_HOSTS} onJobCreated={handleJobCreated} />
          <ToolCard tool="harbor" availableHosts={MOCK_HOSTS} onJobCreated={handleJobCreated} />
          <ToolCard tool="sonarqube" availableHosts={MOCK_HOSTS} onJobCreated={handleJobCreated} />
        </section>

        <section style={{ marginTop: '0.5rem' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.5rem',
            }}
          >
            <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>실행 이력</div>
            {loadingJobs && (
              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>목록 새로고침 중…</div>
            )}
          </div>
          <JobList jobs={jobs} onSelectJob={setSelectedJob} />
        </section>
      </div>

      <JobDetail job={selectedJob} logs={logs} onClose={() => setSelectedJob(null)} />
    </div>
  );
};

export default App;

