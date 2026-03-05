export type View = 'dashboard' | 'vms' | 'catalog' | 'history';

export type CiTool = 'jenkins' | 'nexus' | 'harbor' | 'sonarqube';

/** Semaphore 스타일 Task Template (도구별 설치 작업 정의) */
export interface Template {
  id: CiTool;
  name: string;
  tool: CiTool;
  playbook: string;
  defaultPort: number;
}

export type JobStatus = 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED';

export interface Job {
  id: string;
  tool: CiTool;
  targetHost: string;
  createdAt: string;
  updatedAt: string;
  status: JobStatus;
  message?: string;
}

export interface Vm {
  id: string;
  name: string;
  ip: string;
  sshConnected: boolean;
  lastCheck: string;
}

