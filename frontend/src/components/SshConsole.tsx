import React, { useEffect, useRef, useState } from 'react';
import type { Vm } from '../types';
import { Button, Card } from './ui';

type SshStatus = 'connecting' | 'live' | 'closed' | 'error';

interface SshConsoleProps {
  vm: Vm;
  onClose: () => void;
}

export function SshConsole({ vm, onClose }: SshConsoleProps) {
  const [lines, setLines] = useState<string[]>([]);
  const [status, setStatus] = useState<SshStatus>('connecting');
  const [input, setInput] = useState('');
  const logRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const host = window.location.hostname;
    const port = 8000; // 백엔드 포트 (dev: 8000)
    const url = `${protocol}://${host}:${port}/ws/ssh/${encodeURIComponent(vm.id)}`;

    const ws = new WebSocket(url);
    wsRef.current = ws;
    setStatus('connecting');

    ws.onopen = () => setStatus('live');
    ws.onmessage = (event) => {
      const text = String(event.data ?? '');
      setLines((prev) => [...prev, text]);
    };
    ws.onerror = () => setStatus('error');
    ws.onclose = () => {
      setStatus((prev) => (prev === 'error' ? prev : 'closed'));
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [vm.id]);

  useEffect(() => {
    if (!logRef.current) return;
    logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [lines]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    // 한 줄 명령을 보내고, 원격에서 개행 처리하도록 '\n' 포함
    ws.send(`${input}\n`);
    setInput('');
  };

  const statusLabel =
    status === 'connecting'
      ? 'SSH 연결 중...'
      : status === 'live'
        ? 'SSH 세션 활성'
        : status === 'error'
          ? 'SSH 오류 (연결 실패)'
          : '세션 종료';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        flex: 1,
        minHeight: 0,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
            SSH 터미널 · {vm.name || vm.ip}
          </h2>
          <p style={{ margin: '0.15rem 0 0', fontSize: '0.8rem', color: '#64748b' }}>
            {vm.id} ({vm.ip}) 에 직접 명령을 실행합니다. 민감 명령 실행 시 주의하세요.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          닫기
        </Button>
      </div>

      <Card>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}
        >
          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{statusLabel}</div>
          <div
            ref={logRef}
            style={{
              minHeight: '260px',
              maxHeight: '460px',
              backgroundColor: '#020617',
              color: '#e5e7eb',
              fontFamily:
                'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
              fontSize: '0.8rem',
              padding: '0.6rem 0.75rem',
              borderRadius: '0.5rem',
              overflowY: 'auto',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
            }}
          >
            {lines.length === 0 ? (
              <div style={{ color: '#6b7280' }}>
                {status === 'error'
                  ? 'SSH 연결에 실패했습니다. VM 설정 또는 네트워크를 확인하세요.'
                  : '접속 메시지 및 명령 출력이 여기에 표시됩니다.'}
              </div>
            ) : (
              lines.map((line, idx) => (
                <div key={idx} style={{ marginBottom: '0.05rem' }}>
                  {line}
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="예: sudo systemctl status nexus"
              style={{
                flex: 1,
                borderRadius: '0.5rem',
                border: '1px solid rgba(148,163,184,0.9)',
                padding: '0.45rem 0.6rem',
                fontSize: '0.8rem',
                fontFamily:
                  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                backgroundColor: 'white',
              }}
            />
            <Button type="submit" disabled={status !== 'live'}>
              실행
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}

