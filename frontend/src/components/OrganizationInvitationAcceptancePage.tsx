import { useState } from 'react';
import {
  acceptOrganizationInvitation,
  type OrganizationInvitationAcceptance,
} from '../api/client';
import { useAuth } from '../auth/AuthProvider';

export function OrganizationInvitationAcceptancePage({ token }: { token: string }) {
  const auth = useAuth();
  const [accepted, setAccepted] = useState<OrganizationInvitationAcceptance | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function accept() {
    setIsAccepting(true);
    setMessage(null);
    try {
      const result = await acceptOrganizationInvitation(token);
      setAccepted(result);
      await auth.refreshAccess();
    } catch {
      setMessage(
        'This invitation is unavailable, has expired, or was sent to a different verified email. Sign in with the invited address and try again.',
      );
    } finally {
      setIsAccepting(false);
    }
  }

  return (
    <main className="flex min-h-[calc(100vh-41px)] items-center justify-center bg-slate-100 px-4 py-10">
      <section className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
          Grover Landscaping
        </p>
        <h1 className="mt-2 text-2xl font-bold text-slate-950">Organization invitation</h1>
        {accepted ? (
          <>
            <div className="mt-5 rounded-2xl bg-emerald-50 p-4 text-emerald-950">
              <p className="font-bold">Access activated</p>
              <p className="mt-2 text-sm">
                You joined {accepted.membership.organizationName} as{' '}
                {accepted.membership.role.replace(/([A-Z])/g, ' $1').trim()}.
              </p>
              <p className="mt-1 text-xs">
                Scope: {accepted.membership.scopeType}
              </p>
            </div>
            <button
              className="mt-6 min-h-12 w-full rounded-xl bg-slate-950 px-4 py-3 font-bold text-white"
              onClick={() => window.location.assign('/')}
              type="button"
            >
              Open organization workspace
            </button>
          </>
        ) : (
          <>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Accepting activates the role and access scope selected by the organization owner.
              Confirm only if you recognize the invitation.
            </p>
            <button
              className="mt-6 min-h-12 w-full rounded-xl bg-emerald-700 px-4 py-3 font-bold text-white disabled:opacity-60"
              disabled={isAccepting}
              onClick={() => void accept()}
              type="button"
            >
              {isAccepting ? 'Accepting invitation…' : 'Accept organization invitation'}
            </button>
            {message ? (
              <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900" role="alert">
                {message}
              </p>
            ) : null}
          </>
        )}
      </section>
    </main>
  );
}
