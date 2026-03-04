from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, Optional
from uuid import UUID

from pydantic import BaseModel, Field

from .config import ToolName
from .models import Job, JobStatus


class ProvisionRequest(BaseModel):
    target_host: str = Field(..., description="Ansible inventory에서 사용할 호스트명 또는 IP")
    options: Dict[str, Any] = Field(
        default_factory=dict,
        description="플레이북 extra_vars로 전달할 옵션(포트, 버전 등)",
    )


class VmOnboardRequest(BaseModel):
    ip: str = Field(..., description="대상 VM의 IP 또는 호스트명")
    username: str = Field(..., description="초기 SSH 접속에 사용할 계정명")
    initial_password: str = Field(
        ...,
        description="초기 SSH 접속에 사용할 비밀번호 (저장되지 않음)",
    )
    port: int = Field(22, description="SSH 포트 (기본값: 22)")
    host_alias: Optional[str] = Field(
        None,
        description="Ansible 인벤토리에서 사용할 호스트 이름(미지정 시 IP 사용)",
    )


class JobResponse(BaseModel):
    id: UUID
    tool: ToolName
    target_host: str
    status: JobStatus
    requested_at: datetime
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None
    error_summary: Optional[str] = None

    @classmethod
    def from_job(cls, job: Job) -> "JobResponse":
        return cls(
            id=job.id,
            tool=job.tool,
            target_host=job.target_host,
            status=job.status,
            requested_at=job.requested_at,
            started_at=job.started_at,
            finished_at=job.finished_at,
            error_summary=job.error_summary,
        )


class JobLogChunk(BaseModel):
    job_id: UUID
    content: str


class VmOnboardResponse(BaseModel):
    inventory_host: str = Field(
        ...,
        description="Ansible 인벤토리에서 사용될 호스트 키",
    )
    reachable: bool = Field(
        ...,
        description="SSH 접속 및 키 설정까지 성공했는지 여부",
    )
    message: Optional[str] = Field(
        None,
        description="연결/설정 과정에 대한 요약 메시지",
    )


class VmInfo(BaseModel):
    id: str = Field(..., description="VM을 구분하기 위한 호스트 키 (inventory 상 key)")
    name: str = Field(..., description="UI 에서 표시할 이름 (기본값은 id)")
    ip: str = Field(..., description="대상 VM 의 IP 또는 호스트명")
    ssh_connected: bool = Field(
        ...,
        description="SSH 연결이 성공한 것으로 간주되는지 여부(온보딩 시 기준)",
    )
    last_check: datetime = Field(
        ...,
        description="SSH 연결 상태를 마지막으로 확인한 시각",
    )

