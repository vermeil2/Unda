# Unda IDP Backend (FastAPI)

이 디렉터리는 내부 개발자 플랫폼(IDP)의 **백엔드 API 서버**입니다.  
프론트엔드 대시보드에서 들어오는 프로비저닝 요청을 받아 Ansible 플레이북을 실행하고, Job 상태/로그를 관리합니다.

## 주요 책임

- `POST /api/v1/provision/{tool}`: Jenkins, Nexus, Harbor, SonarQube 등 설치 Job 생성
- `GET /api/v1/jobs/{job_id}`: Job 상태 조회
- `GET /api/v1/jobs/{job_id}/logs`: Ansible 실행 로그 조회

## 기술 스택

- Python 3.11+
- FastAPI
- (초기) 인메모리 Job 저장소 + 파일 기반 로그
- Ansible CLI (`ansible-playbook`) 호출

## 개발 환경 설정

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

## 서버 실행

프로젝트 루트(`Unda/`)에서:

```bash
uvicorn backend.main:app --reload
```

기본적으로:

- Ansible 플레이북: `ansible/playbooks/*.yml`
- 인벤토리: `ansible/inventory/hosts.yml`

을 사용합니다. 이는 `backend/config.py`에서 수정할 수 있습니다.

## Ansible 연동

`backend/infra_ansible_runner.py`에서 `ansible-playbook` CLI를 서브프로세스로 호출합니다.

- `ToolName`(jenkins, nexus, harbor, sonarqube)에 따라 플레이북은 `services.PROVISION_RECIPES`에서 선택
- `extra_vars`는 API 요청의 `options` + 도구별 기본값을 JSON으로 전달

나중에 필요하면 `ansible-runner`로 교체할 수 있도록 어댑터 레이어를 분리해 두었습니다.

