import type { YardCareJob } from '../domain/jobs';
import { WorkspaceStatusBadge } from './WorkspaceStatus';

export function JobStatusBadge({ status }: { status: YardCareJob['status'] }) {
  const label = status.replace('_', ' ');
  const tone = status === 'completed'
    ? 'success'
    : status === 'in_progress'
      ? 'warning'
      : 'info';

  return (
    <WorkspaceStatusBadge className="uppercase tracking-wide" tone={tone}>
      {label}
    </WorkspaceStatusBadge>
  );
}
