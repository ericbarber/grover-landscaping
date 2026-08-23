import { useEffect, useRef, useState } from 'react';
import { ApiRequestError } from '../api/apiError';
import {
  bootstrapProviderOrganizationClaim,
  createProviderOpportunityResponse,
  createProviderOrganizationClaim,
  fetchProviderInvitationInbox,
  fetchProviderOrganizationOptions,
  issueProviderResponseCapability,
  type ProviderInvitationInbox,
  type ProviderInvitationProgress,
  type ProviderOrganizationClaim,
  type ProviderOrganizationOption,
} from '../api/providerInvitationClient';

function errorMessage(error: unknown): string {
  return error instanceof ApiRequestError || error instanceof Error
    ? error.message : 'The connection step could not be confirmed.';
}

const claimStatusCopy: Record<string, string> = {
  bootstrap_ready: 'This provider name is ready for final setup.',
  duplicate_review: 'This provider may already have an account. Provider Operations must review it before setup continues.',
  under_review: 'Provider Operations is reviewing the company relationship.',
  rejected: 'We could not approve this company relationship. Review the support decision before continuing.',
  disputed: 'The company relationship is paused while an identity concern is reviewed.',
};

const questionOptions = [
  ['service_fit', 'Does the requested care fit our services?'],
  ['coarse_area_fit', 'Is the general service area a fit?'],
  ['cadence_support', 'Can we support the requested cadence?'],
  ['assessment_method', 'How would the yard assessment be completed?'],
] as const;

const declineOptions = [
  ['service_area_mismatch', 'Outside our service area'],
  ['capacity_unavailable', 'Capacity is not available'],
  ['service_fit_mismatch', 'Requested care is not a fit'],
  ['not_accepting_assessments', 'Not accepting assessments'],
] as const;

export function ProviderInvitationConnectionPanel({
  token,
  progress,
  onReload,
}: {
  token: string;
  progress: ProviderInvitationProgress;
  onReload: () => Promise<void>;
}) {
  const [options, setOptions] = useState<ProviderOrganizationOption[]>([]);
  const [optionsLoaded, setOptionsLoaded] = useState(false);
  const [claim, setClaim] = useState<ProviderOrganizationClaim | null>(null);
  const [selection, setSelection] = useState('');
  const [providerName, setProviderName] = useState('');
  const [authorityAttested, setAuthorityAttested] = useState(false);
  const [withheldAcknowledged, setWithheldAcknowledged] = useState(false);
  const [inbox, setInbox] = useState<ProviderInvitationInbox | null>(null);
  const [responseKind, setResponseKind] = useState<'express_interest' | 'preliminary_question' | 'decline'>('express_interest');
  const [responseCode, setResponseCode] = useState('ready_for_owner_disclosure');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const keys = useRef(new Map<string, string>());

  function requestKey(kind: string): string {
    const existing = keys.current.get(kind);
    if (existing) return existing;
    const created = `provider-connection-${kind}-${crypto.randomUUID()}`;
    keys.current.set(kind, created);
    return created;
  }

  useEffect(() => {
    if (progress.progressStage !== 'organization_check_required'
      || progress.organizationClaimId || optionsLoaded) return;
    setOptionsLoaded(true);
    fetchProviderOrganizationOptions(token)
      .then(setOptions)
      .catch((loadError) => setError(errorMessage(loadError)));
  }, [optionsLoaded, progress.organizationClaimId, progress.progressStage, token]);

  useEffect(() => {
    if (progress.progressStage !== 'response_ready') {
      setInbox(null);
      return;
    }
    fetchProviderInvitationInbox(token)
      .then(setInbox)
      .catch((loadError) => setError(errorMessage(loadError)));
  }, [progress.progressStage, token]);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await action();
    } catch (actionError) {
      setError(errorMessage(actionError));
    } finally {
      setBusy(false);
    }
  }

  async function recordClaim() {
    if (selection === 'new' && (!providerName.trim() || !authorityAttested)) {
      setError('Enter the provider name and confirm your authority to begin setup.');
      return;
    }
    if (!selection) {
      setError('Choose an existing provider organization or new-provider setup.');
      return;
    }
    await run(async () => {
      const created = await createProviderOrganizationClaim(
        token,
        selection === 'new' ? { providerDisplayName: providerName.trim() } : { organizationId: selection },
        requestKey('claim'),
      );
      keys.current.delete('claim');
      setClaim(created);
      if (created.organizationRelationshipChecked) {
        await onReload();
      } else {
        setNotice(claimStatusCopy[created.status] ?? 'Provider organization status recorded.');
      }
    });
  }

  async function bootstrapClaim() {
    const claimId = claim?.claimId ?? progress.organizationClaimId;
    const version = claim?.version ?? progress.organizationClaimVersion;
    if (!claimId || version === undefined) {
      setError('Reload the current provider organization status before final setup.');
      return;
    }
    await run(async () => {
      const updated = await bootstrapProviderOrganizationClaim(
        token, claimId, version, requestKey('bootstrap'),
      );
      keys.current.delete('bootstrap');
      setClaim(updated);
      if (updated.organizationRelationshipChecked) await onReload();
      else setNotice(claimStatusCopy[updated.status] ?? 'Provider organization status recorded.');
    });
  }

  async function authorizeResponse() {
    if (!withheldAcknowledged || !progress.organizationClaimId) {
      setError('Acknowledge the withheld information before opening the limited response.');
      return;
    }
    await run(async () => {
      await issueProviderResponseCapability(
        token, progress.organizationClaimId!, requestKey('capability'),
      );
      keys.current.delete('capability');
      await onReload();
    });
  }

  function chooseResponse(kind: typeof responseKind) {
    setResponseKind(kind);
    setResponseCode(kind === 'express_interest'
      ? 'ready_for_owner_disclosure'
      : kind === 'preliminary_question' ? 'service_fit' : 'service_area_mismatch');
  }

  async function respond() {
    if (!inbox) return;
    await run(async () => {
      await createProviderOpportunityResponse(
        token, inbox, { action: responseKind, responseCode }, requestKey(`response-${responseKind}`),
      );
      keys.current.delete(`response-${responseKind}`);
      setNotice(responseKind === 'express_interest'
        ? 'Interest recorded. The owner still decides whether to share assessment details.'
        : responseKind === 'preliminary_question'
          ? 'Your controlled question was recorded without requesting private yard details.'
          : 'This invitation was declined. Future invitations remain available.');
      await onReload();
    });
  }

  const claimStatus = claim?.status ?? progress.organizationClaimStatus;
  if (!['organization_check_required', 'response_authorization_required', 'response_ready'].includes(progress.progressStage)) return null;

  return (
    <section aria-labelledby="provider-connection-step-title" className="mt-5 rounded-2xl border border-sky-200 bg-sky-50 p-5" data-provider-connection-setup>
      <p className="text-xs font-black uppercase tracking-[0.16em] text-sky-800">Known-owner connection</p>
      <h3 className="mt-2 text-xl font-black" id="provider-connection-step-title">
        {progress.progressStage === 'organization_check_required'
          ? 'Connect the provider organization'
          : progress.progressStage === 'response_authorization_required'
            ? 'Open a bounded response path'
            : 'Review the limited request'}
      </h3>
      {error ? <p className="mt-4 rounded-xl border border-rose-300 bg-white p-4 text-sm font-semibold text-rose-950" role="alert">{error} No additional access was granted.</p> : null}
      {notice ? <p className="mt-4 rounded-xl border border-emerald-300 bg-white p-4 text-sm font-semibold text-emerald-950" role="status">{notice}</p> : null}

      {progress.progressStage === 'organization_check_required' ? (
        claimStatus ? <div className="mt-4 rounded-xl bg-white p-4"><strong>{claimStatusCopy[claimStatus] ?? 'Provider organization status recorded.'}</strong>{claimStatus === 'bootstrap_ready' ? <button className="grover-button-primary mt-4 disabled:opacity-60" disabled={busy} onClick={() => void bootstrapClaim()} type="button">{busy ? 'Completing setup…' : 'Complete provider organization setup'}</button> : null}</div>
          : <div className="mt-4 grid gap-4 rounded-xl bg-white p-4">
            <fieldset><legend className="text-sm font-black">Which provider organization are you representing?</legend><div className="mt-3 grid gap-2">{options.map((option) => <label className="flex min-h-12 items-center gap-3 rounded-xl border border-slate-200 p-3 text-sm font-bold" key={option.organizationId}><input checked={selection === option.organizationId} onChange={() => setSelection(option.organizationId)} type="radio" />{option.displayName}<span className="ml-auto text-xs text-slate-500">{option.membershipRole.split('_').join(' ')}</span></label>)}<label className="flex min-h-12 items-center gap-3 rounded-xl border border-slate-200 p-3 text-sm font-bold"><input checked={selection === 'new'} onChange={() => setSelection('new')} type="radio" />Begin setup for a new provider organization</label></div></fieldset>
            {selection === 'new' ? <><label className="text-sm font-bold">Provider business name<input className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-3 font-normal" maxLength={160} onChange={(event) => setProviderName(event.target.value)} value={providerName} /></label><label className="flex items-start gap-3 text-sm font-semibold leading-6"><input checked={authorityAttested} className="mt-1 size-5 shrink-0" onChange={(event) => setAuthorityAttested(event.target.checked)} type="checkbox" /><span>I am authorized to begin setup for this provider organization. Grover may still route a possible duplicate to Provider Operations.</span></label></> : null}
            <p className="text-xs leading-5 text-slate-600">Only your own active landscaping-company memberships are listed. This check does not verify credentials or authorize a response.</p>
            <button className="grover-button-primary disabled:opacity-60" disabled={busy || !optionsLoaded} onClick={() => void recordClaim()} type="button">{busy ? 'Checking organization…' : 'Continue with this organization'}</button>
          </div>
      ) : null}

      {progress.progressStage === 'response_authorization_required' ? <div className="mt-4 rounded-xl bg-white p-4"><p className="text-sm leading-6 text-slate-700">The owner has shared only a limited request. Exact address, photos, owner contact, access details, pricing, scheduling, and work authority remain withheld.</p><label className="mt-4 flex items-start gap-3 text-sm font-semibold leading-6"><input checked={withheldAcknowledged} className="mt-1 size-5 shrink-0" onChange={(event) => setWithheldAcknowledged(event.target.checked)} type="checkbox" /><span>I understand these details remain private and that a response does not select my company or authorize work.</span></label><button className="grover-button-primary mt-4 disabled:opacity-60" disabled={busy || !withheldAcknowledged} onClick={() => void authorizeResponse()} type="button">{busy ? 'Opening response…' : 'Open limited response'}</button></div> : null}

      {progress.progressStage === 'response_ready' ? inbox ? <div className="mt-4 grid gap-4 rounded-xl bg-white p-4"><div><p className="text-xs font-black uppercase tracking-wide text-slate-500">Limited owner request</p><h4 className="mt-2 text-lg font-black">{inbox.ownerName} · {inbox.coarseArea}</h4><p className="mt-2 text-sm text-slate-700">Goals: {inbox.careGoals.join(', ')} · Cadence: {inbox.cadence?.split('_').join(' ')}</p></div><fieldset><legend className="text-sm font-black">Choose one bounded response</legend><div className="mt-3 flex flex-wrap gap-2">{(['express_interest', 'preliminary_question', 'decline'] as const).map((kind) => <button aria-pressed={responseKind === kind} className={`min-h-11 rounded-lg border px-3 text-sm font-bold ${responseKind === kind ? 'border-emerald-800 bg-emerald-50 text-emerald-950' : 'border-slate-300'}`} key={kind} onClick={() => chooseResponse(kind)} type="button">{kind === 'express_interest' ? 'Express interest' : kind === 'preliminary_question' ? 'Ask a controlled question' : 'Decline'}</button>)}</div></fieldset>{responseKind === 'preliminary_question' ? <label className="text-sm font-bold">Question topic<select className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 font-normal" onChange={(event) => setResponseCode(event.target.value)} value={responseCode}>{questionOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label> : null}{responseKind === 'decline' ? <label className="text-sm font-bold">Private fit reason<select className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 font-normal" onChange={(event) => setResponseCode(event.target.value)} value={responseCode}>{declineOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label> : null}<p className="text-xs font-semibold leading-5 text-slate-500">No response submits pricing, accepts a job, schedules a visit, assigns a crew, or reveals the withheld categories.</p><button className="grover-button-primary disabled:opacity-60" disabled={busy} onClick={() => void respond()} type="button">{busy ? 'Recording response…' : responseKind === 'express_interest' ? 'Request owner-approved assessment review' : responseKind === 'preliminary_question' ? 'Send controlled question' : 'Decline this invitation'}</button></div> : <p className="mt-4 rounded-xl bg-white p-4 text-sm font-semibold text-slate-600">Loading the authorized limited request…</p> : null}
    </section>
  );
}
