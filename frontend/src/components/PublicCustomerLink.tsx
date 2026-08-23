import type { ReactNode } from 'react';
import { WorkspaceIcon } from './WorkspaceIcon';

export function PublicCustomerLinkHeader() {
  return (
    <header className="border-b border-slate-200 bg-paper px-4 py-3 sm:px-6">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
        <div className="grover-brand text-forest">
          <svg aria-hidden="true" className="grover-brand-mark" viewBox="0 0 32 32">
            <path d="M6 25c5-1 9-5 11-11 4 2 7 6 8 11" />
            <path d="M8 24c0-8 5-14 13-17-1 8-5 14-13 17Z" />
          </svg>
          <span>Grover</span>
        </div>
        <div className="flex items-center gap-2 text-right text-xs font-bold text-slate-600">
          <WorkspaceIcon className="h-4 w-4 shrink-0 text-emerald-700" name="check" />
          <span>Secure customer link</span>
        </div>
      </div>
    </header>
  );
}

export function PublicCustomerTrustBoundary({ children }: { children: ReactNode }) {
  return (
    <footer className="rounded-2xl bg-slate-100 p-5 sm:flex sm:items-start sm:justify-between sm:gap-6">
      <div className="flex gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-800">
          <WorkspaceIcon className="h-5 w-5" name="check" />
        </span>
        <div>
          <h2 className="font-black text-forest">Customer-safe record</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">{children}</p>
        </div>
      </div>
    </footer>
  );
}
