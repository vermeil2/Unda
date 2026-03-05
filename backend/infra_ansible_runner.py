from __future__ import annotations

import json
import os
import subprocess
from pathlib import Path
from typing import Any, Callable, Dict, Optional

from .config import settings


LogCallback = Callable[[str], None]


def run_playbook(
    playbook_name: str,
    inventory_host: str,
    extra_vars: Dict[str, Any],
    log_callback: Optional[LogCallback] = None,
) -> int:
    """
    ansible-runner 대신 초기에는 ansible-playbook CLI를 서브프로세스로 호출한다.

    - project_root를 작업 디렉터리로 사용한다.
    - inventory는 settings.ansible_inventory_path를 그대로 사용한다.
    - extra_vars는 JSON 문자열로 전달한다.
    """

    playbook_path: Path = settings.ansible_playbooks_dir / playbook_name
    if not playbook_path.exists():
        raise FileNotFoundError(f"Playbook not found: {playbook_path}")

    cmd = [
        "ansible-playbook",
        "-i",
        str(settings.ansible_inventory_path),
        str(playbook_path),
        "--limit",
        inventory_host,
        "--extra-vars",
        json.dumps(extra_vars),
    ]

    # ansible.cfg 는 ansible/ 디렉터리 아래에 있기 때문에,
    # 해당 경로를 ANSIBLE_CONFIG 로 지정하고 cwd 를 ansible_root 로 맞춰준다.
    env = os.environ.copy()
    env["ANSIBLE_CONFIG"] = str(settings.ansible_root / "ansible.cfg")

    process = subprocess.Popen(
        cmd,
        cwd=str(settings.ansible_root),
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
        env=env,
    )

    assert process.stdout is not None
    for line in process.stdout:
        if log_callback:
            log_callback(line.rstrip("\n"))

    return_code = process.wait()
    return return_code

