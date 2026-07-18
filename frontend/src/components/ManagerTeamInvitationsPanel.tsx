import { useState } from 'react';
import {
  createOrganizationInvitation,
  type OrganizationInvitation,
  type OrganizationInvitationRole,
} from '../api/client';

const roles: Array<{ value: OrganizationInvitationRole; label: string }> = [
  { value: 'manager', label: 'Manager' },
  { value: 'crew_lead', label: 'Crew lead' },
  { value: 'crew_member', label: 'Crew member' },
  { value: 'property_manager', label: 'Property manager' },
  { value: 'property_owner', label: 'Property owner' },
  { value: 'organization_owner', label: 'Organization owner' },
];

export function validateTeamInvitation(email: string): string | null {
  const normalized = email.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return 'Enter a valid email address.';
  }
  if (normalized.length > 320) return 'Email address cannot exceed 320 characters.';
  return null;
}

export function ManagerTeamInvitationsPanel({
  organizationId,
}: {
  organizationId: string;
}) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<OrganizationInvitationRole>('crew_member');
  const [invitation, setInvitation] = useState<OrganizationInvitation | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  async function sendInvitation() {
    const validationMessage = validateTeamInvitation(email);
    if (validationMessage) {
      setMessage(validationMessage);
      return;
    }
    setIsSending(true);
    setMessage(null);
    try {
      const created = await createOrganizationInvitation(organizationId, email.trim(), role);
      setInvitation(created);
      setEmail('');
      setMessage(
        created.persisted
          ? `Invitation queued for ${created.inviteeEmail}.`
          : `Local invitation created for ${created.inviteeEmail}.`,
      );
    } catch {
      setMessage('The invitation could not be created. Confirm owner access and try again.');
    } finally {
      setIsSending(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
        Team administration
      </p>
      <h2 className="mt-1 text-xl font-bold text-slate-950">Invite a team member</h2>
      <p className="mt-1 text-sm text-slate-600">
        Access stays inside this organization and starts only after the recipient accepts.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
          Email address
          <input
            autoComplete="email"
            className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal"
            inputMode="email"
            onChange={(event) => {
              setEmail(event.target.value);
              setMessage(null);
            }}
            placeholder="team.member@example.com"
            type="email"
            value={email}
          />
        </label>
        <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
          Organization role
          <select
            className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal"
            onChange={(event) => setRole(event.target.value as OrganizationInvitationRole)}
            value={role}
          >
            {roles.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
        <button
          className="min-h-11 rounded-lg bg-slate-950 px-4 py-3 text-sm font-bold text-white disabled:opacity-60 sm:col-span-2"
          disabled={isSending || !organizationId}
          onClick={() => void sendInvitation()}
          type="button"
        >
          {isSending ? 'Sending invitation…' : 'Send invitation'}
        </button>
      </div>
      {message ? <p className="mt-3 text-sm text-slate-700" role="status">{message}</p> : null}
      {invitation ? (
        <div className="mt-3 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900">
          <p className="font-semibold">{invitation.inviteeEmail}</p>
          <p className="mt-1">
            {invitation.role.replace(/_/g, ' ')} · {invitation.status}
            {invitation.persisted ? ' · delivery queued' : ' · local fallback'}
          </p>
          {!invitation.persisted ? (
            <p className="mt-2 break-all text-xs">
              Manual pilot token: <code>{invitation.token}</code>
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
