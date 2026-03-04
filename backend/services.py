from __future__ import annotations

from datetime import datetime
from pathlib import Path
from typing import Any, Dict
from uuid import UUID

from .config import ToolName, settings
from .infra_ansible_runner import run_playbook
from .models import Job, JobStatus, job_repository


# 도구 이름별 기본 플레이북 및 기본 extra_vars
PROVISION_RECIPES: Dict[ToolName, Dict[str, Any]] = {
    ToolName.jenkins: {
        "playbook": "jenkins.yml",
        "default_vars": {},
    },
    ToolName.nexus: {
        "playbook": "nexus.yml",
        "default_vars": {},
    },
    ToolName.harbor: {
        "playbook": "harbor.yml",
        "default_vars": {},
    },
    ToolName.sonarqube: {
        "playbook": "sonarqube.yml",
        "default_vars": {},
    },
}


def create_job(tool: ToolName, target_host: str, options: Dict[str, Any]) -> Job:
    recipe = PROVISION_RECIPES[tool]
    extra_vars = {**recipe.get("default_vars", {}), **(options or {})}
    job = Job(tool=tool, target_host=target_host, extra_vars=extra_vars)
    # 로그 파일 경로 미리 할당
    settings.job_logs_dir.mkdir(parents=True, exist_ok=True)
    job.log_path = str(settings.job_logs_dir / f"{job.id}.log")
    job_repository.add(job)
    return job


def run_job(job_id: UUID) -> None:
    job = job_repository.get(job_id)
    if not job:
        return

    job.status = JobStatus.running
    job.started_at = datetime.utcnow()
    job_repository.update(job)

    assert job.log_path is not None
    log_file = Path(job.log_path)

    def _append_log(line: str) -> None:
        log_file.parent.mkdir(parents=True, exist_ok=True)
        with log_file.open("a", encoding="utf-8") as f:
            f.write(line + "\n")

    recipe = PROVISION_RECIPES[job.tool]
    playbook = recipe["playbook"]
    return_code = run_playbook(
        playbook_name=playbook,
        inventory_host=job.target_host,
        extra_vars=job.extra_vars,
        log_callback=_append_log,
    )

    job.finished_at = datetime.utcnow()
    if return_code == 0:
        job.status = JobStatus.success
    else:
        job.status = JobStatus.failed
        job.error_summary = f"Ansible playbook exited with code {return_code}"

    job_repository.update(job)

