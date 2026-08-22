import { useEffect, useRef, useState } from 'react';
import { ApiRequestError } from '../api/apiError';
import { publishProviderInitialServiceProposal } from '../api/providerInvitationClient';
import {
  proposalCadenceLabel,
  proposalLines,
  proposalPriceLabel,
  type InitialServiceCadence,
  type InitialServicePriceBasis,
  type InitialServiceProposal,
} from '../domain/initialServiceProposals';

const defaultExpiration = () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
  .toISOString().slice(0, 16);

function proposalError(error: unknown): string {
  return error instanceof ApiRequestError || error instanceof Error
    ? error.message : 'The proposal could not be confirmed.';
}

export function canReviseProviderProposal(proposal?: InitialServiceProposal): boolean {
  return !proposal || ['sent', 'declined', 'expired'].includes(proposal.status);
}

export function ProviderInitialServiceProposalPanel({
  token,
  assessmentId,
  proposal,
  onPublished,
}: {
  token: string;
  assessmentId: string;
  proposal?: InitialServiceProposal;
  onPublished: (proposal: InitialServiceProposal) => void;
}) {
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [scope, setScope] = useState('');
  const [exclusions, setExclusions] = useState('');
  const [cadence, setCadence] = useState<InitialServiceCadence>('every_two_weeks');
  const [cadenceDetail, setCadenceDetail] = useState('One visit every two weeks');
  const [arrivalPolicy, setArrivalPolicy] = useState('We will confirm the service day before the first visit.');
  const [weatherPolicy, setWeatherPolicy] = useState('Unsafe weather may move the visit after owner notice.');
  const [cancellationPolicy, setCancellationPolicy] = useState('Cancel at least 24 hours before a confirmed visit.');
  const [proofExpectation, setProofExpectation] = useState('A completion note and customer-safe photos follow each visit.');
  const [price, setPrice] = useState('');
  const [priceBasis, setPriceBasis] = useState<InitialServicePriceBasis>('per_visit');
  const [expiresAt, setExpiresAt] = useState(defaultExpiration);
  const [revisionNote, setRevisionNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const idempotencyKey = useRef<string | null>(null);

  useEffect(() => {
    if (!proposal) return;
    setTitle(proposal.title);
    setSummary(proposal.customerSummary);
    setScope(proposal.includedScope.join('\n'));
    setExclusions(proposal.exclusions.join('\n'));
    setCadence(proposal.cadenceCode);
    setCadenceDetail(proposal.cadenceDetail);
    setArrivalPolicy(proposal.arrivalPolicy);
    setWeatherPolicy(proposal.weatherPolicy);
    setCancellationPolicy(proposal.cancellationPolicy);
    setProofExpectation(proposal.proofExpectation);
    setPrice((proposal.priceAmountMinor / 100).toFixed(2));
    setPriceBasis(proposal.priceBasis);
    setExpiresAt(defaultExpiration());
    setRevisionNote('');
    idempotencyKey.current = null;
  }, [proposal?.proposalId]);

  async function publish() {
    const includedScope = proposalLines(scope);
    const excludedScope = proposalLines(exclusions);
    const amount = Number(price);
    const expiration = Math.floor(new Date(expiresAt).getTime() / 1000);
    const now = Math.floor(Date.now() / 1000);
    if (!title.trim() || !summary.trim() || !cadenceDetail.trim()
      || !arrivalPolicy.trim() || !weatherPolicy.trim() || !cancellationPolicy.trim()
      || !proofExpectation.trim() || includedScope.length === 0 || excludedScope.length === 0) {
      setError('Complete every customer-visible field and include at least one scope item and exclusion.');
      return;
    }
    if (!/^\d+(\.\d{1,2})?$/.test(price.trim()) || !Number.isFinite(amount) || amount <= 0) {
      setError('Enter a valid price with no more than two decimal places.');
      return;
    }
    if (!expiration || expiration < now + 60 * 60 || expiration > now + 30 * 24 * 60 * 60) {
      setError('Choose an expiration between one hour and 30 days from now.');
      return;
    }
    if (proposal && !revisionNote.trim()) {
      setError('Explain what changed before publishing a revised version.');
      return;
    }
    idempotencyKey.current ??= `provider-proposal-${crypto.randomUUID()}`;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const published = await publishProviderInitialServiceProposal(token, assessmentId, {
        expectedProposalVersion: proposal?.proposalVersion ?? 0,
        title: title.trim(),
        customerSummary: summary.trim(),
        includedScope,
        exclusions: excludedScope,
        cadenceCode: cadence,
        cadenceDetail: cadenceDetail.trim(),
        arrivalPolicy: arrivalPolicy.trim(),
        weatherPolicy: weatherPolicy.trim(),
        cancellationPolicy: cancellationPolicy.trim(),
        proofExpectation: proofExpectation.trim(),
        priceAmountMinor: Math.round(amount * 100),
        priceBasis,
        currencyCode: 'USD',
        revisionNote: proposal ? revisionNote.trim() : undefined,
        expiresAtEpochSeconds: expiration,
      }, idempotencyKey.current);
      idempotencyKey.current = null;
      onPublished(published);
      setNotice(`Proposal version ${published.proposalVersion} was sent to the owner. Nothing was scheduled or activated.`);
    } catch (publishError) {
      setError(proposalError(publishError));
    } finally {
      setBusy(false);
    }
  }

  const editable = canReviseProviderProposal(proposal);
  return (
    <section aria-labelledby="provider-proposal-title" className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-800">Initial service proposal</p>
      <h3 className="mt-2 text-xl font-black text-slate-950" id="provider-proposal-title">
        Turn the completed assessment into a customer-safe offer
      </h3>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
        Put only owner-visible scope, cadence, policies, and price here. Keep measurements,
        labor estimates, margin, and route fit in provider-private notes.
      </p>

      {proposal ? (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-white p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><strong className="text-slate-950">Version {proposal.proposalVersion}: {proposal.title}</strong><p className="mt-1 text-sm text-slate-600">{proposalPriceLabel(proposal)} · {proposalCadenceLabel(proposal.cadenceCode)}</p></div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-slate-800">{proposal.status}</span>
          </div>
          {proposal.status === 'accepted' ? <p className="mt-3 text-sm font-semibold text-emerald-950">The owner accepted this exact version for provider setup. It did not create a visit, collect payment, or assign a crew.</p> : null}
        </div>
      ) : null}
      {notice ? <p className="mt-4 rounded-xl border border-emerald-300 bg-white p-4 text-sm font-semibold text-emerald-950" role="status">{notice}</p> : null}
      {error ? <p className="mt-4 rounded-xl border border-rose-300 bg-white p-4 text-sm font-semibold text-rose-950" role="alert">{error} Your entries remain available to retry.</p> : null}

      {editable ? (
        <div className="mt-5 grid gap-4 rounded-2xl bg-white p-5">
          <div className="grid gap-4 lg:grid-cols-2">
            <label className="text-sm font-bold text-slate-800">Proposal title<input className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-3 font-normal" maxLength={160} onChange={(event) => setTitle(event.target.value)} value={title} /></label>
            <label className="text-sm font-bold text-slate-800">Price (USD)<input className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-3 font-normal" inputMode="decimal" min="0.01" onChange={(event) => setPrice(event.target.value)} placeholder="120.00" step="0.01" type="number" value={price} /></label>
          </div>
          <label className="text-sm font-bold text-slate-800">Customer summary<textarea className="mt-2 min-h-24 w-full rounded-xl border border-slate-300 p-3 font-normal" maxLength={2000} onChange={(event) => setSummary(event.target.value)} value={summary} /></label>
          <div className="grid gap-4 lg:grid-cols-2">
            <label className="text-sm font-bold text-slate-800">Included scope · one item per line<textarea className="mt-2 min-h-32 w-full rounded-xl border border-slate-300 p-3 font-normal" onChange={(event) => setScope(event.target.value)} value={scope} /></label>
            <label className="text-sm font-bold text-slate-800">Exclusions · one item per line<textarea className="mt-2 min-h-32 w-full rounded-xl border border-slate-300 p-3 font-normal" onChange={(event) => setExclusions(event.target.value)} value={exclusions} /></label>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <label className="text-sm font-bold text-slate-800">Cadence<select className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 font-normal" onChange={(event) => setCadence(event.target.value as InitialServiceCadence)} value={cadence}><option value="weekly">Weekly</option><option value="every_two_weeks">Every two weeks</option><option value="monthly">Monthly</option><option value="one_time">One time</option><option value="custom">Custom</option></select></label>
            <label className="text-sm font-bold text-slate-800">Price basis<select className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 font-normal" onChange={(event) => setPriceBasis(event.target.value as InitialServicePriceBasis)} value={priceBasis}><option value="per_visit">Per visit</option><option value="monthly">Monthly</option><option value="fixed">Fixed</option></select></label>
            <label className="text-sm font-bold text-slate-800">Owner decision due<input className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-3 font-normal" onChange={(event) => setExpiresAt(event.target.value)} type="datetime-local" value={expiresAt} /></label>
          </div>
          <label className="text-sm font-bold text-slate-800">Cadence detail<input className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-3 font-normal" maxLength={1000} onChange={(event) => setCadenceDetail(event.target.value)} value={cadenceDetail} /></label>
          <div className="grid gap-4 lg:grid-cols-2">
            <label className="text-sm font-bold text-slate-800">Arrival policy<textarea className="mt-2 min-h-24 w-full rounded-xl border border-slate-300 p-3 font-normal" maxLength={1000} onChange={(event) => setArrivalPolicy(event.target.value)} value={arrivalPolicy} /></label>
            <label className="text-sm font-bold text-slate-800">Weather policy<textarea className="mt-2 min-h-24 w-full rounded-xl border border-slate-300 p-3 font-normal" maxLength={1000} onChange={(event) => setWeatherPolicy(event.target.value)} value={weatherPolicy} /></label>
            <label className="text-sm font-bold text-slate-800">Cancellation policy<textarea className="mt-2 min-h-24 w-full rounded-xl border border-slate-300 p-3 font-normal" maxLength={1000} onChange={(event) => setCancellationPolicy(event.target.value)} value={cancellationPolicy} /></label>
            <label className="text-sm font-bold text-slate-800">Completion proof expectation<textarea className="mt-2 min-h-24 w-full rounded-xl border border-slate-300 p-3 font-normal" maxLength={1000} onChange={(event) => setProofExpectation(event.target.value)} value={proofExpectation} /></label>
          </div>
          {proposal ? <label className="text-sm font-bold text-slate-800">What changed in this revision?<textarea className="mt-2 min-h-24 w-full rounded-xl border border-slate-300 p-3 font-normal" maxLength={1000} onChange={(event) => setRevisionNote(event.target.value)} value={revisionNote} /></label> : null}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
            <p className="max-w-2xl text-xs leading-5 text-slate-500">Publishing creates an immutable version for owner review. Acceptance authorizes only the next provider-setup step.</p>
            <button className="min-h-12 rounded-xl bg-emerald-800 px-5 font-black text-white disabled:opacity-60" disabled={busy} onClick={() => void publish()} type="button">{busy ? 'Publishing…' : proposal ? 'Publish revised version' : 'Send proposal to owner'}</button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
