import { CiTool, Job, Vm } from './types';

export async function fetchJobs(): Promise<Job[]> {
  const res = await fetch('/api/v1/jobs');
  if (!res.ok) {
    throw new Error('작업 목록을 불러오지 못했습니다.');
  }
  const data = await res.json();
  return (data as any[]).map((j) => ({
    id: j.id,
    tool: j.tool,
    targetHost: j.target_host,
    createdAt: j.requested_at,
    updatedAt: j.finished_at ?? j.started_at ?? j.requested_at,
    status: j.status,
    message: j.error_summary ?? '',
  }));
}

export async function createJob(tool: CiTool, targetHost: string): Promise<Job> {
  const res = await fetch(`/api/v1/provision/${tool}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ target_host: targetHost, options: {} }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || '작업 생성에 실패했습니다.');
  }
  const j = await res.json();
  return {
    id: j.id,
    tool: j.tool,
    targetHost: j.target_host,
    createdAt: j.requested_at,
    updatedAt: j.finished_at ?? j.started_at ?? j.requested_at,
    status: j.status,
    message: j.error_summary ?? '',
  };
}

export async function fetchVms(): Promise<Vm[]> {
  const res = await fetch('/api/v1/infra/vms');
  if (!res.ok) {
    throw new Error('VM 목록을 불러오지 못했습니다.');
  }

  const data = await res.json();
  return (data as any[]).map((v) => ({
    id: v.id,
    name: v.name ?? v.ip,
    ip: v.ip,
    sshConnected: v.ssh_connected,
    lastCheck: v.last_check,
  }));
}

export async function createVm(_: {
  ip: string;
  initialPassword: string;
  name: string;
  username: string;
}): Promise<Vm> {
  const res = await fetch('/api/v1/infra/vms/onboard', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ip: _.ip,
      username: _.username,
      initial_password: _.initialPassword,
      host_alias: _.name || _.ip,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'VM 온보딩에 실패했습니다.');
  }

  const data = await res.json();

  if (!data.reachable) {
    throw new Error(data.message || 'SSH 연결에 실패했습니다.');
  }

  const now = new Date().toISOString();

  return {
    id: data.inventory_host,
    name: _.name || data.inventory_host,
    ip: _.ip,
    sshConnected: true,
    lastCheck: now,
  };
}

export async function fetchJobLogs(jobId: string): Promise<string[]> {
  const res = await fetch(`/api/v1/jobs/${jobId}/logs`);
  if (!res.ok) {
    return [];
  }
  const data = await res.json();
  const content: string = data.content ?? '';
  return content.split('\n').filter((line) => line.trim().length > 0);
}

export function getJobLogStreamUrl(jobId: string): string {
  const base = typeof window !== 'undefined' ? window.location.origin : '';
  return `${base}/api/v1/jobs/${jobId}/logs/stream`;
}

