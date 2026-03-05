from __future__ import annotations

import asyncio
from typing import Any, Dict, Optional

import paramiko
import yaml
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from ..config import settings


router = APIRouter(tags=["ssh"])


def _load_inventory_host(host_key: str) -> Optional[Dict[str, Any]]:
  """
  Ansible inventory/hosts.yml 에서 ci_servers 그룹의 host_vars 를 읽어온다.
  """
  path = settings.ansible_inventory_path
  if not path.exists():
    return None

  raw = path.read_text(encoding="utf-8")
  data = yaml.safe_load(raw) or {}

  all_group = data.get("all", {})
  children = all_group.get("children", {})
  ci_group = children.get("ci_servers", {})
  hosts = ci_group.get("hosts", {}) or {}

  host_vars = hosts.get(host_key)
  if not isinstance(host_vars, dict):
    return None
  return host_vars


@router.websocket("/ws/ssh/{host_key}")
async def ssh_websocket(websocket: WebSocket, host_key: str) -> None:
  """
  간단한 SSH 프록시 WebSocket.

  - 프론트엔드는 텍스트 메시지를 보내면 해당 내용을 원격 SSH 세션에 그대로 전달한다.
  - 원격의 stdout/stderr 는 WebSocket 텍스트 메시지로 실시간 전달한다.
  - 현재는 라인 기반 인터페이스(엔터로 명령 전송)를 기본으로 한다.
  """
  await websocket.accept()

  host_vars = _load_inventory_host(host_key)
  if not host_vars:
    await websocket.send_text(f"[error] inventory 에서 '{host_key}' 호스트를 찾을 수 없습니다.\\n")
    await websocket.close()
    return

  hostname = str(host_vars.get("ansible_host", host_key))
  username = str(host_vars.get("ansible_user", "root"))
  key_path = host_vars.get("ansible_ssh_private_key_file")
  if not key_path:
    await websocket.send_text("[error] ansible_ssh_private_key_file 이(가) 설정되어 있지 않습니다.\\n")
    await websocket.close()
    return

  client = paramiko.SSHClient()
  client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

  try:
    pkey = paramiko.RSAKey.from_private_key_file(str(key_path))
    client.connect(
      hostname=hostname,
      username=username,
      pkey=pkey,
      look_for_keys=False,
      allow_agent=False,
      timeout=10.0,
    )
  except Exception as exc:  # noqa: BLE001
    await websocket.send_text(f"[error] SSH 접속 실패: {exc}\\n")
    await websocket.close()
    return

  chan = client.invoke_shell(term="xterm", width=120, height=30)
  chan.settimeout(0.0)

  await websocket.send_text(
    f"Connected to {username}@{hostname} via Unda SSH. Type commands and press Enter.\\n"
  )

  async def ws_to_ssh() -> None:
    try:
      while True:
        msg = await websocket.receive_text()
        if not msg:
          continue
        # 사용자가 보낸 텍스트를 그대로 전달 (개행은 프론트에서 제어)
        try:
          chan.send(msg)
        except Exception:
          break
    except WebSocketDisconnect:
      pass
    finally:
      try:
        chan.close()
      except Exception:
        pass

  async def ssh_to_ws() -> None:
    try:
      while True:
        await asyncio.sleep(0.02)
        if chan.closed or chan.exit_status_ready():
          break
        try:
          if chan.recv_ready():
            data = chan.recv(4096)
            if not data:
              break
            await websocket.send_text(data.decode("utf-8", errors="ignore"))
        except Exception:
          break
    finally:
      try:
        client.close()
      except Exception:
        pass
      await websocket.close()

  await asyncio.gather(ws_to_ssh(), ssh_to_ws())

