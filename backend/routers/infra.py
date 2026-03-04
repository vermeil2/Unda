from __future__ import annotations

from fastapi import APIRouter, status

from ..config import settings
from ..infra_vm_onboarding import VmOnboardResult, onboard_vm
from ..schemas import VmInfo, VmOnboardRequest, VmOnboardResponse
import yaml


router = APIRouter(tags=["infra"])


@router.post(
    "/infra/vms/onboard",
    response_model=VmOnboardResponse,
    status_code=status.HTTP_200_OK,
)
def onboard_vm_endpoint(payload: VmOnboardRequest) -> VmOnboardResponse:
    """
    VM 접속 정보(IP, username, 초기 비밀번호)를 받아:

    - SSH 접속 가능 여부를 확인하고
    - Unda 관리 SSH 키를 authorized_keys 에 추가한 뒤
    - Ansible inventory/hosts.yml 에 호스트를 등록한다.

    초기 비밀번호는 어떤 저장소에도 남지 않는다.
    """
    result: VmOnboardResult = onboard_vm(
        ip=payload.ip,
        username=payload.username,
        initial_password=payload.initial_password,
        port=payload.port,
        host_alias=payload.host_alias,
    )

    return VmOnboardResponse(
        inventory_host=result.inventory_host,
        reachable=result.reachable,
        message=result.message,
    )


@router.get(
    "/infra/vms",
    response_model=list[VmInfo],
    status_code=status.HTTP_200_OK,
)
def list_vms() -> list[VmInfo]:
    """
    Ansible inventory/hosts.yml 에 등록된 ci_servers 그룹의 호스트를 VM 리스트로 반환한다.

    - 현재는 localhost 를 제외한 호스트만 반환한다.
    - SSH 연결 여부 및 last_check 는 온보딩 시점 기준으로 모두 True/현재시각으로 간주한다.
      (향후 별도 헬스체크 로직으로 대체 가능)
    """
    path = settings.ansible_inventory_path
    if not path.exists():
        return []

    raw = path.read_text(encoding="utf-8")
    data = yaml.safe_load(raw) or {}

    all_group = data.get("all", {})
    children = all_group.get("children", {})
    ci_group = children.get("ci_servers", {})
    hosts = ci_group.get("hosts", {}) or {}

    from datetime import datetime  # 로컬 임포트로 순환 의존성 방지

    vms: list[VmInfo] = []
    for host_key, host_vars in hosts.items():
        if host_key == "localhost":
            continue
        if not isinstance(host_vars, dict):
            host_vars = {}

        ip = str(host_vars.get("ansible_host", host_key))
        name = str(host_vars.get("name", host_key))

        vms.append(
            VmInfo(
                id=host_key,
                name=name,
                ip=ip,
                ssh_connected=True,
                last_check=datetime.utcnow(),
            )
        )

    return vms

