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

