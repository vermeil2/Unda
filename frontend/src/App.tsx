import React, { useEffect, useMemo, useState } from 'react';

// === 타입 정의 ===

type View = 'dashboard' | 'vms' | 'catalog' | 'history';
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

interface Vm {
  id: string;
  name: string;
  ip: string;
  sshConnected: boolean;
  lastCheck: string;
}

// === 공통 UI 컴포넌트 (shadcn 느낌의 최소 구현) ===

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost';
  size?: 'sm' | 'md';
}

function Button({ variant = 'primary', size = 'md', style, ...rest }: ButtonProps) {
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

function Card(props: React.PropsWithChildren<{ title?: string; description?: string }>) {
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

// === 상태 뱃지 & 스텝퍼 ===

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

function DeploymentStepper({ status }: { status: JobStatus }) {
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
    }
  })();

  const progress =
    status === 'PENDING' ? 33 : status === 'RUNNING' ? 66 : 100;

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

// === API 래퍼 ===

async function fetchJobs(): Promise<Job[]> {
  const res = await fetch('/api/v1/jobs');
  if (!res.ok) {
    throw new Error('작업 목록을 불러오지 못했습니다.');
  }
  return res.json();
}

async function createJob(tool: CiTool, targetHost: string): Promise<Job> {
  const res = await fetch(`/api/v1/tools/${tool}/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetHost }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || '작업 생성에 실패했습니다.');
  }
  return res.json();
}

async function fetchVms(): Promise<Vm[]> {
  const res = await fetch('/api/v1/vms');
  if (!res.ok) {
    throw new Error('VM 목록을 불러오지 못했습니다.');
  }
  return res.json();
}

async function createVm(payload: {
  ip: string;
  initialPassword: string;
  name: string;
  username: string;
}): Promise<Vm> {
  const res = await fetch('/api/v1/vms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || '서버 추가에 실패했습니다.');
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

// === 상단 네비게이션 ===

function TopBar({
  activeView,
  onChangeView,
}: {
  activeView: View;
  onChangeView: (view: View) => void;
}) {
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

// === VM 관리 섹션 ===

function VmManagementSection({
  vms,
  loading,
  onReload,
  onCreateVm,
}: {
  vms: Vm[];
  loading: boolean;
  onReload: () => void;
  onCreateVm: (payload: {
    ip: string;
    initialPassword: string;
    name: string;
    username: string;
  }) => Promise<void>;
}) {
  const [ip, setIp] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [pw, setPw] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ip || !pw || !username) return;
    try {
      setSubmitting(true);
      await onCreateVm({ ip, initialPassword: pw, name: name || ip, username });
      setIp('');
      setName('');
      setUsername('');
      setPw('');
      await onReload();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'grid', gap: '0.9rem', gridTemplateColumns: '2fr 3fr' }}>
        <Card
          title="신규 서버 추가"
          description="IP와 초기 비밀번호를 입력하면 Unda 전용 authorized_keys 가 자동으로 주입됩니다."
        >
          <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.25rem' }}
          >
            <label style={{ fontSize: '0.8rem' }}>
              <span style={{ display: 'block', marginBottom: '0.15rem' }}>IP 주소</span>
              <input
                value={ip}
                onChange={(e) => setIp(e.target.value)}
                placeholder="예: 10.0.0.5"
                style={{
                  width: '100%',
                  borderRadius: '0.5rem',
                  border: '1px solid rgba(148,163,184,0.8)',
                  padding: '0.45rem 0.6rem',
                  fontSize: '0.8rem',
                }}
                required
              />
            </label>
            <label style={{ fontSize: '0.8rem' }}>
              <span style={{ display: 'block', marginBottom: '0.15rem' }}>표시 이름(선택)</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예: CI-VM-01"
                style={{
                  width: '100%',
                  borderRadius: '0.5rem',
                  border: '1px solid rgba(148,163,184,0.8)',
                  padding: '0.45rem 0.6rem',
                  fontSize: '0.8rem',
                }}
              />
            </label>
            <label style={{ fontSize: '0.8rem' }}>
              <span style={{ display: 'block', marginBottom: '0.15rem' }}>Username</span>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="예: ubuntu, ec2-user 등"
                style={{
                  width: '100%',
                  borderRadius: '0.5rem',
                  border: '1px solid rgba(148,163,184,0.8)',
                  padding: '0.45rem 0.6rem',
                  fontSize: '0.8rem',
                }}
                required
              />
            </label>
            <label style={{ fontSize: '0.8rem' }}>
              <span style={{ display: 'block', marginBottom: '0.15rem' }}>초기 비밀번호</span>
              <input
                type="password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                placeholder="서버 초기 비밀번호"
                style={{
                  width: '100%',
                  borderRadius: '0.5rem',
                  border: '1px solid rgba(148,163,184,0.8)',
                  padding: '0.45rem 0.6rem',
                  fontSize: '0.8rem',
                }}
                required
              />
            </label>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '0.4rem',
              }}
            >
              <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                SSH 연결이 성공하면 목록에 활성 상태로 표시됩니다.
              </span>
              <Button type="submit" disabled={submitting}>
                {submitting ? '추가 중…' : '서버 추가'}
              </Button>
            </div>
          </form>
        </Card>

        <Card
          title="VM 상태"
          description="각 VM 의 SSH 연결 상태를 한눈에 확인할 수 있습니다."
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.8rem',
              marginBottom: '0.35rem',
            }}
          >
            <span style={{ color: '#6b7280' }}>
              총 {vms.length}대 · SSH OK{' '}
              {vms.filter((v) => v.sshConnected).length}대
            </span>
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={onReload}
              disabled={loading}
            >
              {loading ? '갱신 중…' : '상태 새로고침'}
            </Button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            {vms.length === 0 && (
              <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
                아직 추가된 VM 이 없습니다. 왼쪽에서 신규 서버를 등록해 주세요.
              </div>
            )}
            {vms.map((vm) => (
              <div
                key={vm.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.45rem 0.6rem',
                  borderRadius: '0.5rem',
                  border: '1px solid rgba(226,232,240,0.9)',
                  backgroundColor: 'rgba(248,250,252,0.9)',
                }}
              >
                <div style={{ fontSize: '0.8rem' }}>
                  <div style={{ fontWeight: 600 }}>
                    {vm.name || vm.ip}
                  </div>
                  <div style={{ color: '#6b7280' }}>{vm.ip}</div>
                  <div style={{ color: '#9ca3af', fontSize: '0.7rem', marginTop: '0.1rem' }}>
                    마지막 확인 {new Date(vm.lastCheck).toLocaleString()}
                  </div>
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: '0.15rem',
                    fontSize: '0.8rem',
                  }}
                >
                  <span
                    style={{
                      padding: '0.1rem 0.5rem',
                      borderRadius: '999px',
                      border: '1px solid rgba(15,23,42,0.1)',
                      backgroundColor: vm.sshConnected ? '#dcfce7' : '#fee2e2',
                      color: vm.sshConnected ? '#16a34a' : '#b91c1c',
                      fontWeight: 600,
                    }}
                  >
                    {vm.sshConnected ? 'SSH 연결됨' : 'SSH 실패'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// === 서비스 카탈로그 섹션 ===

const TOOL_LABEL: Record<CiTool, string> = {
  jenkins: 'Jenkins 설치하기',
  nexus: 'Nexus 배포',
  harbor: 'Harbor 설정',
  sonarqube: 'SonarQube 설치',
};

const TOOL_DESCRIPTION: Record<CiTool, string> = {
  jenkins: 'CI 파이프라인 실행용 Jenkins 서버를 설치합니다.',
  nexus: '아티팩트 저장소 Nexus 를 배포합니다.',
  harbor: '컨테이너 이미지를 위한 Harbor 레지스트리를 설정합니다.',
  sonarqube: '코드 품질 분석 도구 SonarQube 를 설치합니다.',
};

function AppCatalogSection({
  vms,
  onStartDeployment,
}: {
  vms: Vm[];
  onStartDeployment: (tool: CiTool, targetHost: string) => Promise<void>;
}) {
  const [selectedVmByTool, setSelectedVmByTool] = useState<Record<CiTool, string>>({
    jenkins: '',
    nexus: '',
    harbor: '',
    sonarqube: '',
  });
  const [loadingTool, setLoadingTool] = useState<CiTool | null>(null);

  const handleDeploy = async (tool: CiTool) => {
    const vmId = selectedVmByTool[tool];
    if (!vmId) return;
    const vm = vms.find((v) => v.id === vmId);
    if (!vm) return;
    try {
      setLoadingTool(tool);
      await onStartDeployment(tool, vm.ip);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setLoadingTool(null);
    }
  };

  const tools: CiTool[] = ['jenkins', 'nexus', 'harbor', 'sonarqube'];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
        gap: '0.9rem',
      }}
    >
      {tools.map((tool) => (
        <Card
          key={tool}
          title={TOOL_LABEL[tool]}
          description={TOOL_DESCRIPTION[tool]}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.8rem' }}>
              <span style={{ display: 'block', marginBottom: '0.1rem' }}>대상 VM 선택</span>
              <select
                value={selectedVmByTool[tool]}
                onChange={(e) =>
                  setSelectedVmByTool((prev) => ({
                    ...prev,
                    [tool]: e.target.value,
                  }))
                }
                style={{
                  width: '100%',
                  borderRadius: '0.5rem',
                  border: '1px solid rgba(148,163,184,0.8)',
                  padding: '0.45rem 0.6rem',
                  fontSize: '0.8rem',
                }}
              >
                <option value="">
                  {vms.length === 0 ? '먼저 VM 을 등록해 주세요' : 'VM 을 선택하세요'}
                </option>
                {vms.map((vm) => (
                  <option key={vm.id} value={vm.id}>
                    {vm.name || vm.ip} ({vm.ip})
                  </option>
                ))}
              </select>
            </label>
            <Button
              onClick={() => handleDeploy(tool)}
              disabled={!selectedVmByTool[tool] || loadingTool === tool}
            >
              {loadingTool === tool ? '배포 중…' : '배포 실행'}
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}

// === 배포 이력 섹션 ===

function JobHistorySection({
  jobs,
  loading,
  onSelectJob,
}: {
  jobs: Job[];
  loading: boolean;
  onSelectJob: (job: Job) => void;
}) {
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

// === 대시보드 홈 섹션 ===

function DashboardHomeSection({ vms, jobs }: { vms: Vm[]; jobs: Job[] }) {
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
                  {TOOL_LABEL[lastJob.tool]} · {lastJob.targetHost}
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

// === 배포 스텝퍼 + 로그 패널 (하단 고정) ===

function DeploymentPanel({
  job,
  logs,
  onClose,
}: {
  job: Job | null;
  logs: string[];
  onClose: () => void;
}) {
  if (!job) return null;

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
            준비 - 실행 - 완료 단계에 따라 상태가 자동으로 반영됩니다. 아래 검은색 터미널
            창에서 실시간 로그를 확인할 수 있습니다.
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#020617',
            color: '#bbf7d0',
            fontFamily:
              'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            fontSize: '0.75rem',
            maxHeight: '260px',
            overflow: 'auto',
            padding: '0.55rem 0.75rem',
          }}
        >
          {logs.length === 0 ? (
            <div style={{ color: '#6b7280' }}>로그를 불러오는 중입니다...</div>
          ) : (
            logs.map((line, idx) => <div key={idx}>{line}</div>)
          )}
        </div>
      </div>
    </div>
  );
}

// === 루트 App ===

const App: React.FC = () => {
  const [view, setView] = useState<View>('dashboard');
  const [vms, setVms] = useState<Vm[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [loadingVms, setLoadingVms] = useState(false);

  const [activeJob, setActiveJob] = useState<Job | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  // 초기 데이터 로딩
  useEffect(() => {
    const load = async () => {
      try {
        setLoadingJobs(true);
        setLoadingVms(true);
        const [jobsData, vmsData] = await Promise.allSettled([
          fetchJobs(),
          fetchVms(),
        ]);
        if (jobsData.status === 'fulfilled') {
          setJobs(jobsData.value);
        }
        if (vmsData.status === 'fulfilled') {
          setVms(vmsData.value);
        }
      } finally {
        setLoadingJobs(false);
        setLoadingVms(false);
      }
    };
    load();
  }, []);

  // 로그 SSE 구독
  useEffect(() => {
    if (!activeJob) return;
    setLogs([]);
    const unsubscribe = subscribeJobLogs(activeJob.id, (line) =>
      setLogs((prev) => [...prev, line]),
    );
    return unsubscribe;
  }, [activeJob?.id]);

  const reloadJobs = async () => {
    try {
      setLoadingJobs(true);
      const data = await fetchJobs();
      setJobs(data);
    } finally {
      setLoadingJobs(false);
    }
  };

  const reloadVms = async () => {
    try {
      setLoadingVms(true);
      const data = await fetchVms();
      setVms(data);
    } finally {
      setLoadingVms(false);
    }
  };

  const handleCreateVm = async (payload: {
    ip: string;
    initialPassword: string;
    name: string;
    username: string;
  }) => {
    const vm = await createVm(payload);
    setVms((prev) => [vm, ...prev]);
  };

  const handleStartDeployment = async (tool: CiTool, targetHost: string) => {
    const job = await createJob(tool, targetHost);
    setJobs((prev) => [job, ...prev]);
    setActiveJob(job);
  };

  const handleSelectJobForLogs = (job: Job) => {
    setActiveJob(job);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(circle at top left, #eff6ff, #f9fafb 55%, #f1f5f9)',
        color: '#0f172a',
        padding: '1.5rem 1.25rem 3.5rem',
      }}
    >
      <div
        style={{
          maxWidth: '1120px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
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
                fontSize: '1.6rem',
                fontWeight: 700,
                letterSpacing: '-0.03em',
              }}
            >
              Unda 내부 개발자 플랫폼
            </h1>
            <p
              style={{
                fontSize: '0.85rem',
                color: '#6b7280',
                marginTop: '0.25rem',
              }}
            >
              Jenkins · Nexus · Harbor · SonarQube 를 VM 위에 자동 프로비저닝하는 대시보드입니다.
            </p>
          </div>
          <TopBar activeView={view} onChangeView={setView} />
        </header>

        {view === 'dashboard' && <DashboardHomeSection vms={vms} jobs={jobs} />}

        {view === 'vms' && (
          <VmManagementSection
            vms={vms}
            loading={loadingVms}
            onReload={reloadVms}
            onCreateVm={handleCreateVm}
          />
        )}

        {view === 'catalog' && (
          <AppCatalogSection vms={vms} onStartDeployment={handleStartDeployment} />
        )}

        {view === 'history' && (
          <JobHistorySection
            jobs={jobs}
            loading={loadingJobs}
            onSelectJob={handleSelectJobForLogs}
          />
        )}
      </div>

      <DeploymentPanel job={activeJob} logs={logs} onClose={() => setActiveJob(null)} />
    </div>
  );
};

export default App;

