import type { ReactNode } from 'react';
import { WorkspaceIcon } from './WorkspaceIcon';
import type { WorkspaceIconName } from './WorkspaceIcon';

export type WorkspaceStatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

const noticeToneClasses: Record<WorkspaceStatusTone, string> = {
  neutral: 'border-slate-200 bg-slate-50 text-slate-800',
  info: 'border-sky-200 bg-sky-50 text-sky-950',
  success: 'border-emerald-300 bg-emerald-50 text-emerald-950',
  warning: 'border-amber-300 bg-amber-50 text-amber-950',
  danger: 'border-rose-300 bg-rose-50 text-rose-950',
};

const badgeToneClasses: Record<WorkspaceStatusTone, string> = {
  neutral: 'border-slate-200 bg-slate-100 text-slate-700',
  info: 'border-sky-200 bg-sky-100 text-sky-900',
  success: 'border-emerald-200 bg-emerald-100 text-emerald-900',
  warning: 'border-amber-200 bg-amber-100 text-amber-950',
  danger: 'border-rose-200 bg-rose-100 text-rose-950',
};

const iconToneClasses: Record<WorkspaceStatusTone, string> = {
  neutral: 'bg-slate-200 text-slate-800',
  info: 'bg-sky-200 text-sky-950',
  success: 'bg-emerald-200 text-emerald-950',
  warning: 'bg-amber-200 text-amber-950',
  danger: 'bg-rose-200 text-rose-950',
};

const toneIcons: Record<WorkspaceStatusTone, WorkspaceIconName> = {
  neutral: 'info',
  info: 'info',
  success: 'check',
  warning: 'attention',
  danger: 'attention',
};

export function workspaceStatusRole(tone: WorkspaceStatusTone): 'alert' | 'status' {
  return tone === 'danger' ? 'alert' : 'status';
}

export function WorkspaceStatusBadge({
  children,
  className = '',
  tone = 'neutral',
}: {
  children: ReactNode;
  className?: string;
  tone?: WorkspaceStatusTone;
}) {
  return (
    <span className={`inline-flex min-h-6 items-center gap-1.5 rounded-full border px-2 py-1 text-xs font-bold ${badgeToneClasses[tone]} ${className}`}>
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}

export function WorkspaceStatusNotice({
  children,
  className = '',
  compact = false,
  detail,
  role,
  title,
  tone = 'neutral',
}: {
  children?: ReactNode;
  className?: string;
  compact?: boolean;
  detail?: ReactNode;
  role?: 'alert' | 'status';
  title?: ReactNode;
  tone?: WorkspaceStatusTone;
}) {
  const hasHeading = Boolean(title || detail);

  return (
    <div
      className={`rounded-xl border ${compact ? 'p-3' : 'p-4'} ${noticeToneClasses[tone]} ${className}`}
      role={role ?? workspaceStatusRole(tone)}
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className={`grid shrink-0 place-items-center rounded-full ${compact ? 'h-7 w-7' : 'h-8 w-8'} ${iconToneClasses[tone]}`}
        >
          <WorkspaceIcon className={compact ? 'size-4' : 'size-5'} name={toneIcons[tone]} />
        </span>
        <div className="min-w-0 flex-1">
          {title ? <p className="text-sm font-black text-current">{title}</p> : null}
          {detail ? <p className={`${title ? 'mt-1' : ''} text-xs leading-5 opacity-80`}>{detail}</p> : null}
          {children ? <div className={hasHeading ? 'mt-3' : ''}>{children}</div> : null}
        </div>
      </div>
    </div>
  );
}
