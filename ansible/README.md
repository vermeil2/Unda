# Ansible 프로비저닝 (IDP)

VM 대상으로 Jenkins, Nexus, Harbor, SonarQube를 설치하는 플레이북과 역할입니다.  
실습 자료는 `Continous-integration/` 폴더를 참고했습니다.

## 디렉터리 구조

```
ansible/
├── ansible.cfg
├── inventory/
│   ├── hosts.yml          # 대상 호스트 (수정 후 사용)
│   └── hosts.yml.sample
├── group_vars/
│   └── all.yml
├── playbooks/
│   ├── jenkins.yml
│   ├── nexus.yml
│   ├── harbor.yml
│   └── sonarqube.yml
└── roles/
    ├── jenkins/
    ├── nexus/
    ├── harbor/
    └── sonarqube/
```

## 사전 조건

- 대상 서버: AlmaLinux / RHEL 계열 (dnf 사용)
- SSH 접근 가능, sudo 권한
- Harbor / SonarQube: Docker 및 Docker Compose 필요

## 사용 방법

1. **인벤토리 설정**  
   `inventory/hosts.yml`에서 `ci_servers`에 대상 호스트를 넣습니다.

   ```yaml
   all:
     children:
       ci_servers:
         hosts:
           my-vm:
             ansible_host: 192.168.1.10
         vars:
           ansible_user: root
           # ansible_ssh_private_key_file: "{{ lookup('env', 'ANSIBLE_SSH_KEY_PATH') }}"
   ```

2. **단일 도구 설치**

   ```bash
   cd ansible
   ansible-playbook playbooks/jenkins.yml -l my-vm
   ansible-playbook playbooks/nexus.yml -l my-vm
   ansible-playbook playbooks/harbor.yml -l my-vm
   ansible-playbook playbooks/sonarqube.yml -l my-vm
   ```

3. **변수 오버라이드**  
   역할별 변수는 `roles/<이름>/defaults/main.yml`에 있습니다.  
   호스트/그룹 변수로 덮어쓸 수 있습니다.

   ```bash
   ansible-playbook playbooks/nexus.yml -e "nexus_port=8082"
   ```

## 역할 요약

| 역할      | 배포 방식        | 참고 스크립트                          |
|-----------|------------------|----------------------------------------|
| jenkins   | VM (dnf)         | Jenkins/*.sh                           |
| nexus     | VM (바이너리)    | Nexus/nexus-*.sh                       |
| harbor    | VM (Docker 기반)  | Harbor/harbor-cert.sh, *-install*.sh   |
| sonarqube | Docker Compose   | SonarQube/docker-compose.yml           |

## 보안

- SSH 키, 비밀번호는 코드에 넣지 말고 `ansible-vault` 또는 환경 변수로 전달하세요.
- Harbor 인증서는 역할에서 자체 서명 인증서를 생성하며, `harbor_domain`, `cert_dir` 등으로 제어할 수 있습니다.
