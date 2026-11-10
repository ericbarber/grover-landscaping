import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import {
  createOwnerProviderInvitation,
  type OwnerProperty,
  type OwnerProviderConnectionProgress,
  type OwnerWorkspace,
  type OwnerYardBrief,
} from '../api/ownerAcquisitionClient';
import { trackMarketingEvent } from '../api/marketingAnalyticsClient';

type InvitationDraft = {
  providerName: string;
  recipientBusinessEmail: string;
  expiresInDays: 7 | 14 | 30;
};

const emptyDraft: InvitationDraft = {
  providerName: '',
  recipientBusinessEmail: '',
  expiresInDays: 14,
};

const recoverableStages: OwnerProviderConnectionProgress['progressStage'][] = [
  'delivery_failed',
  'declined',
  'contact_closed',
  'withdrawn',
  'expired',
];

const cadenceLabels: Record<OwnerYardBrief['cadencePreference'], string> = {
  provider_recommendation: 'Provider recommendation requested',
  one_time: 'One-time care',
  weekly: 'Weekly care',
  every_two_weeks: 'Care every two weeks',
  monthly: 'Monthly care',
};

function newInvitationKey(): string {
  return `owner-provider-invitation-${crypto.randomUUID()}`;
}

function recoveryButtonLabel(stage?: OwnerProviderConnectionProgress['progressStage']): string {
  if (stage === 'delivery_failed') return 'Review recipient and try again';
  if (stage === 'expired') return 'Invite a company again';
  return stage ? 'Invite another company' : 'Invite a company you know';
}

export function OwnerProviderInvitationPanel({
  property,
  workspace,
  brief,
  connections,
  onChanged,
}: {
  property: OwnerProperty;
  workspace: OwnerWorkspace;
  brief: OwnerYardBrief;
  connections: OwnerProviderConnectionProgress[];
  onChanged: () => Promise<void>;
}) {
  const prefix = useId();
  const reviewTitleRef = useRef<HTMLHeadingElement | null>(null);
  const requestKeyRef = useRef<string | null>(null);
  const [draft, setDraft] = useState<InvitationDraft>(emptyDraft);
  const [formOpen, setFormOpen] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const latestRecoverable = [...connections]
    .reverse()
    .find((entry) => recoverableStages.includes(entry.progressStage));
  const hasActiveConnection = connections.some((entry) => (
    !recoverableStages.includes(entry.progressStage)
    && entry.progressStage !== 'relationship_activated'
  ));
  const hasActiveRelationship = connections.some((entry) => (
    entry.progressStage === 'relationship_activated'
  ));
  const canInvite = !hasActiveConnection && !hasActiveRelationship;

  useEffect(() => {
    if (reviewing) reviewTitleRef.current?.focus();
  }, [reviewing]);

  if (!canInvite) return null;

  function openForm() {
    setFormOpen(true);
    setReviewing(false);
    setAttempted(false);
    setError(null);
    setNotice(null);
    requestKeyRef.current = null;
    setDraft({
      ...emptyDraft,
      providerName: latestRecoverable?.providerName ?? '',
    });
  }

  function reviewInvitation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    requestKeyRef.current = newInvitationKey();
    setAttempted(false);
    setReviewing(true);
  }

  async function sendInvitation() {
    setSubmitting(true);
    setAttempted(true);
    setError(null);
    setNotice(null);
    try {
      await createOwnerProviderInvitation(property.propertyId, {
        providerName: draft.providerName.trim(),
        recipientBusinessEmail: draft.recipientBusinessEmail.trim(),
        expiresInDays: draft.expiresInDays,
        idempotencyKey: requestKeyRef.current ??= newInvitationKey(),
      });
      requestKeyRef.current = null;
      setReviewing(false);
      setFormOpen(false);
      setDraft(emptyDraft);
      setNotice(`Invitation prepared for ${draft.providerName.trim()}. Follow delivery and response progress below.`);
      trackMarketingEvent('setup_stage_completed', 'yard_owner', 'provider_invitation_self_service');
      await onChanged();
    } catch (sendError) {
      setError(sendError instanceof Error
        ? sendError.message
        : 'The invitation could not be confirmed. Retry with the same reviewed request.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section aria-labelledby={`${prefix}-title`} className="mt-7 rounded-2xl border border-amber-300 bg-amber-50 p-5">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-800">
        {latestRecoverable ? 'Connection recovery' : 'Your next action'}
      </p>
      <h3 className="mt-2 text-xl font-black text-slate-950" id={`${prefix}-title`}>
        {latestRecoverable
          ? `${latestRecoverable.providerName}: ${latestRecoverable.statusLabel}`
          : 'Connect the yard to a company you already know'}
      </h3>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-700">
        Review the business recipient and the limited details below before anything is sent. Your saved private brief remains available whether or not you invite a company.
      </p>

      {notice ? <p className="mt-4 rounded-xl border border-emerald-300 bg-white p-4 text-sm font-semibold text-emerald-950" role="status">{notice}</p> : null}
      {error ? <p className="mt-4 rounded-xl border border-rose-300 bg-white p-4 text-sm text-rose-900" role="alert">{error}</p> : null}

      {!formOpen ? (
        <button className="mt-5 min-h-12 rounded-xl bg-emerald-800 px-5 font-black text-white hover:bg-emerald-700" onClick={openForm} type="button">
          {recoveryButtonLabel(latestRecoverable?.progressStage)}
        </button>
      ) : !reviewing ? (
        <form className="mt-5 rounded-2xl border border-amber-200 bg-white p-5" onSubmit={reviewInvitation}>
          <h4 className="text-lg font-black">Who should receive this invitation?</h4>
          <p className="mt-1 text-sm leading-6 text-slate-600">Use a business email controlled by the provider company—not a crew member’s personal address.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="block" htmlFor={`${prefix}-provider-name`}>
              <span className="text-sm font-bold text-slate-800">Company name</span>
              <input className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-3.5" id={`${prefix}-provider-name`} maxLength={160} minLength={2} onChange={(event) => setDraft((current) => ({ ...current, providerName: event.target.value }))} required value={draft.providerName} />
            </label>
            <label className="block" htmlFor={`${prefix}-provider-email`}>
              <span className="text-sm font-bold text-slate-800">Business email</span>
              <input autoComplete="email" className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-3.5" id={`${prefix}-provider-email`} maxLength={254} onChange={(event) => setDraft((current) => ({ ...current, recipientBusinessEmail: event.target.value }))} required type="email" value={draft.recipientBusinessEmail} />
            </label>
            <label className="block sm:max-w-xs" htmlFor={`${prefix}-expires`}>
              <span className="text-sm font-bold text-slate-800">Invitation window</span>
              <select className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3.5" id={`${prefix}-expires`} onChange={(event) => setDraft((current) => ({ ...current, expiresInDays: Number(event.target.value) as 7 | 14 | 30 }))} value={draft.expiresInDays}>
                <option value={7}>7 days</option>
                <option value={14}>14 days</option>
                <option value={30}>30 days</option>
              </select>
            </label>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <button className="min-h-12 rounded-xl bg-emerald-800 px-5 font-black text-white" type="submit">Review invitation</button>
            <button className="min-h-12 rounded-xl px-4 font-bold text-slate-700" onClick={() => { setFormOpen(false); setError(null); }} type="button">Cancel</button>
          </div>
        </form>
      ) : (
        <div className="mt-5 rounded-2xl border-2 border-emerald-700 bg-white p-5">
          <h4 className="text-lg font-black outline-none focus-visible:ring-4 focus-visible:ring-emerald-200" ref={reviewTitleRef} tabIndex={-1}>Review before sending</h4>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div><dt className="font-bold text-slate-500">Company</dt><dd className="mt-1 font-semibold text-slate-900">{draft.providerName.trim()}</dd></div>
            <div><dt className="font-bold text-slate-500">Recipient</dt><dd className="mt-1 break-all font-semibold text-slate-900">{draft.recipientBusinessEmail.trim()}</dd></div>
            <div><dt className="font-bold text-slate-500">Expires</dt><dd className="mt-1 font-semibold text-slate-900">{draft.expiresInDays} days after sending</dd></div>
            <div><dt className="font-bold text-slate-500">Private brief</dt><dd className="mt-1 font-semibold text-slate-900">Version {brief.version} stays saved</dd></div>
          </dl>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-950">
              <strong className="block">Included in this limited invitation</strong>
              {workspace.displayName}; {property.coarseArea || 'no general area provided'}; {brief.careGoals.join(', ')}; {cadenceLabels[brief.cadencePreference]}.
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
              <strong className="block text-slate-900">Still private</strong>
              Exact address, yard photos, your private contact details, and access or pet notes. Sharing any of those requires a later, separate approval.
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <button className="min-h-12 rounded-xl bg-emerald-800 px-5 font-black text-white disabled:cursor-wait disabled:opacity-60" disabled={submitting} onClick={() => void sendInvitation()} type="button">
              {submitting ? 'Sending invitation…' : attempted ? 'Retry reviewed invitation' : 'Send limited invitation'}
            </button>
            <button className="min-h-12 rounded-xl px-4 font-bold text-slate-700 disabled:opacity-60" disabled={submitting} onClick={() => { requestKeyRef.current = null; setReviewing(false); setAttempted(false); setError(null); }} type="button">Edit recipient</button>
          </div>
        </div>
      )}
    </section>
  );
}
