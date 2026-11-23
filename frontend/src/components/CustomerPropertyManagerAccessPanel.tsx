import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiRequestError } from '../api/apiError';
import {
  createOwnerPropertyManagerInvitation,
  fetchOwnerPropertyManagerInvitations,
  revokeOwnerPropertyManagerInvitation,
  type OwnerPropertyManagerInvitation,
} from '../api/customerPropertyManagerAccessClient';

function accessError(error: unknown): string {
  return error instanceof ApiRequestError || error instanceof Error
    ? error.message
    : 'Property manager access could not be confirmed.';
}

function dateLabel(epochSeconds: number): string {
  return new Date(epochSeconds * 1000).toLocaleString();
}

export function CustomerPropertyManagerAccessPanel({
  propertyId,
  activationId,
}: {
  propertyId: string;
  activationId: string;
}) {
  const [invitations, setInvitations] = useState<OwnerPropertyManagerInvitation[]>([]);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const invitationKey = useRef<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setInvitations(await fetchOwnerPropertyManagerInvitations(propertyId, activationId));
    } catch (loadError) {
      setInvitations([]);
      setError(accessError(loadError));
    } finally {
      setLoading(false);
    }
  }, [activationId, propertyId]);

  useEffect(() => {
    setRecipientEmail('');
    setNotice(null);
    invitationKey.current = null;
    void load();
  }, [load]);

  async function invite() {
    const email = recipientEmail.trim();
    if (!email) {
      setError('Enter the verified email your property manager will use to sign in.');
      return;
    }
    invitationKey.current ??= `customer-property-manager-${crypto.randomUUID()}`;
    setBusyId('create');
    setError(null);
    setNotice(null);
    try {
      const invitation = await createOwnerPropertyManagerInvitation(
        propertyId,
        activationId,
        email,
        invitationKey.current,
      );
      setInvitations((current) => [
        invitation,
        ...current.filter((item) => item.invitationId !== invitation.invitationId),
      ]);
      setRecipientEmail('');
      invitationKey.current = null;
      setNotice(`Invitation ready for ${invitation.recipientEmail}. Access begins only after that verified email accepts.`);
    } catch (inviteError) {
      setError(accessError(inviteError));
    } finally {
      setBusyId(null);
    }
  }

  async function revoke(invitation: OwnerPropertyManagerInvitation) {
    setBusyId(invitation.invitationId);
    setError(null);
    setNotice(null);
    try {
      const updated = await revokeOwnerPropertyManagerInvitation(
        propertyId,
        activationId,
        invitation.invitationId,
      );
      setInvitations((current) => current.map((item) => (
        item.invitationId === updated.invitationId ? updated : item
      )));
      setNotice(`Access for ${updated.recipientEmail} is revoked for this yard.`);
    } catch (revokeError) {
      setError(accessError(revokeError));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="mt-5 rounded-2xl border border-emerald-300 bg-white p-4" aria-labelledby={`property-access-${activationId}`}>
      <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-800">People with access</p>
      <h6 className="mt-2 font-black text-emerald-950" id={`property-access-${activationId}`}>
        Share this yard with a property manager
      </h6>
      <p className="mt-2 text-sm leading-6 text-slate-700">
        The invitation is limited to this yard. It does not share another property, billing authority, provider controls, or your account-owner role.
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="min-w-0 flex-1 text-sm font-bold text-slate-800">
          Property manager’s verified email
          <input
            autoComplete="email"
            className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 font-normal text-slate-950"
            disabled={busyId !== null}
            onChange={(event) => {
              setRecipientEmail(event.target.value);
              invitationKey.current = null;
            }}
            placeholder="manager@example.com"
            type="email"
            value={recipientEmail}
          />
        </label>
        <button
          className="min-h-12 rounded-xl bg-emerald-800 px-5 font-black text-white disabled:opacity-60"
          disabled={busyId !== null}
          onClick={() => void invite()}
          type="button"
        >
          {busyId === 'create' ? 'Inviting…' : 'Invite to this yard'}
        </button>
      </div>
      {error ? <p className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-900" role="alert">{error}</p> : null}
      {notice ? <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-950" role="status">{notice}</p> : null}
      {loading ? <p className="mt-4 text-sm text-slate-600" role="status">Checking property access…</p> : invitations.length === 0 ? (
        <p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">Only your account-owner access is active.</p>
      ) : (
        <ul className="mt-4 grid gap-3" aria-label="Property manager access invitations">
          {invitations.map((invitation) => (
            <li className="rounded-xl border border-slate-200 bg-slate-50 p-4" key={invitation.invitationId}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <strong className="break-all text-sm text-slate-950">{invitation.recipientEmail}</strong>
                  <p className="mt-1 text-xs text-slate-600">
                    {invitation.status === 'pending'
                      ? `Pending acceptance · expires ${dateLabel(invitation.expiresAtEpochSeconds)}`
                      : invitation.status === 'accepted'
                        ? `Active for this yard · accepted ${dateLabel(invitation.acceptedAtEpochSeconds ?? invitation.createdAtEpochSeconds)}`
                        : invitation.status === 'revoked'
                          ? 'Access revoked'
                          : 'Invitation expired'}
                  </p>
                </div>
                {invitation.status === 'pending' || invitation.status === 'accepted' ? (
                  <button
                    className="min-h-11 rounded-lg border border-red-300 bg-white px-4 text-sm font-black text-red-800 disabled:opacity-60"
                    disabled={busyId !== null}
                    onClick={() => void revoke(invitation)}
                    type="button"
                  >
                    {busyId === invitation.invitationId ? 'Revoking…' : invitation.status === 'accepted' ? 'Revoke access' : 'Cancel invitation'}
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
