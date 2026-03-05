import React, { useEffect, useState } from 'react';
import type { CiTool, Job, JobStatus, View, Vm } from './types';
import {
  fetchJobLogs,
  fetchJobs,
  fetchVms,
  createJob,
  createVm,
  getJobLogStreamUrl,
} from './api';
import { AppCatalogSection } from './components/AppCatalogSection';
import { DashboardHomeSection } from './components/DashboardHomeSection';
import { DeploymentConsole } from './components/DeploymentConsole';
import { JobHistorySection } from './components/JobHistorySection';
import { TopBar } from './components/TopBar';
import { VmManagementSection } from './components/VmManagementSection';
import { SshConsole } from './components/SshConsole';

const App: React.FC = () => {
  const [view, setView] = useState<View>('dashboard');
  const [vms, setVms] = useState<Vm[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [loadingVms, setLoadingVms] = useState(false);

  const [activeJob, setActiveJob] = useState<Job | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [streamStatus, setStreamStatus] = useState<
    'connecting' | 'live' | 'done' | 'error'
  >();
  const [sshVm, setSshVm] = useState<Vm | null>(null);

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

  useEffect(() => {
    if (!activeJob) {
      setStreamStatus(undefined);
      return;
    }

    setLogs([]);
    setStreamStatus('connecting');

    const url = getJobLogStreamUrl(activeJob.id);
    const es = new EventSource(url);
    const MAX_LOG_LINES = 5000;
    let doneReceived = false;

    es.addEventListener('log', (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data as string);
        const content = data?.content;
        if (typeof content === 'string') {
          setLogs((prev) => {
            const next = [...prev, content];
            return next.length > MAX_LOG_LINES ? next.slice(-MAX_LOG_LINES) : next;
          });
        }
      } catch {
        // ignore parse error
      }
    });

    es.addEventListener('done', (event: MessageEvent) => {
      doneReceived = true;
      try {
        const data = JSON.parse(event.data as string);
        if (data?.status) {
          setActiveJob((prev) =>
            prev ? { ...prev, status: data.status as JobStatus } : null
          );
        }
      } catch {
        // ignore
      }
      setStreamStatus('done');
      es.close();
      reloadJobs().catch(() => {});
    });

    es.addEventListener('error', () => {
      if (doneReceived) return;
      setStreamStatus('error');
      es.close();
    });

    es.onopen = () => setStreamStatus('live');

    return () => {
      es.close();
    };
  }, [activeJob?.id]);

  useEffect(() => {
    if (!activeJob || streamStatus !== 'error') return;
    let cancelled = false;
    const loadLogs = async () => {
      const lines = await fetchJobLogs(activeJob.id);
      if (!cancelled) setLogs(lines);
    };
    loadLogs();
    const interval = setInterval(loadLogs, 2000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [activeJob?.id, streamStatus]);

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

  const handleOpenTerminal = (vm: Vm) => {
    setSshVm(vm);
  };

  const handleCloseTerminal = () => {
    setSshVm(null);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background:
          'radial-gradient(circle at top left, #eff6ff, #f9fafb 55%, #f1f5f9)',
        color: '#0f172a',
      }}
    >
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          maxWidth: '1120px',
          width: '100%',
          margin: '0 auto',
          padding: '1.5rem 1.25rem',
          gap: '1.25rem',
        }}
      >
        <header
          style={{
            flexShrink: 0,
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

        {/* 1순위: 배포 로그 콘솔 (Jenkins 스타일) */}
        {activeJob ? (
          <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <DeploymentConsole
              job={activeJob}
              logs={logs}
              onClose={() => setActiveJob(null)}
              streamStatus={streamStatus}
            />
          </div>
        ) : sshVm ? (
          // 2순위: SSH 터미널 (선택된 VM)
          <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <SshConsole vm={sshVm} onClose={handleCloseTerminal} />
          </div>
        ) : (
          <>
            {view === 'dashboard' && <DashboardHomeSection vms={vms} jobs={jobs} />}

            {view === 'vms' && (
              <VmManagementSection
                vms={vms}
                loading={loadingVms}
                onReload={reloadVms}
                onCreateVm={handleCreateVm}
                onOpenTerminal={handleOpenTerminal}
              />
            )}

            {view === 'catalog' && (
              <AppCatalogSection
                vms={vms}
                jobs={jobs}
                loadingJobs={loadingJobs}
                onStartDeployment={handleStartDeployment}
                onViewLog={handleSelectJobForLogs}
              />
            )}

            {view === 'history' && (
              <JobHistorySection
                jobs={jobs}
                loading={loadingJobs}
                onSelectJob={handleSelectJobForLogs}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default App;

