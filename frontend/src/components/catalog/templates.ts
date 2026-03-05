import type { CiTool, Template } from '../../types';

export const TEMPLATES: Template[] = [
  { id: 'jenkins', name: 'Install Jenkins', tool: 'jenkins', playbook: 'jenkins.yml', defaultPort: 8080 },
  { id: 'nexus', name: 'Install Nexus', tool: 'nexus', playbook: 'nexus.yml', defaultPort: 8081 },
  { id: 'harbor', name: 'Install Harbor', tool: 'harbor', playbook: 'harbor.yml', defaultPort: 443 },
  { id: 'sonarqube', name: 'Install SonarQube', tool: 'sonarqube', playbook: 'sonarqube.yml', defaultPort: 9000 },
];
