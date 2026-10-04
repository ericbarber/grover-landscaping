import { useCallback, useEffect, useState } from 'react';
import { ApiRequestError } from '../api/apiError';
import {
  acceptRecipientPropertyManagerInvitation,
  fetchRecipientPropertyManagerInvitations,
  type RecipientPropertyManagerInvitation,
} from '../api/customerPropertyManagerAccessClient';

function invitationError(error: unknown): string {
  return error instanceof ApiRequestError || error instanceof Error
    ? error.message
    : 'Property manager invitations could not be loaded.';
}

export function PropertyManagerInvitationInbox({ onAccepted }: { onAccepted: () => void }) {
  const [invitations, setInvitations] = useState<RecipientPropertyManagerInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setInvitations(await fetchRecipientPropertyManagerInvitations());
    } catch (loadError) {
      setInvitations([]);
      setError(invitationError(loadError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function accept(invitationId: string) {
    setBusyId(invitationId);
    setError(null);
    setNotice(null);
    try {
      await acceptRecipientPropertyManagerInvitation(invitationId);
      setInvitations((current) => current.map((invitation) => (
        invitation.invitationId === invitationId
          ? { ...invitation, status: 'accepted' }
          : invitation
      )));
      setNotice('Invitation accepted. Your protected portfolio is being refreshed.');
      onAccepted();
    } catch (acceptError) {
      setError(invitationError(acceptError));
    } finally {
      setBusyId(null);
    }
  }

  const pending = invitations.filter((invitation) => invitation.status === 'pending');
  if (!loading && pending.length === 0 && !error && !notice) return null;

  return (
    <section className="grover-card p-5 sm:p-6" aria-labelledby="property-manager-invitations-title">
      <p className="grover-eyebrow">Property access invitations</p>
      <h1 className="mt-2 font-display text-2xl font-black text-forest" id="property-manager-invitations-title">
        Review access before property details are shown
      </h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
        A pending invitation contains no property details here. Accept only if you recognize the Yard Owner relationship. Acceptance grants customer-safe access to one exact property and does not grant billing or provider administration.
      </p>
      {loading ? <p className="mt-4 text-sm text-slate-600" role="status">Checking invitations…</p> : null}
      {error ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4" role="alert">
          <p className="text-sm font-semibold text-red-900">{error}</p>
          <button className="mt-3 min-h-11 rounded-lg border border-red-300 bg-white px-4 font-black text-red-800" onClick={() => void load()} type="button">Retry invitations</button>
        </div>
      ) : null}
      {notice ? <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-950" role="status">{notice}</p> : null}
      {pending.length > 0 ? (
        <ul className="mt-4 grid gap-3" aria-label="Pending property access invitations">
          {pending.map((invitation) => (
            <li className="rounded-xl border border-slate-200 bg-slate-50 p-4" key={invitation.invitationId}>
              <p className="text-sm font-black text-slate-950">One-property access invitation</p>
              <p className="mt-1 text-xs leading-5 text-slate-600">
                Expires {new Date(invitation.expiresAtEpochSeconds * 1000).toLocaleString()}. Property identity and customer-safe service information become available only after acceptance.
              </p>
              <button
                className="mt-3 min-h-11 rounded-lg bg-emerald-800 px-4 font-black text-white disabled:opacity-60"
                disabled={busyId !== null}
                onClick={() => void accept(invitation.invitationId)}
                type="button"
              >
                {busyId === invitation.invitationId ? 'Accepting…' : 'Accept one-property access'}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
