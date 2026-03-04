from enum import Enum
from pathlib import Path

from pydantic_settings import BaseSettings


class ToolName(str, Enum):
    jenkins = "jenkins"
    nexus = "nexus"
    harbor = "harbor"
    sonarqube = "sonarqube"


class Settings(BaseSettings):
    # 프로젝트 루트 (backend/main.py 기준 두 단계 위)
    project_root: Path = Path(__file__).resolve().parents[1]

    # Ansible 관련 경로
    ansible_root: Path = project_root / "ansible"
    ansible_playbooks_dir: Path = ansible_root / "playbooks"
    ansible_inventory_path: Path = ansible_root / "inventory" / "hosts.yml"

    # 로그 저장 디렉터리 (초기에는 파일 기반; 이후 DB로 옮길 수 있음)
    job_logs_dir: Path = project_root / ".data" / "job-logs"

    # Unda가 관리하는 SSH 키 저장 경로
    ssh_keys_dir: Path = project_root / ".data" / "ssh-keys"
    ssh_key_name: str = "id_unda"

    class Config:
        env_prefix = "UNDA_"


settings = Settings()

