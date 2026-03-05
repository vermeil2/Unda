import React, { useState } from 'react';
import type { Vm } from '../types';
import { Button, Card } from './ui';

interface VmManagementSectionProps {
  vms: Vm[];
  loading: boolean;
  onReload: () => void;
  onCreateVm: (payload: {
    ip: string;
    initialPassword: string;
    name: string;
    username: string;
  }) => Promise<void>;
  onOpenTerminal: (vm: Vm) => void;
}

export function VmManagementSection({
  vms,
  loading,
  onReload,
  onCreateVm,
  onOpenTerminal,
}: VmManagementSectionProps) {
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
              총 {vms.length}대 · SSH OK {vms.filter((v) => v.sshConnected).length}대
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
                  <div style={{ fontWeight: 600 }}>{vm.name || vm.ip}</div>
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
                    gap: '0.25rem',
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
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={() => onOpenTerminal(vm)}
                    disabled={!vm.sshConnected}
                  >
                    터미널 열기
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

