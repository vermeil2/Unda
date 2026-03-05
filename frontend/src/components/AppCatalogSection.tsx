import React, { useState } from 'react';
import type { CiTool, Job, Template, Vm } from '../types';
import { TemplateDetail } from './catalog/TemplateDetail';
import { TemplatesList } from './catalog/TemplatesList';

interface AppCatalogSectionProps {
  vms: Vm[];
  jobs: Job[];
  loadingJobs: boolean;
  onStartDeployment: (tool: CiTool, targetHost: string) => Promise<void>;
  onViewLog: (job: Job) => void;
}

export function AppCatalogSection({
  vms,
  jobs,
  loadingJobs,
  onStartDeployment,
  onViewLog,
}: AppCatalogSectionProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  if (selectedTemplate === null) {
    return (
      <TemplatesList
        jobs={jobs}
        onSelectTemplate={setSelectedTemplate}
      />
    );
  }

  return (
    <TemplateDetail
      template={selectedTemplate}
      vms={vms}
      jobs={jobs}
      loading={loadingJobs}
      onBack={() => setSelectedTemplate(null)}
      onRun={onStartDeployment}
      onViewLog={onViewLog}
    />
  );
}
