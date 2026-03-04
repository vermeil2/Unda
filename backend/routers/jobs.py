from __future__ import annotations

from pathlib import Path
from uuid import UUID

from fastapi import APIRouter, HTTPException

from ..models import job_repository
from ..schemas import JobLogChunk, JobResponse


router = APIRouter(tags=["jobs"])


@router.get("/jobs", response_model=list[JobResponse])
async def list_jobs() -> list[JobResponse]:
    # InMemory 저장소이므로 values()를 그대로 순회한다.
    return [JobResponse.from_job(job) for job in job_repository._jobs.values()]  # type: ignore[attr-defined]


@router.get("/jobs/{job_id}", response_model=JobResponse)
async def get_job(job_id: UUID) -> JobResponse:
    job = job_repository.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return JobResponse.from_job(job)


@router.get("/jobs/{job_id}/logs", response_model=JobLogChunk)
async def get_job_logs(job_id: UUID) -> JobLogChunk:
    job = job_repository.get(job_id)
    if not job or not job.log_path:
        raise HTTPException(status_code=404, detail="Job or logs not found")

    path = Path(job.log_path)
    if not path.exists():
        content = ""
    else:
        content = path.read_text(encoding="utf-8")

    return JobLogChunk(job_id=job_id, content=content)

