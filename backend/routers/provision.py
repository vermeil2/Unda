from __future__ import annotations

from fastapi import APIRouter, BackgroundTasks, HTTPException, status

from ..config import ToolName
from ..schemas import JobResponse, ProvisionRequest
from ..services import create_job, run_job


router = APIRouter(tags=["provision"])


@router.post(
    "/provision/{tool}",
    response_model=JobResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
async def provision_tool(
    tool: ToolName,
    payload: ProvisionRequest,
    background_tasks: BackgroundTasks,
) -> JobResponse:
    """
    특정 CI 도구(Jenkins, Nexus 등)를 대상 호스트에 프로비저닝하는 Job 생성.

    - 즉시 Job을 생성하고 202 Accepted와 함께 job_id를 반환한다.
    - 실제 Ansible 실행은 BackgroundTasks에서 처리한다.
    """
    job = create_job(
        tool=tool,
        target_host=payload.target_host,
        options=payload.options,
    )

    background_tasks.add_task(run_job, job.id)
    return JobResponse.from_job(job)

