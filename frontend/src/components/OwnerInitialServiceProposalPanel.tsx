import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiRequestError } from '../api/apiError';
import {
  activateOwnerProviderRelationship,
  createOwnerInitialServiceProposalMessage,
  decideOwnerProviderFirstVisit,
  decideOwnerInitialServiceProposal,
  fetchOwnerInitialServiceProposalMessages,
  fetchOwnerInitialServiceProposals,
  fetchOwnerProviderRelationshipActivation,
  fetchOwnerProviderFirstVisit,
  type OwnerProviderAssessment,
  type OwnerProviderConnectionProgress,
} from '../api/ownerAcquisitionClient';
import {
  canDecideInitialServiceProposal,
  formatProposalMoney,
  firstVisitWindowLabel,
  INITIAL_SERVICE_PROPOSAL_ACCEPTANCE_TEXT,
  INITIAL_SERVICE_PROPOSAL_ACCEPTANCE_VERSION,
  OWNER_PROVIDER_ACTIVATION_AFFIRMATION_TEXT,
  OWNER_PROVIDER_ACTIVATION_AFFIRMATION_VERSION,
  OWNER_PROVIDER_FIRST_VISIT_CONFIRMATION_TEXT,
  OWNER_PROVIDER_FIRST_VISIT_CONFIRMATION_VERSION,
  proposalCadenceLabel,
  proposalPriceLabel,
  type InitialServiceProposal,
  type InitialServiceProposalDecisionAction,
  type InitialServiceProposalMessage,
  type OwnerProviderRelationshipActivation,
  type OwnerProviderFirstVisit,
} from '../domain/initialServiceProposals';

const statusCopy: Record<InitialServiceProposal['status'], string> = {
  sent: 'Ready for your decision',
  superseded: 'Replaced by a newer version',
  accepted: 'Accepted for provider setup',
  declined: 'Declined',
  expired: 'Decision window ended',
};

const decisionKey = (proposal: InitialServiceProposal, action: string) =>
  `${proposal.proposalId}:${proposal.proposalVersion}:${action}`;

function proposalError(error: unknown): string {
  return error instanceof ApiRequestError || error instanceof Error
    ? error.message : 'The proposal decision could not be confirmed.';
}

export function OwnerInitialServiceProposalPanel({
  propertyId,
  assessments,
  connections,
}: {
  propertyId: string;
  assessments: OwnerProviderAssessment[];
  connections: OwnerProviderConnectionProgress[];
}) {
  const [proposals, setProposals] = useState<InitialServiceProposal[]>([]);
  const [messages, setMessages] = useState<Record<string, InitialServiceProposalMessage[]>>({});
  const [activations, setActivations] = useState<Record<string, OwnerProviderRelationshipActivation | undefined>>({});
  const [firstVisits, setFirstVisits] = useState<Record<string, OwnerProviderFirstVisit>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [decisionTarget, setDecisionTarget] = useState<string | null>(null);
  const [decisionAction, setDecisionAction] = useState<InitialServiceProposalDecisionAction>('accept');
  const [declineReason, setDeclineReason] = useState('price');
  const [decisionNote, setDecisionNote] = useState('');
  const [affirmed, setAffirmed] = useState(false);
  const [activationTarget, setActivationTarget] = useState<string | null>(null);
  const [activationAffirmed, setActivationAffirmed] = useState(false);
  const [firstVisitTarget, setFirstVisitTarget] = useState<string | null>(null);
  const [firstVisitAction, setFirstVisitAction] = useState<'confirm' | 'request_change'>('confirm');
  const [firstVisitAffirmed, setFirstVisitAffirmed] = useState(false);
  const [firstVisitNote, setFirstVisitNote] = useState('');
  const [messageTarget, setMessageTarget] = useState<string | null>(null);
  const [messageKind, setMessageKind] = useState<'owner_question' | 'owner_change_request'>('owner_question');
  const [messageBody, setMessageBody] = useState('');
  const keys = useRef(new Map<string, string>());

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const loadedProposals = await fetchOwnerInitialServiceProposals(propertyId);
      setProposals(loadedProposals);
      const acceptedProposals = loadedProposals.filter((proposal) => proposal.status === 'accepted');
      const loadedActivations = await Promise.all(acceptedProposals.map(async (proposal) => [
        proposal.proposalId,
        await fetchOwnerProviderRelationshipActivation(propertyId, proposal.proposalId),
      ] as const));
      setActivations(Object.fromEntries(loadedActivations));
      const activeRelationships = loadedActivations.flatMap(([, activation]) => (
        activation ? [activation] : []
      ));
      const loadedFirstVisits = await Promise.all(activeRelationships.map(async (activation) => [
        activation.activationId,
        await fetchOwnerProviderFirstVisit(propertyId, activation.activationId),
      ] as const));
      setFirstVisits(Object.fromEntries(loadedFirstVisits));
      const representativeByAssessment = new Map<string, InitialServiceProposal>();
      for (const proposal of loadedProposals) {
        if (!representativeByAssessment.has(proposal.assessmentId)) {
          representativeByAssessment.set(proposal.assessmentId, proposal);
        }
      }
      const conversations = await Promise.all([...representativeByAssessment.values()].map(
        async (proposal) => [
          proposal.assessmentId,
          await fetchOwnerInitialServiceProposalMessages(propertyId, proposal.proposalId),
        ] as const,
      ));
      setMessages(Object.fromEntries(conversations));
    } catch (loadError) {
      setError(proposalError(loadError));
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    setProposals([]);
    setNotice(null);
    setDecisionTarget(null);
    setMessageTarget(null);
    setMessages({});
    setActivations({});
    setFirstVisits({});
    setActivationTarget(null);
    setActivationAffirmed(false);
    setFirstVisitTarget(null);
    setFirstVisitAffirmed(false);
    setFirstVisitNote('');
    keys.current.clear();
    void load();
  }, [load]);

  function openDecision(proposal: InitialServiceProposal, action: InitialServiceProposalDecisionAction) {
    setDecisionTarget(proposal.proposalId);
    setDecisionAction(action);
    setDeclineReason('price');
    setDecisionNote('');
    setAffirmed(false);
    setError(null);
    setNotice(null);
  }

  async function decide(proposal: InitialServiceProposal) {
    if (decisionAction === 'accept' && !affirmed) {
      setError('Confirm the exact acceptance statement before accepting this proposal.');
      return;
    }
    const keyId = decisionKey(proposal, decisionAction);
    const idempotencyKey = keys.current.get(keyId)
      ?? `owner-proposal-decision-${crypto.randomUUID()}`;
    keys.current.set(keyId, idempotencyKey);
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await decideOwnerInitialServiceProposal(propertyId, proposal, decisionAction, {
        reasonCode: decisionAction === 'decline' ? declineReason : undefined,
        customerSafeNote: decisionNote.trim() || undefined,
        affirmationTextVersion: decisionAction === 'accept'
          ? INITIAL_SERVICE_PROPOSAL_ACCEPTANCE_VERSION : undefined,
      }, idempotencyKey);
      keys.current.delete(keyId);
      setDecisionTarget(null);
      setNotice(decisionAction === 'accept'
        ? 'Proposal accepted for provider setup. No visit was scheduled, no payment was collected, and no crew was assigned.'
        : 'Proposal declined. No service was created.');
      await load();
    } catch (decisionError) {
      await load();
      setError(`${proposalError(decisionError)} Reloaded proposal status is shown below when available.`);
    } finally {
      setBusy(false);
    }
  }

  function openMessage(
    proposal: InitialServiceProposal,
    kind: 'owner_question' | 'owner_change_request',
  ) {
    setMessageTarget(proposal.proposalId);
    setMessageKind(kind);
    setMessageBody('');
    setDecisionTarget(null);
    setError(null);
    setNotice(null);
  }

  async function sendMessage(proposal: InitialServiceProposal) {
    if (!messageBody.trim()) {
      setError('Enter a customer-safe question or requested change first.');
      return;
    }
    const keyId = `${proposal.proposalId}:${proposal.proposalVersion}:${messageKind}`;
    const idempotencyKey = keys.current.get(keyId)
      ?? `owner-proposal-message-${crypto.randomUUID()}`;
    keys.current.set(keyId, idempotencyKey);
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const created = await createOwnerInitialServiceProposalMessage(
        propertyId,
        proposal,
        messageKind,
        messageBody.trim(),
        idempotencyKey,
      );
      keys.current.delete(keyId);
      setMessages((current) => ({
        ...current,
        [proposal.assessmentId]: [...(current[proposal.assessmentId] ?? []), created],
      }));
      setMessageTarget(null);
      setMessageBody('');
      setNotice(messageKind === 'owner_change_request'
        ? `Change requested for proposal version ${proposal.proposalVersion}. This did not decline or accept it.`
        : `Question sent about proposal version ${proposal.proposalVersion}. This did not make a decision.`);
    } catch (messageError) {
      await load();
      setError(`${proposalError(messageError)} Reloaded proposal status and messages are shown when available.`);
    } finally {
      setBusy(false);
    }
  }

  function openActivation(proposal: InitialServiceProposal) {
    setActivationTarget(proposal.proposalId);
    setActivationAffirmed(false);
    setDecisionTarget(null);
    setMessageTarget(null);
    setError(null);
    setNotice(null);
  }

  async function activate(proposal: InitialServiceProposal) {
    if (!activationAffirmed) {
      setError('Confirm the provider setup statement before activating this relationship.');
      return;
    }
    const keyId = `${proposal.proposalId}:${proposal.proposalVersion}:activation`;
    const idempotencyKey = keys.current.get(keyId)
      ?? `owner-provider-activation-${crypto.randomUUID()}`;
    keys.current.set(keyId, idempotencyKey);
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const activation = await activateOwnerProviderRelationship(
        propertyId,
        proposal,
        OWNER_PROVIDER_ACTIVATION_AFFIRMATION_VERSION,
        idempotencyKey,
      );
      keys.current.delete(keyId);
      setActivations((current) => ({ ...current, [proposal.proposalId]: activation }));
      setActivationTarget(null);
      setActivationAffirmed(false);
      setNotice('Provider relationship activated. Customer and property setup is ready for provider onboarding; no first visit, payment, schedule, or crew assignment was created.');
      await load();
    } catch (activationError) {
      await load();
      setError(`${proposalError(activationError)} Reloaded activation status is shown below when available.`);
    } finally {
      setBusy(false);
    }
  }

  function openFirstVisitDecision(
    firstVisit: OwnerProviderFirstVisit,
    action: 'confirm' | 'request_change',
  ) {
    setFirstVisitTarget(firstVisit.activationId);
    setFirstVisitAction(action);
    setFirstVisitAffirmed(false);
    setFirstVisitNote('');
    setError(null);
    setNotice(null);
  }

  async function decideFirstVisit(firstVisit: OwnerProviderFirstVisit) {
    if (firstVisitAction === 'confirm' && !firstVisitAffirmed) {
      setError('Confirm the exact first-visit statement before accepting this window.');
      return;
    }
    if (firstVisitAction === 'request_change' && !firstVisitNote.trim()) {
      setError('Describe the customer-safe timing change you need.');
      return;
    }
    const keyId = `${firstVisit.activationId}:${firstVisit.currentVersion}:${firstVisitAction}`;
    const idempotencyKey = keys.current.get(keyId)
      ?? `owner-first-visit-${crypto.randomUUID()}`;
    keys.current.set(keyId, idempotencyKey);
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const updated = await decideOwnerProviderFirstVisit(
        propertyId,
        firstVisit,
        firstVisitAction,
        {
          customerSafeNote: firstVisitAction === 'request_change'
            ? firstVisitNote.trim() : undefined,
          confirmationAffirmationTextVersion: firstVisitAction === 'confirm'
            ? OWNER_PROVIDER_FIRST_VISIT_CONFIRMATION_VERSION : undefined,
        },
        idempotencyKey,
      );
      keys.current.delete(keyId);
      setFirstVisits((current) => ({ ...current, [updated.activationId]: updated }));
      setFirstVisitTarget(null);
      setFirstVisitAffirmed(false);
      setFirstVisitNote('');
      setNotice(firstVisitAction === 'confirm'
        ? 'First visit confirmed. The provider still assigns crews and releases route work separately.'
        : 'Window change requested. Your provider relationship remains active while the provider prepares another option.');
    } catch (decisionError) {
      await load();
      setError(`${proposalError(decisionError)} Reloaded first-visit status is shown below when available.`);
    } finally {
      setBusy(false);
    }
  }

  function firstVisitPanel(activation: OwnerProviderRelationshipActivation) {
    const firstVisit = firstVisits[activation.activationId];
    if (!firstVisit) return <p className="mt-4 rounded-xl bg-white p-4 text-sm font-semibold text-slate-600">Loading first-visit status…</p>;
    if (firstVisit.status === 'awaiting_provider') return <div className="mt-4 rounded-xl bg-white p-4"><strong>Waiting for a provider window</strong><p className="mt-1 text-sm leading-6 text-slate-600">Your provider can now propose a customer-facing date and arrival window. Nothing is scheduled yet.</p></div>;
    if (firstVisit.status === 'change_requested') return <div className="mt-4 rounded-xl border border-amber-200 bg-white p-4"><strong>Window change requested</strong><p className="mt-1 text-sm leading-6 text-slate-600">You asked: {firstVisit.ownerCustomerSafeNote}</p><p className="mt-2 text-sm font-semibold text-amber-900">Waiting for {firstVisit.organizationName} to propose version {firstVisit.currentVersion + 1}.</p></div>;
    if (firstVisit.status === 'confirmed') return <div className="mt-4 rounded-xl bg-emerald-950 p-5 text-white"><p className="text-xs font-black uppercase tracking-[0.14em] text-sand">First visit confirmed</p><h6 className="mt-2 font-display text-xl font-bold">{firstVisitWindowLabel(firstVisit)}</h6>{firstVisit.customerSafeArrivalNote ? <p className="mt-2 text-sm leading-6 text-emerald-100">{firstVisit.customerSafeArrivalNote}</p> : null}<p className="mt-3 text-sm font-semibold text-white">The appointment is customer-confirmed. Crew, route, work-order, and payment steps remain provider-managed.</p><a className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-white px-4 font-black text-emerald-950" href="/app">Open my Yard Owner portal</a></div>;
    const decisionOpen = firstVisitTarget === firstVisit.activationId;
    return <div className="mt-4 rounded-xl border border-sky-200 bg-white p-4"><p className="text-xs font-black uppercase tracking-[0.14em] text-sky-800">First-visit proposal · version {firstVisit.currentVersion}</p><h6 className="mt-2 font-display text-xl font-bold text-slate-950">{firstVisitWindowLabel(firstVisit)}</h6>{firstVisit.customerSafeArrivalNote ? <p className="mt-2 text-sm leading-6 text-slate-600">{firstVisit.customerSafeArrivalNote}</p> : null}<p className="mt-3 text-xs font-bold leading-5 text-slate-500">Confirming this customer appointment does not assign a crew or create route work, a work order, recurring schedule, or payment.</p>{!decisionOpen ? <div className="mt-4 flex flex-wrap gap-2"><button className="min-h-11 rounded-lg bg-emerald-800 px-4 font-black text-white" onClick={() => openFirstVisitDecision(firstVisit, 'confirm')} type="button">Review and confirm window</button><button className="min-h-11 rounded-lg border border-sky-700 px-4 font-bold text-sky-950" onClick={() => openFirstVisitDecision(firstVisit, 'request_change')} type="button">Request another window</button></div> : <div className="mt-4 rounded-xl bg-slate-50 p-4">{firstVisitAction === 'confirm' ? <label className="flex items-start gap-3 text-sm font-semibold leading-6"><input checked={firstVisitAffirmed} className="mt-1 size-5 shrink-0" onChange={(event) => setFirstVisitAffirmed(event.target.checked)} type="checkbox" /><span>{OWNER_PROVIDER_FIRST_VISIT_CONFIRMATION_TEXT}</span></label> : <label className="block text-sm font-bold">What timing needs to change?<textarea aria-label="First visit change request" className="mt-2 min-h-24 w-full rounded-xl border border-slate-300 bg-white p-3 font-normal" maxLength={1000} onChange={(event) => setFirstVisitNote(event.target.value)} placeholder="For example: Friday afternoon would work better." value={firstVisitNote} /></label>}<div className="mt-4 flex flex-wrap gap-2"><button className="min-h-11 rounded-lg bg-emerald-800 px-4 font-black text-white disabled:opacity-60" disabled={busy || (firstVisitAction === 'confirm' ? !firstVisitAffirmed : !firstVisitNote.trim())} onClick={() => void decideFirstVisit(firstVisit)} type="button">{busy ? 'Saving…' : firstVisitAction === 'confirm' ? 'Confirm this exact window' : 'Send change request'}</button><button className="min-h-11 rounded-lg border border-slate-300 bg-white px-4 font-bold" disabled={busy} onClick={() => setFirstVisitTarget(null)} type="button">Cancel</button></div></div>}</div>;
  }

  const providerFor = (proposal: InitialServiceProposal) => {
    const invitationId = assessments.find((assessment) => (
      assessment.assessmentId === proposal.assessmentId
    ))?.invitationId ?? proposal.invitationId;
    return connections.find((connection) => connection.invitationId === invitationId)?.providerName
      ?? 'Connected provider';
  };

  return (
    <section aria-labelledby="owner-proposals-title" className="mt-7 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-800">Proposal review</p>
          <h4 className="mt-2 text-xl font-black text-slate-950" id="owner-proposals-title">Compare the exact offer before deciding</h4>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-700">Each version is provider-authored and preserved. Grover shows the terms neutrally and does not rank, recommend, or silently activate an offer.</p>
        </div>
        <button className="min-h-11 rounded-lg border border-emerald-700 bg-white px-4 text-sm font-bold text-emerald-950 disabled:opacity-60" disabled={loading || busy} onClick={() => void load()} type="button">{loading ? 'Refreshing…' : 'Refresh proposals'}</button>
      </div>
      {notice ? <p className="mt-4 rounded-xl border border-emerald-300 bg-white p-4 text-sm font-semibold text-emerald-950" role="status">{notice}</p> : null}
      {error ? <p className="mt-4 rounded-xl border border-rose-300 bg-white p-4 text-sm font-semibold text-rose-950" role="alert">{error} No new decision should be inferred from this message.</p> : null}
      {loading && proposals.length === 0 ? <p className="mt-5 rounded-xl bg-white p-4 text-sm font-semibold text-slate-600" role="status">Loading proposals…</p> : null}
      {!loading && proposals.length === 0 ? <div className="mt-5 rounded-xl border border-dashed border-emerald-300 bg-white/70 p-4"><strong className="text-slate-900">No proposal has been sent yet</strong><p className="mt-1 text-sm leading-6 text-slate-600">A provider can author an initial-service proposal only after completing its assessment.</p></div> : null}
      {proposals.length > 0 ? (
        <ol className="mt-5 grid gap-5">
          {proposals.map((proposal) => {
            const decisionOpen = decisionTarget === proposal.proposalId;
            const canDecide = canDecideInitialServiceProposal(proposal);
            const messageOpen = messageTarget === proposal.proposalId;
            const latestVersion = Math.max(...proposals
              .filter((entry) => entry.assessmentId === proposal.assessmentId)
              .map((entry) => entry.proposalVersion));
            const isLatestVersion = proposal.proposalVersion === latestVersion;
            const conversation = messages[proposal.assessmentId] ?? [];
            const activation = activations[proposal.proposalId];
            const activationOpen = activationTarget === proposal.proposalId;
            return (
              <li className={`rounded-2xl border bg-white p-5 ${proposal.status === 'sent' ? 'border-emerald-300 shadow-sm' : 'border-slate-200'}`} key={proposal.proposalId}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div><p className="text-xs font-black uppercase tracking-wide text-emerald-800">{providerFor(proposal)} · Version {proposal.proposalVersion}</p><h5 className="mt-1 text-lg font-black text-slate-950">{proposal.title}</h5><p className="mt-2 text-2xl font-black text-emerald-950">{proposalPriceLabel(proposal)}</p></div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-slate-800">{statusCopy[proposal.status]}</span>
                </div>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-700">{proposal.customerSummary}</p>
                <div className="mt-5 grid gap-4 lg:grid-cols-2">
                  <div className="rounded-xl bg-emerald-50 p-4"><strong className="text-sm text-emerald-950">Included</strong><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">{proposal.includedScope.map((item) => <li key={item}>{item}</li>)}</ul></div>
                  <div className="rounded-xl bg-slate-50 p-4"><strong className="text-sm text-slate-900">Not included</strong><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">{proposal.exclusions.map((item) => <li key={item}>{item}</li>)}</ul></div>
                </div>
                <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
                  <div><dt className="font-black text-slate-900">Cadence</dt><dd className="mt-1 text-slate-600">{proposalCadenceLabel(proposal.cadenceCode)} · {proposal.cadenceDetail}</dd></div>
                  <div><dt className="font-black text-slate-900">Decision due</dt><dd className="mt-1 text-slate-600">{new Date(proposal.expiresAtEpochSeconds * 1000).toLocaleString()}</dd></div>
                  {proposal.annualizedMonthlyMinor !== undefined ? <div><dt className="font-black text-slate-900">Monthly equivalent</dt><dd className="mt-1 text-slate-600">{formatProposalMoney(proposal.annualizedMonthlyMinor, proposal.currencyCode)} for comparison</dd></div> : null}
                  <div><dt className="font-black text-slate-900">Arrival</dt><dd className="mt-1 text-slate-600">{proposal.arrivalPolicy}</dd></div>
                  <div><dt className="font-black text-slate-900">Weather</dt><dd className="mt-1 text-slate-600">{proposal.weatherPolicy}</dd></div>
                  <div><dt className="font-black text-slate-900">Cancellation</dt><dd className="mt-1 text-slate-600">{proposal.cancellationPolicy}</dd></div>
                  <div><dt className="font-black text-slate-900">Completion proof</dt><dd className="mt-1 text-slate-600">{proposal.proofExpectation}</dd></div>
                </dl>
                {proposal.revisionNote ? <p className="mt-4 rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-950"><strong>Provider’s revision note:</strong> {proposal.revisionNote}</p> : null}
                {proposal.status === 'accepted' && !activation ? <div className="mt-5 rounded-2xl border border-amber-300 bg-amber-50 p-5"><p className="text-xs font-black uppercase tracking-[0.14em] text-amber-800">Separate activation required</p><h6 className="mt-2 font-black text-amber-950">Create the provider relationship</h6><p className="mt-2 text-sm leading-6 text-slate-700">You accepted this exact offer, but provider setup has not been created. Activation creates your provider-facing customer and property records and closes other open requests for this yard. It still does not confirm a first visit, collect payment, create a schedule, or assign a crew.</p>{!activationOpen ? <button className="mt-4 min-h-12 rounded-xl bg-emerald-800 px-5 font-black text-white" onClick={() => openActivation(proposal)} type="button">Review provider setup</button> : <div className="mt-4 rounded-xl border border-amber-300 bg-white p-4"><label className="flex items-start gap-3 text-sm font-semibold leading-6 text-slate-800"><input checked={activationAffirmed} className="mt-1 size-5 shrink-0" onChange={(event) => setActivationAffirmed(event.target.checked)} type="checkbox" /><span>{OWNER_PROVIDER_ACTIVATION_AFFIRMATION_TEXT}</span></label><div className="mt-4 flex flex-wrap gap-3"><button className="min-h-12 rounded-xl bg-emerald-800 px-5 font-black text-white disabled:opacity-60" disabled={busy || !activationAffirmed} onClick={() => void activate(proposal)} type="button">{busy ? 'Creating provider setup…' : 'Activate provider setup'}</button><button className="min-h-12 rounded-xl border border-slate-400 bg-white px-5 font-bold" disabled={busy} onClick={() => setActivationTarget(null)} type="button">Cancel</button></div></div>}</div> : null}
                {activation ? <div className="mt-5 rounded-2xl border border-emerald-300 bg-emerald-50 p-5" role="status"><p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-800">Relationship activated</p><h6 className="mt-2 font-black text-emerald-950">Provider setup is underway</h6><p className="mt-2 text-sm leading-6 text-slate-700">Your provider-facing customer and property records and account-owner portal access are connected. Properties added to this customer account use the same owner access; delegates remain limited to explicitly shared yards. {activation.closedCompetingInvitationCount > 0 ? `${activation.closedCompetingInvitationCount} other open ${activation.closedCompetingInvitationCount === 1 ? 'request was' : 'requests were'} closed for this yard.` : 'No other open provider requests needed to be closed.'}</p><p className="mt-3 text-sm font-semibold text-emerald-950">Next: review the provider's customer-facing first-visit window. No payment, recurring schedule, route, work order, or crew assignment exists yet.</p>{firstVisitPanel(activation)}</div> : null}
                {isLatestVersion ? <div className="mt-5 rounded-2xl border border-sky-200 bg-sky-50 p-4"><div className="flex flex-wrap items-start justify-between gap-2"><div><h6 className="font-black text-sky-950">Questions and requested changes</h6><p className="mt-1 text-xs leading-5 text-sky-900">Messages preserve the proposal version they discuss. Sending one does not accept, decline, or activate service.</p></div><span className="rounded-full bg-white px-3 py-1 text-xs font-black text-sky-900">{conversation.length} messages</span></div>{conversation.length > 0 ? <ol className="mt-4 grid gap-3">{conversation.map((message) => { const related = proposals.find((entry) => entry.proposalId === message.relatedProposalId); return <li className="rounded-xl bg-white p-4 text-sm" key={message.messageId}><div className="flex flex-wrap items-center justify-between gap-2"><strong className="text-slate-950">{message.authorRole === 'owner' ? 'You' : providerFor(proposal)}</strong><span className="text-xs font-bold text-slate-500">About version {message.proposalVersionSnapshot}</span></div><p className="mt-2 whitespace-pre-wrap leading-6 text-slate-700">{message.customerSafeBody}</p>{related ? <p className="mt-2 text-xs font-bold text-emerald-800">Provider linked proposal version {related.proposalVersion}: {related.title}</p> : null}</li>; })}</ol> : <p className="mt-4 rounded-xl bg-white p-3 text-sm text-slate-600">No proposal-specific messages yet.</p>}{canDecide && !messageOpen ? <div className="mt-4 flex flex-wrap gap-2"><button className="min-h-11 rounded-lg bg-sky-800 px-4 font-black text-white" onClick={() => openMessage(proposal, 'owner_question')} type="button">Ask a question</button><button className="min-h-11 rounded-lg border border-sky-700 bg-white px-4 font-bold text-sky-950" onClick={() => openMessage(proposal, 'owner_change_request')} type="button">Request a change</button></div> : null}{messageOpen ? <div className="mt-4 rounded-xl border border-sky-300 bg-white p-4"><h6 className="font-black text-slate-950">{messageKind === 'owner_question' ? 'Ask about' : 'Request a change to'} version {proposal.proposalVersion}</h6><textarea aria-label="Proposal message" className="mt-3 min-h-28 w-full rounded-xl border border-slate-300 p-3 text-sm" maxLength={2000} onChange={(event) => setMessageBody(event.target.value)} placeholder={messageKind === 'owner_question' ? 'What would you like the provider to clarify?' : 'Describe the exact scope, timing, or price change you want considered.'} value={messageBody} /><div className="mt-3 flex flex-wrap gap-2"><button className="min-h-11 rounded-lg bg-sky-800 px-4 font-black text-white disabled:opacity-60" disabled={busy} onClick={() => void sendMessage(proposal)} type="button">{busy ? 'Sending…' : messageKind === 'owner_question' ? 'Send question' : 'Send change request'}</button><button className="min-h-11 rounded-lg border border-slate-300 px-4 font-bold" disabled={busy} onClick={() => setMessageTarget(null)} type="button">Cancel</button></div></div> : null}</div> : null}
                {canDecide && !decisionOpen ? <div className="mt-5 flex flex-wrap gap-3"><button className="min-h-12 rounded-xl bg-emerald-800 px-5 font-black text-white" onClick={() => openDecision(proposal, 'accept')} type="button">Review and accept</button><button className="min-h-12 rounded-xl border border-slate-400 px-5 font-bold text-slate-900" onClick={() => openDecision(proposal, 'decline')} type="button">Decline proposal</button></div> : null}
                {decisionOpen ? <div className="mt-5 rounded-2xl border border-amber-300 bg-amber-50 p-5"><h6 className="font-black text-amber-950">Confirm {decisionAction === 'accept' ? 'acceptance' : 'decline'}</h6>{decisionAction === 'accept' ? <label className="mt-4 flex items-start gap-3 rounded-xl bg-white p-4 text-sm font-semibold leading-6 text-slate-800"><input checked={affirmed} className="mt-1 size-5 shrink-0" onChange={(event) => setAffirmed(event.target.checked)} type="checkbox" /><span>{INITIAL_SERVICE_PROPOSAL_ACCEPTANCE_TEXT}</span></label> : <label className="mt-4 block text-sm font-bold text-slate-800">Primary reason<select className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 font-normal" onChange={(event) => setDeclineReason(event.target.value)} value={declineReason}><option value="price">Price</option><option value="scope">Scope</option><option value="timing">Timing</option><option value="provider_fit">Provider fit</option><option value="no_longer_needed">No longer needed</option><option value="other">Other</option></select></label>}<label className="mt-4 block text-sm font-bold text-slate-800">Optional decision note<textarea className="mt-2 min-h-24 w-full rounded-xl border border-slate-300 bg-white p-3 font-normal" maxLength={1000} onChange={(event) => setDecisionNote(event.target.value)} placeholder="This note belongs to your decision. Use the proposal conversation above for questions or requested changes." value={decisionNote} /></label><div className="mt-4 flex flex-wrap gap-3"><button className={`min-h-12 rounded-xl px-5 font-black text-white disabled:opacity-60 ${decisionAction === 'accept' ? 'bg-emerald-800' : 'bg-slate-900'}`} disabled={busy || (decisionAction === 'accept' && !affirmed)} onClick={() => void decide(proposal)} type="button">{busy ? 'Confirming…' : decisionAction === 'accept' ? 'Accept this exact version' : 'Confirm decline'}</button><button className="min-h-12 rounded-xl border border-slate-400 bg-white px-5 font-bold" disabled={busy} onClick={() => setDecisionTarget(null)} type="button">Cancel</button></div></div> : null}
              </li>
            );
          })}
        </ol>
      ) : null}
    </section>
  );
}
