import type { ReactNode, SVGProps } from 'react';

export type WorkspaceIconName = 'home' | 'route' | 'jobs' | 'job' | 'manage'
  | 'customer' | 'back' | 'forward' | 'check' | 'attention';

export function WorkspaceIcon({
  name,
  ...props
}: SVGProps<SVGSVGElement> & { name: WorkspaceIconName }) {
  const common = {
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeWidth: 1.8,
  };
  const paths: Record<WorkspaceIconName, ReactNode> = {
    home: <><path d="M3.5 10.5 12 3l8.5 7.5" /><path d="M5.5 9.5V21h13V9.5M9.5 21v-7h5v7" /></>,
    route: <><circle cx="6" cy="18" r="2.5" /><circle cx="18" cy="6" r="2.5" /><path d="M8.5 18h2.25a3 3 0 0 0 3-3v-6a3 3 0 0 1 3-3h-1.25" /></>,
    jobs: <><rect height="16" rx="2" width="14" x="5" y="5" /><path d="M9 5V3h6v2M8.5 10h7M8.5 14h7M8.5 18h4" /></>,
    job: <><circle cx="12" cy="12" r="9" /><path d="m8 12 2.5 2.5L16.5 9" /></>,
    manage: <><rect height="6" rx="1.5" width="6" x="3" y="3" /><rect height="6" rx="1.5" width="6" x="15" y="3" /><rect height="6" rx="1.5" width="6" x="3" y="15" /><rect height="6" rx="1.5" width="6" x="15" y="15" /></>,
    customer: <><path d="M4 21v-8l8-6 8 6v8" /><path d="M8 21v-5h8v5M9 7V4h6v3" /></>,
    back: <><path d="m14.5 5-7 7 7 7" /><path d="M8 12h11" /></>,
    forward: <><path d="m9.5 5 7 7-7 7" /><path d="M16 12H5" /></>,
    check: <path d="m5 12 4.5 4.5L19 7" />,
    attention: <><path d="M12 4 3.5 20h17L12 4Z" /><path d="M12 9v5M12 17.5h.01" /></>,
  };

  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" {...common} {...props}>
      {paths[name]}
    </svg>
  );
}
