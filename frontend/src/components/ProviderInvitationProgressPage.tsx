import { useEffect, useState, type FormEvent } from 'react';
import { ApiRequestError } from '../api/apiError';
import {
  fetchProviderInvitationProgress,
  type ProviderInvitationProgress,
} from '../api/providerInvitationClient';
import { useAuth } from '../auth/AuthProvider';
import { providerInvitationTokenFromFragment } from '../domain/providerInvitationRoute';

function message(error: unknown): string {
  if (error instanceof ApiRequestError || error instanceof Error) return error.message;
  return 'Provider invitation progress could not be loaded.';
}

function actionLabel(action: string): string {
  return {
    complete_organization_check: 'Complete provider organization check',
    acknowledge_withheld_data: 'Review the limited-response boundary',
    respond_to_limited_request: 'Review the limited request',
    wait_for_owner: 'Wait for the owner’s next decision',
    request_new_invitation: 'Ask the owner for a new invitation',
    none: 'No further action on this invitation',
  }[action] ?? 'Review invitation status';
}

export function ProviderInvitationProgressPage() {
  const auth = useAuth();
  const [token, setToken] = useState('');
  const [progress, setProgress] = useState<ProviderInvitationProgress | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadProgress(value: string) {
    setLoading(true);
    setError(null);
    try {
      setProgress(await fetchProviderInvitationProgress(value));
    } catch (loadError) {
      setProgress(null);
      setError(message(loadError));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const fragmentToken = providerInvitationTokenFromFragment(window.location.hash);
    if (!fragmentToken) return;
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
    setToken(fragmentToken);
    void loadProgress(fragmentToken);
  }, []);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = token.trim();
    if (!value) {
      setError('Open the invitation link again or enter the invitation code.');
      return;
    }
    void loadProgress(value);
  }

  return (
    <main className="min-h-screen bg-[#f4f1e9] text-slate-950">
      <header className="bg-emerald-950 text-white">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
          <a className="inline-flex min-h-11 items-center rounded-lg font-black focus:outline-none focus:ring-2 focus:ring-amber-300" href="/">Grover</a>
          <p className="mt-8 text-xs font-black uppercase tracking-[0.2em] text-amber-300">Provider invitation</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">Review your connection progress</h1>
          <p className="mt-4 max-w-2xl leading-7 text-emerald-100">This page confirms your own invitation steps. It does not grant yard details, pricing, proposal, crew assignment, or permission to begin work.</p>
        </div>
      </header>
      <div className="mx-auto grid max-w-4xl gap-5 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-900/5 sm:p-8" aria-labelledby="provider-progress-title">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">Verified business email</p>
          <h2 className="mt-2 text-2xl font-black" id="provider-progress-title">Invitation status</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Signed in as <strong>{auth.verifiedEmail ?? 'an unverified account'}</strong>. The invited mailbox must match before any progress is returned.</p>
          <form className="mt-6" onSubmit={submit}>
            <label className="block" htmlFor="provider-invitation-token">
              <span className="text-sm font-bold">Invitation code</span>
              <span className="mt-1 block text-xs leading-5 text-slate-500">A link may fill this once. It is removed from the browser address immediately and is never stored by this page.</span>
              <input autoComplete="off" className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-3.5 font-mono text-sm focus:border-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-100" id="provider-invitation-token" onChange={(event) => setToken(event.target.value)} spellCheck={false} type="password" value={token} />
            </label>
            <button className="mt-4 min-h-12 rounded-xl bg-emerald-800 px-5 font-black text-white disabled:opacity-60" disabled={loading || !auth.verifiedEmail} type="submit">{loading ? 'Checking progress…' : 'Check invitation progress'}</button>
          </form>
          {error ? <div className="mt-5 rounded-xl border border-rose-300 bg-rose-50 p-4" role="alert"><strong>Progress was not loaded.</strong><p className="mt-1 text-sm leading-6">{error}</p></div> : null}
          {progress ? (
            <article className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5" aria-live="polite">
              <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-wide text-emerald-800">{progress.closed ? 'Invitation closed' : 'Current step'}</p><h3 className="mt-2 text-xl font-black">{progress.statusLabel}</h3></div><span className="rounded-full bg-white px-3 py-1 text-xs font-black uppercase tracking-wide text-slate-700">{progress.closed ? 'Closed' : 'Limited access'}</span></div>
              {progress.responseLabel ? <p className="mt-4 text-sm leading-6 text-slate-700">{progress.responseLabel}</p> : null}
              <p className="mt-4 border-t border-emerald-200 pt-4 text-sm"><strong>Safe next step:</strong> {actionLabel(progress.nextAction)}</p>
              {!progress.closed ? <ul className="mt-4 grid gap-2 text-xs text-slate-700 sm:grid-cols-3"><li>Email checked: <strong>{progress.recipientEmailChecked ? 'Yes' : 'No'}</strong></li><li>Organization checked: <strong>{progress.organizationRelationshipChecked ? 'Yes' : 'Not yet'}</strong></li><li>Limited response: <strong>{progress.opportunityResponseCapability ? 'Available' : 'Not available'}</strong></li></ul> : null}
            </article>
          ) : null}
        </section>
        <aside className="rounded-3xl bg-emerald-950 p-6 text-white lg:self-start" aria-label="Provider data boundary">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-300">Still withheld</p>
          <h2 className="mt-3 text-xl font-black">No owner approval yet</h2>
          <ul className="mt-5 space-y-3 text-sm leading-6 text-emerald-100"><li>Exact address</li><li>Yard photographs</li><li>Owner contact</li><li>Access considerations</li><li>Pricing and work authority</li></ul>
        </aside>
      </div>
    </main>
  );
}
