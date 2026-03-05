from __future__ import annotations

import asyncio
import json
from pathlib import Path
from uuid import UUID

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from ..models import JobStatus, job_repository
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


def _read_new_lines(path: Path, position: int) -> tuple[list[str], int]:
    """Read new lines from file from given position. Returns (lines, new_position)."""
    if not path.exists():
        return [], position
    try:
        with path.open("r", encoding="utf-8", errors="replace") as f:
            f.seek(position)
            new_content = f.read()
            new_position = f.tell()
    except OSError:
        return [], position
    if not new_content:
        return [], new_position
    lines = new_content.splitlines()
    return lines, new_position


async def _stream_job_logs(job_id: UUID):
    """Async generator: tail job log file and yield SSE events until job is done."""
    wait_for_file_sec = 30
    poll_interval_sec = 0.35

    job = job_repository.get(job_id)
    if not job or not job.log_path:
        yield f"event: error\ndata: {json.dumps({'message': 'Job or logs not found'})}\n\n"
        return

    path = Path(job.log_path)
    position = 0
    waited = 0.0

    while not path.exists():
        await asyncio.sleep(0.2)
        waited += 0.2
        if waited >= wait_for_file_sec:
            yield f"event: error\ndata: {json.dumps({'message': 'Log file did not appear'})}\n\n"
            return
        job = job_repository.get(job_id)
        if job and job.status not in (JobStatus.pending, JobStatus.running):
            break

    while True:
        job = job_repository.get(job_id)
        if not job:
            break

        lines, position = _read_new_lines(path, position)
        for line in lines:
            yield f"event: log\ndata: {json.dumps({'content': line})}\n\n"

        if job.status not in (JobStatus.pending, JobStatus.running):
            lines, _ = _read_new_lines(path, position)
            for line in lines:
                yield f"event: log\ndata: {json.dumps({'content': line})}\n\n"
            # job.status는 str 기반 Enum이므로 .value를 사용해 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED' 문자열만 보낸다.
            yield f"event: done\ndata: {json.dumps({'status': job.status.value})}\n\n"
            break

        await asyncio.sleep(poll_interval_sec)


@router.get("/jobs/{job_id}/logs/stream")
async def stream_job_logs(job_id: UUID):
    """
    Server-Sent Events 스트림으로 Ansible 로그를 실시간 전달.

    - Job이 실행 중이면 로그 파일을 tail하여 새 줄을 계속 전송한다.
    - 이벤트: `log` (data.content에 한 줄), `done` (종료), `error` (오류).
    """
    job = job_repository.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    return StreamingResponse(
        _stream_job_logs(job_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )

