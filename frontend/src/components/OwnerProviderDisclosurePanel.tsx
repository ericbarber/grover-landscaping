import { useEffect, useRef, useState } from 'react';
import {
  approveOwnerProviderDisclosure,
  fetchOwnerProviderDisclosureReceipts,
  fetchOwnerProviderDisclosureReview,
  revokeOwnerProviderDisclosure,
  type OwnerDisclosureCategory,
  type OwnerProviderConnectionProgress,
  type OwnerProviderDisclosureReceipt,
  type OwnerProviderDisclosureReview,
} from '../api/ownerAcquisitionClient';
import { ApiRequestError } from '../api/apiError';

const categoryCopy: Record<OwnerDisclosureCategory, { label: string; description: string }> = {
  exact_address: { label: 'Exact service address', description: 'The complete address for this yard.' },
  yard_brief: { label: 'Yard care brief', description: 'Areas, goals, cadence, and owner-authored care context.' },
  selected_yard_photos: { label: 'Selected yard photographs', description: 'Only the individual ready photos you choose below.' },
  owner_contact: { label: 'Owner contact', description: 'Your display name and verified contact route.' },
  access_considerations: { label: 'Access considerations', description: 'The access, pet, or priority notes in this brief.' },
};

const idempotencyKey = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;

export function OwnerProviderDisclosurePanel({
  propertyId,
  connections,
  onChanged,
}: {
  propertyId: string;
  connections: OwnerProviderConnectionProgress[];
  onChanged: () => Promise<void>;
}) {
  const [review, setReview] = useState<OwnerProviderDisclosureReview | null>(null);
  const [approved, setApproved] = useState<OwnerDisclosureCategory[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<string[]>([]);
  const [affirmed, setAffirmed] = useState(false);
  const [receipts, setReceipts] = useState<OwnerProviderDisclosureReceipt[]>([]);
  const [revokeTarget, setRevokeTarget] = useState<OwnerProviderDisclosureReceipt | null>(null);
  const [revokeReason, setRevokeReason] = useState('owner_choice');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const panelTitleRef = useRef<HTMLHeadingElement>(null);
  const reviewTitleRef = useRef<HTMLHeadingElement>(null);
  const revokeTitleRef = useRef<HTMLHeadingElement>(null);
  const approvalKeyRef = useRef<string | null>(null);
  const revokeKeyRef = useRef<string | null>(null);

  async function loadReceipts() {
    try { setReceipts(await fetchOwnerProviderDisclosureReceipts(propertyId)); }
    catch { setError('Assessment access history could not be loaded. Existing access is unchanged.'); }
  }

  useEffect(() => {
    setReview(null);
    setApproved([]);
    setSelectedMedia([]);
    setAffirmed(false);
    setError(null);
    setNotice(null);
    approvalKeyRef.current = null;
    revokeKeyRef.current = null;
    void loadReceipts();
  }, [propertyId]);

  useEffect(() => {
    if (review) reviewTitleRef.current?.focus();
  }, [review]);

  useEffect(() => {
    if (revokeTarget) revokeTitleRef.current?.focus();
  }, [revokeTarget]);

  async function openReview(invitationId: string) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      setReview(await fetchOwnerProviderDisclosureReview(propertyId, invitationId));
      approvalKeyRef.current = idempotencyKey('owner-disclosure');
      setApproved([]);
      setSelectedMedia([]);
      setAffirmed(false);
    } catch (loadError) {
      approvalKeyRef.current = null;
      setError(loadError instanceof Error ? loadError.message : 'The current disclosure review could not be loaded. Nothing new was shared.');
    } finally { setBusy(false); }
  }

  function toggleCategory(category: OwnerDisclosureCategory) {
    setApproved((current) => current.includes(category)
      ? current.filter((value) => value !== category)
      : [...current, category]);
    if (category === 'selected_yard_photos' && approved.includes(category)) setSelectedMedia([]);
    setAffirmed(false);
  }

  async function approve() {
    if (!review || approved.length === 0 || !affirmed) return;
    if (approved.includes('selected_yard_photos') && selectedMedia.length === 0) {
      setError('Choose at least one ready photograph or leave photographs withheld.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await approveOwnerProviderDisclosure(
        propertyId,
        review.invitationId,
        review,
        approved,
        selectedMedia,
        approvalKeyRef.current ??= idempotencyKey('owner-disclosure'),
      );
      approvalKeyRef.current = null;
      setReview(null);
      setApproved([]);
      setSelectedMedia([]);
      setAffirmed(false);
      setNotice('Selected assessment access was approved. This did not accept pricing or start service.');
      await Promise.all([loadReceipts(), onChanged()]);
    } catch (saveError) {
      if (saveError instanceof ApiRequestError && saveError.status === 409) {
        approvalKeyRef.current = null;
        setReview(null);
        await Promise.all([loadReceipts(), onChanged()]);
        setError('This assessment-access decision changed in another tab. Current access was reloaded; review it before trying again. Nothing new was shared by this attempt.');
      } else {
        setError(saveError instanceof Error ? saveError.message : 'Assessment access could not be confirmed. Nothing new was shared.');
      }
    } finally { setBusy(false); }
  }

  async function revoke() {
    if (!revokeTarget) return;
    setBusy(true);
    setError(null);
    try {
      await revokeOwnerProviderDisclosure(
        propertyId,
        revokeTarget,
        revokeReason,
        revokeKeyRef.current ??= idempotencyKey('owner-disclosure-revoke'),
      );
      revokeKeyRef.current = null;
      setRevokeTarget(null);
      setNotice('Future assessment access ended. The consent receipt remains in your history.');
      await Promise.all([loadReceipts(), onChanged()]);
    } catch (revokeError) {
      if (revokeError instanceof ApiRequestError && revokeError.status === 409) {
        revokeKeyRef.current = null;
        setRevokeTarget(null);
        await Promise.all([loadReceipts(), onChanged()]);
        setError('Assessment access changed in another tab. Current access was reloaded; review its status before trying again.');
      } else {
        setError(revokeError instanceof Error ? revokeError.message : 'Future access could not be confirmed as ended. Reload before retrying.');
      }
    } finally { setBusy(false); }
  }

  const reviewable = connections.filter((entry) => entry.progressStage === 'disclosure_decision');
  return (
    <section aria-labelledby="assessment-access-title" className="mt-7 rounded-2xl border border-sky-200 bg-sky-50 p-5">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-sky-800">Assessment access</p>
      <h4 className="mt-2 text-xl font-black focus:outline-none" id="assessment-access-title" ref={panelTitleRef} tabIndex={-1}>Share only what a provider needs to assess this yard</h4>
      <p className="mt-1 text-sm leading-6 text-slate-700">Every category starts unselected. Interest from a provider does not share details, accept pricing, assign a crew, or start service.</p>
      {error ? <p className="mt-4 rounded-xl border border-rose-300 bg-white p-4 text-sm text-rose-900" role="alert">{error}</p> : null}
      {notice ? <p className="mt-4 rounded-xl border border-emerald-300 bg-white p-4 text-sm text-emerald-950" role="status">{notice}</p> : null}

      {reviewable.length > 0 && !review ? <div className="mt-5 grid gap-3">{reviewable.map((entry) => (
        <button className="min-h-12 rounded-xl bg-sky-900 px-5 text-left font-black text-white disabled:opacity-60" disabled={busy} key={entry.invitationId} onClick={() => void openReview(entry.invitationId)} type="button">Review access for {entry.providerName}</button>
      ))}</div> : null}

      {review ? <div className="mt-5 rounded-2xl border border-sky-200 bg-white p-5">
        <h5 className="text-lg font-black focus:outline-none" ref={reviewTitleRef} tabIndex={-1}>Review access for {review.providerOrganizationName}</h5>
        <p className="mt-1 text-sm text-slate-600">{review.propertyName} · Brief version {review.briefVersion} · Ends {new Date(review.expiresAtEpochSeconds * 1000).toLocaleString()}</p>
        <fieldset className="mt-5"><legend className="font-black">Choose each category to share</legend><div className="mt-3 grid gap-3">
          {review.availableCategories.map((category) => <label className="flex cursor-pointer gap-3 rounded-xl border border-slate-200 p-4" key={category}><input checked={approved.includes(category)} className="mt-0.5 h-5 w-5 accent-sky-800" onChange={() => toggleCategory(category)} type="checkbox" /><span><strong className="block">{categoryCopy[category].label}</strong><span className="mt-1 block text-xs leading-5 text-slate-600">{categoryCopy[category].description}</span></span></label>)}
        </div></fieldset>
        {approved.includes('selected_yard_photos') ? <fieldset className="mt-5"><legend className="font-black">Choose individual photographs</legend>{review.mediaOptions.length === 0 ? <p className="mt-2 text-sm text-rose-800">No ready photographs are available. Leave photographs withheld.</p> : <div className="mt-3 grid gap-2 sm:grid-cols-2">{review.mediaOptions.map((media) => <label className="flex gap-3 rounded-xl border border-slate-200 p-3" key={media.mediaId}><input checked={selectedMedia.includes(media.mediaId)} className="mt-0.5 h-5 w-5" onChange={() => setSelectedMedia((current) => current.includes(media.mediaId) ? current.filter((id) => id !== media.mediaId) : [...current, media.mediaId])} type="checkbox" /><span className="break-all text-sm font-semibold">{media.fileLabel}</span></label>)}</div>}</fieldset> : null}
        <div className="mt-5 grid gap-3 rounded-xl bg-slate-50 p-4 text-sm leading-6"><p><strong>Sharing:</strong> {approved.length ? approved.map((item) => categoryCopy[item].label).join(', ') : 'Nothing selected yet'}</p><p><strong>Withholding:</strong> {review.availableCategories.filter((item) => !approved.includes(item)).map((item) => categoryCopy[item].label).join(', ') || 'No categories'}</p><p>{review.retentionNotice}</p><p className="font-bold text-slate-900">{review.authorityBoundary}</p></div>
        <label className="mt-5 flex gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4"><input checked={affirmed} className="mt-0.5 h-5 w-5" onChange={(event) => setAffirmed(event.target.checked)} type="checkbox" /><span className="text-sm leading-6">I approve only the selected items for {review.providerOrganizationName} to assess this yard.</span></label>
        <div className="mt-5 flex flex-wrap gap-3"><button className="min-h-12 rounded-xl bg-sky-900 px-5 font-black text-white disabled:opacity-50" disabled={busy || !affirmed || approved.length === 0} onClick={() => void approve()} type="button">{busy ? 'Approving…' : 'Approve selected assessment access'}</button><button className="min-h-12 rounded-xl px-4 font-bold" disabled={busy} onClick={() => { approvalKeyRef.current = null; setReview(null); requestAnimationFrame(() => panelTitleRef.current?.focus()); }} type="button">Cancel without sharing</button></div>
      </div> : null}

        <div className="mt-6"><h5 className="font-black">Access history</h5>{receipts.length === 0 ? <p className="mt-2 text-sm text-slate-600">No assessment access has been approved for this property.</p> : <ul className="mt-3 grid gap-3">{receipts.map((receipt) => <li className="rounded-xl border border-sky-200 bg-white p-4" key={receipt.receiptId}><div className="flex flex-wrap justify-between gap-3"><div><strong>{receipt.organizationName}</strong><p className="mt-1 text-xs text-slate-600">Approved {new Date(receipt.affirmedAtEpochSeconds * 1000).toLocaleString()}</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase">{receipt.status}</span></div><p className="mt-3 text-sm"><strong>Shared:</strong> {receipt.approvedCategories.map((item) => categoryCopy[item].label).join(', ')}</p><p className="mt-2 text-sm"><strong>Withheld:</strong> {receipt.withheldCategories.map((item) => categoryCopy[item].label).join(', ')}</p>{receipt.selectedPhotos.length ? <p className="mt-2 text-sm"><strong>Photos:</strong> {receipt.selectedPhotos.map((photo) => photo.fileLabel).join(', ')}</p> : null}{receipt.status === 'active' ? <button className="mt-4 min-h-11 rounded-lg border border-rose-400 px-4 text-sm font-bold text-rose-900" onClick={() => { revokeKeyRef.current = idempotencyKey('owner-disclosure-revoke'); setRevokeReason('owner_choice'); setRevokeTarget(receipt); }} type="button">End future assessment access</button> : null}</li>)}</ul>}</div>
      {revokeTarget ? <section aria-labelledby="revoke-access-title" className="mt-5 rounded-2xl border-2 border-rose-400 bg-white p-5"><h5 className="text-lg font-black focus:outline-none" id="revoke-access-title" ref={revokeTitleRef} tabIndex={-1}>End future access for {revokeTarget.organizationName}?</h5><p className="mt-2 text-sm leading-6 text-slate-700">New access ends immediately. Information already viewed, the immutable consent receipt, and legally retained records are not erased.</p><label className="mt-4 block text-sm font-bold">Reason<select className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3" onChange={(event) => setRevokeReason(event.target.value)} value={revokeReason}><option value="owner_choice">I no longer want to share</option><option value="assessment_complete">Assessment is complete</option><option value="provider_changed">I changed providers</option><option value="incorrect_details">The shared details need correction</option><option value="privacy_concern">Privacy concern</option></select></label><div className="mt-5 flex gap-3"><button className="min-h-12 rounded-xl bg-rose-800 px-5 font-black text-white disabled:opacity-60" disabled={busy} onClick={() => void revoke()} type="button">{busy ? 'Ending access…' : 'Confirm and end future access'}</button><button className="min-h-12 rounded-xl px-4 font-bold" disabled={busy} onClick={() => { revokeKeyRef.current = null; setRevokeTarget(null); requestAnimationFrame(() => panelTitleRef.current?.focus()); }} type="button">Keep access active</button></div></section> : null}
    </section>
  );
}
