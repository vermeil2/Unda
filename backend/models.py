from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Dict, Optional
from uuid import UUID, uuid4

from .config import ToolName


class JobStatus(str, Enum):
    pending = "PENDING"
    running = "RUNNING"
    success = "SUCCESS"
    failed = "FAILED"


@dataclass
class Job:
    """
    프로비저닝 실행 단위.

    초기 구현에서는 인메모리 저장소를 사용하지만,
    필드는 그대로 두고 나중에 SQLAlchemy/DB 모델로 교체할 수 있게 설계한다.
    """

    tool: ToolName
    target_host: str
    extra_vars: Dict[str, Any] = field(default_factory=dict)

    id: UUID = field(default_factory=uuid4)
    status: JobStatus = JobStatus.pending
    requested_at: datetime = field(default_factory=datetime.utcnow)
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None
    error_summary: Optional[str] = None
    log_path: Optional[str] = None


class InMemoryJobRepository:
    """
    간단한 인메모리 Job 저장소.

    - 프로토타입/개발 초기에만 사용한다.
    - 나중에 DB로 교체할 때는 이 인터페이스를 기준으로 리팩터링한다.
    """

    def __init__(self) -> None:
        self._jobs: Dict[UUID, Job] = {}

    def add(self, job: Job) -> Job:
        self._jobs[job.id] = job
        return job

    def get(self, job_id: UUID) -> Optional[Job]:
        return self._jobs.get(job_id)

    def update(self, job: Job) -> Job:
        self._jobs[job.id] = job
        return job


job_repository = InMemoryJobRepository()

