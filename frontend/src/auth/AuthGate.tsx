import type { ReactNode } from 'react';
import { useAuth } from './AuthProvider';

function FullScreenMessage({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-12">
      <section className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-8 text-center shadow-2xl">
        {children}
      </section>
    </main>
  );
}

export function AuthGate({ children }: { children: ReactNode }) {
  const auth = useAuth();

  if (auth.loading) {
    return (
      <FullScreenMessage>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">Grover Landscaping</p>
        <h1 className="mt-4 text-2xl font-bold text-white">Loading secure session…</h1>
      </FullScreenMessage>
    );
  }

  if (auth.error) {
    return (
      <FullScreenMessage>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose-400">Authentication error</p>
        <h1 className="mt-4 text-2xl font-bold text-white">Unable to initialize sign-in</h1>
        <p className="mt-3 text-sm text-slate-300">{auth.error}</p>
      </FullScreenMessage>
    );
  }

  if (!auth.authenticated) {
    return (
      <FullScreenMessage>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">Grover Landscaping</p>
        <h1 className="mt-4 text-3xl font-bold text-white">Sign in to continue</h1>
        <p className="mt-3 text-sm text-slate-300">
          Crew routes, customer information, and manager tools require an authorized account.
        </p>
        <button
          className="mt-7 w-full rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white hover:bg-emerald-500"
          onClick={() => void auth.signIn()}
        >
          Sign in securely
        </button>
      </FullScreenMessage>
    );
  }

  return (
    <>
      <aside className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-900 bg-slate-950 px-4 py-2 text-sm text-slate-200">
        <div>
          <span className="font-semibold text-white">{auth.displayName}</span>
          <span className="ml-2 text-xs text-slate-400">{auth.roles.join(', ') || 'No assigned role'}</span>
          {auth.authMode === 'disabled' ? (
            <span className="ml-2 rounded bg-amber-300 px-2 py-0.5 text-xs font-bold text-amber-950">
              AUTH DISABLED
            </span>
          ) : null}
        </div>
        {auth.authMode === 'cognito' ? (
          <button
            className="rounded-lg border border-slate-600 px-3 py-1.5 font-semibold hover:border-slate-400"
            onClick={() => void auth.signOut()}
          >
            Sign out
          </button>
        ) : null}
      </aside>
      {children}
    </>
  );
}
