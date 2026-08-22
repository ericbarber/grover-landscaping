import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiRequestError } from '../api/apiError';
import {
  decideOwnerInitialServiceProposal,
  fetchOwnerInitialServiceProposals,
  type OwnerProviderAssessment,
  type OwnerProviderConnectionProgress,
} from '../api/ownerAcquisitionClient';
import {
  canDecideInitialServiceProposal,
  formatProposalMoney,
  INITIAL_SERVICE_PROPOSAL_ACCEPTANCE_TEXT,
  INITIAL_SERVICE_PROPOSAL_ACCEPTANCE_VERSION,
  proposalCadenceLabel,
  proposalPriceLabel,
  type InitialServiceProposal,
  type InitialServiceProposalDecisionAction,
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
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [decisionTarget, setDecisionTarget] = useState<string | null>(null);
  const [decisionAction, setDecisionAction] = useState<InitialServiceProposalDecisionAction>('accept');
  const [declineReason, setDeclineReason] = useState('price');
  const [decisionNote, setDecisionNote] = useState('');
  const [affirmed, setAffirmed] = useState(false);
  const keys = useRef(new Map<string, string>());

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setProposals(await fetchOwnerInitialServiceProposals(propertyId));
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
                {proposal.status === 'accepted' ? <p className="mt-5 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm font-semibold text-emerald-950">Accepted for provider setup only. The next phase must separately confirm the customer record and first service; nothing is scheduled here.</p> : null}
                {canDecide && !decisionOpen ? <div className="mt-5 flex flex-wrap gap-3"><button className="min-h-12 rounded-xl bg-emerald-800 px-5 font-black text-white" onClick={() => openDecision(proposal, 'accept')} type="button">Review and accept</button><button className="min-h-12 rounded-xl border border-slate-400 px-5 font-bold text-slate-900" onClick={() => openDecision(proposal, 'decline')} type="button">Decline proposal</button></div> : null}
                {decisionOpen ? <div className="mt-5 rounded-2xl border border-amber-300 bg-amber-50 p-5"><h6 className="font-black text-amber-950">Confirm {decisionAction === 'accept' ? 'acceptance' : 'decline'}</h6>{decisionAction === 'accept' ? <label className="mt-4 flex items-start gap-3 rounded-xl bg-white p-4 text-sm font-semibold leading-6 text-slate-800"><input checked={affirmed} className="mt-1 size-5 shrink-0" onChange={(event) => setAffirmed(event.target.checked)} type="checkbox" /><span>{INITIAL_SERVICE_PROPOSAL_ACCEPTANCE_TEXT}</span></label> : <label className="mt-4 block text-sm font-bold text-slate-800">Primary reason<select className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 font-normal" onChange={(event) => setDeclineReason(event.target.value)} value={declineReason}><option value="price">Price</option><option value="scope">Scope</option><option value="timing">Timing</option><option value="provider_fit">Provider fit</option><option value="no_longer_needed">No longer needed</option><option value="other">Other</option></select></label>}<label className="mt-4 block text-sm font-bold text-slate-800">Optional decision note<textarea className="mt-2 min-h-24 w-full rounded-xl border border-slate-300 bg-white p-3 font-normal" maxLength={1000} onChange={(event) => setDecisionNote(event.target.value)} placeholder="This note belongs to your decision. Use the assessment conversation for questions; a separate proposal-change workflow is not active yet." value={decisionNote} /></label><div className="mt-4 flex flex-wrap gap-3"><button className={`min-h-12 rounded-xl px-5 font-black text-white disabled:opacity-60 ${decisionAction === 'accept' ? 'bg-emerald-800' : 'bg-slate-900'}`} disabled={busy || (decisionAction === 'accept' && !affirmed)} onClick={() => void decide(proposal)} type="button">{busy ? 'Confirming…' : decisionAction === 'accept' ? 'Accept this exact version' : 'Confirm decline'}</button><button className="min-h-12 rounded-xl border border-slate-400 bg-white px-5 font-bold" disabled={busy} onClick={() => setDecisionTarget(null)} type="button">Cancel</button></div></div> : null}
              </li>
            );
          })}
        </ol>
      ) : null}
    </section>
  );
}
