import type { ReactNode } from 'react';
import { useAuth } from './AuthProvider';

function FullScreenMessage({ children }: { children: ReactNode }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-8 sm:px-6 sm:py-12">
      <img
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-center"
        src="/brand/grover-landscape-home-hero.webp"
      />
      <span className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/75 to-emerald-950/30" />
      <span className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-slate-950/40" />
      <section className="relative grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/15 bg-slate-950/55 text-white shadow-2xl shadow-slate-950/50 backdrop-blur-md lg:grid-cols-[1.15fr_0.85fr]">
        <aside className="hidden min-h-[31rem] flex-col justify-between border-r border-white/10 p-10 text-left lg:flex">
          <p className="flex items-center gap-3 text-sm font-black uppercase tracking-[0.3em] text-emerald-200">
            <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_0_5px_rgba(52,211,153,0.16)]" />
            Grover
          </p>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-300">
              Built for better care
            </p>
            <h2 className="mt-4 max-w-lg text-5xl font-black leading-[0.98] tracking-tight">
              Beautiful properties. Better-run days.
            </h2>
            <p className="mt-5 max-w-md text-base font-medium leading-7 text-slate-200">
              Connect the plan, the people, and the proof behind every property you care for.
            </p>
            <div className="mt-7 flex items-center gap-3 text-xs font-black uppercase tracking-[0.16em] text-emerald-200">
              <span>Plan</span>
              <span aria-hidden="true" className="text-emerald-400">•</span>
              <span>Care</span>
              <span aria-hidden="true" className="text-emerald-400">•</span>
              <span>Proof</span>
            </div>
          </div>
        </aside>
        <div className="flex min-h-[27rem] flex-col justify-center p-7 text-center sm:p-10">
          <p className="mb-7 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-[0.24em] text-emerald-300 lg:hidden">
            <span aria-hidden="true" className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,0.16)]" />
            Grover
          </p>
          {children}
        </div>
      </section>
    </main>
  );
}

export function AuthGate({ children }: { children: ReactNode }) {
  const auth = useAuth();

  if (auth.loading) {
    return (
      <FullScreenMessage>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">Preparing your workspace</p>
        <h1 className="mt-4 text-2xl font-bold text-white">Bringing today into view…</h1>
        <div className="mx-auto mt-7 h-1.5 w-24 overflow-hidden rounded-full bg-white/10" role="status">
          <span className="block h-full w-2/3 animate-pulse rounded-full bg-emerald-400" />
          <span className="sr-only">Loading secure session</span>
        </div>
      </FullScreenMessage>
    );
  }

  if (auth.error) {
    return (
      <FullScreenMessage>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose-400">Authentication error</p>
        <h1 className="mt-4 text-2xl font-bold text-white">Unable to initialize sign-in</h1>
        <p className="mt-3 text-sm text-slate-300">{auth.error}</p>
        <p className="mt-3 text-xs text-slate-400">
          If the local API was still starting, wait a moment and retry without reloading the page.
        </p>
        <button
          className="mt-6 w-full rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white hover:bg-emerald-500"
          onClick={auth.retryInitialization}
          type="button"
        >
          Retry authentication
        </button>
      </FullScreenMessage>
    );
  }

  if (!auth.authenticated) {
    return (
      <FullScreenMessage>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">Your workspace is ready</p>
        <h1 className="mt-4 text-3xl font-black tracking-tight text-white">Welcome back.</h1>
        <p className="mt-3 text-sm text-slate-300">
          Sign in to see the properties, work, and next steps that matter to you.
        </p>
        <div className="mt-6 grid grid-cols-3 gap-2 text-xs font-bold text-slate-200">
          <span className="rounded-xl border border-white/10 bg-white/5 px-2 py-3">Clear plans</span>
          <span className="rounded-xl border border-white/10 bg-white/5 px-2 py-3">Field ready</span>
          <span className="rounded-xl border border-white/10 bg-white/5 px-2 py-3">Trusted proof</span>
        </div>
        <button
          className="mt-7 w-full rounded-xl bg-emerald-500 px-5 py-3 font-black text-emerald-950 shadow-lg shadow-emerald-950/30 transition hover:bg-emerald-400"
          onClick={() => void auth.signIn()}
        >
          Open my workspace
        </button>
        <p className="mt-4 text-xs text-slate-400">Secure access keeps customer and property details protected.</p>
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
