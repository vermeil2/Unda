from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

import paramiko
import yaml

from .config import Settings, settings


@dataclass
class VmOnboardResult:
    inventory_host: str
    reachable: bool
    message: Optional[str] = None


def _default_key_paths(cfg: Settings) -> tuple[Path, Path]:
    private_key_path = cfg.ssh_keys_dir / cfg.ssh_key_name
    public_key_path = private_key_path.with_suffix(".pub")
    return private_key_path, public_key_path


def _ensure_default_ssh_key(cfg: Settings) -> tuple[Path, str]:
    """
    Unda가 사용할 기본 SSH 키를 생성하거나, 이미 있다면 재사용한다.
    """
    private_key_path, public_key_path = _default_key_paths(cfg)

    private_key_path.parent.mkdir(parents=True, exist_ok=True)

    if not private_key_path.exists():
        key = paramiko.RSAKey.generate(4096)
        key.write_private_key_file(str(private_key_path))

        public_key = f"{key.get_name()} {key.get_base64()} unda"
        public_key_path.write_text(public_key + "\n", encoding="utf-8")

        os.chmod(private_key_path, 0o600)
    else:
        if public_key_path.exists():
            public_key = public_key_path.read_text(encoding="utf-8").strip()
        else:
            key = paramiko.RSAKey.from_private_key_file(str(private_key_path))
            public_key = f"{key.get_name()} {key.get_base64()} unda"
            public_key_path.write_text(public_key + "\n", encoding="utf-8")

    if not public_key:
        raise RuntimeError("Failed to prepare SSH public key for Unda.")

    return private_key_path, public_key


def _exec_ssh(client: paramiko.SSHClient, command: str) -> None:
    stdin, stdout, stderr = client.exec_command(command)
    _ = stdin  # unused
    exit_status = stdout.channel.recv_exit_status()
    if exit_status != 0:
        err = stderr.read().decode("utf-8", errors="ignore")
        raise RuntimeError(f"Remote command failed ({exit_status}): {err}")


def _ensure_authorized_key(
    client: paramiko.SSHClient,
    public_key: str,
) -> None:
    """
    원격 호스트의 ~/.ssh/authorized_keys 에 Unda 공개키를 추가한다.
    """
    _exec_ssh(client, "mkdir -p ~/.ssh && chmod 700 ~/.ssh")

    sftp = client.open_sftp()
    try:
        try:
            with sftp.open(".ssh/authorized_keys", "r") as f:
                existing = f.read()
        except IOError:
            existing = ""

        # Paramiko SFTP 파일은 read() 결과가 bytes 일 수 있으므로 문자열로 정규화
        if isinstance(existing, bytes):
            existing_text = existing.decode("utf-8", errors="ignore")
        else:
            existing_text = str(existing)

        if public_key not in existing_text:
            with sftp.open(".ssh/authorized_keys", "a") as f:
                if existing_text and not existing_text.endswith("\n"):
                    f.write("\n")
                f.write(public_key + "\n")

        _exec_ssh(client, "chmod 600 ~/.ssh/authorized_keys")
    finally:
        sftp.close()


def _update_inventory(
    cfg: Settings,
    host_key: str,
    ip: str,
    username: str,
    private_key_path: Path,
) -> None:
    """
    ansible/inventory/hosts.yml 에 대상 호스트를 ci_servers 그룹의 호스트로 추가/업데이트한다.
    """
    path = cfg.ansible_inventory_path

    if path.exists():
        raw = path.read_text(encoding="utf-8")
        data = yaml.safe_load(raw) or {}
    else:
        data = {}

    all_group = data.setdefault("all", {})
    children = all_group.setdefault("children", {})
    ci_group = children.setdefault("ci_servers", {})
    hosts = ci_group.setdefault("hosts", {})

    host_vars = hosts.setdefault(host_key, {})
    host_vars.update(
        {
            "ansible_host": ip,
            "ansible_user": username,
            "ansible_ssh_private_key_file": str(private_key_path),
        }
    )

    path.parent.mkdir(parents=True, exist_ok=True)
    dumped = yaml.safe_dump(data, sort_keys=False, allow_unicode=True)
    path.write_text(dumped, encoding="utf-8")


def onboard_vm(
    *,
    ip: str,
    username: str,
    initial_password: str,
    port: int = 22,
    host_alias: Optional[str] = None,
) -> VmOnboardResult:
    """
    - 초기 비밀번호로 SSH 접속을 시도해 연결 가능 여부를 확인한다.
    - 성공 시 Unda 관리 SSH 키를 원격 authorized_keys 에 추가한다.
    - 이후 Ansible inventory/hosts.yml 에 호스트를 등록한다.

    초기 비밀번호는 이 함수 내부에서만 사용되며, 어떤 저장소에도 남기지 않는다.
    """
    private_key_path, public_key = _ensure_default_ssh_key(settings)

    inventory_host = host_alias or ip

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    try:
        client.connect(
            hostname=ip,
            port=port,
            username=username,
            password=initial_password,
            look_for_keys=False,
            allow_agent=False,
            timeout=10.0,
        )
    except Exception as exc:  # noqa: BLE001
        return VmOnboardResult(
            inventory_host=inventory_host,
            reachable=False,
            message=f"SSH 접속에 실패했습니다: {exc}",
        )

    try:
        _ensure_authorized_key(client, public_key)
    finally:
        client.close()

    # 키 기반 접속 테스트 (옵션이지만, 여기서는 성공 여부를 위해 수행)
    key = paramiko.RSAKey.from_private_key_file(str(private_key_path))
    client2 = paramiko.SSHClient()
    client2.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    try:
        client2.connect(
            hostname=ip,
            port=port,
            username=username,
            pkey=key,
            look_for_keys=False,
            allow_agent=False,
            timeout=10.0,
        )
    except Exception as exc:  # noqa: BLE001
        return VmOnboardResult(
            inventory_host=inventory_host,
            reachable=False,
            message=f"키 기반 SSH 접속에 실패했습니다: {exc}",
        )
    finally:
        client2.close()

    # Ansible 인벤토리 업데이트
    _update_inventory(
        settings,
        host_key=inventory_host,
        ip=ip,
        username=username,
        private_key_path=private_key_path,
    )

    return VmOnboardResult(
        inventory_host=inventory_host,
        reachable=True,
        message="SSH 연결 및 키 설정, Ansible 인벤토리 등록이 완료되었습니다.",
    )

