import { useState } from 'react';
import {
  convertProjectBid,
  revokeProjectBid,
  saveProjectBidDraft,
  sendProjectBid,
} from '../api/projectBidsClient';
import { isApiErrorCode } from '../api/apiError';
import {
  bidDeliveryRecipientIsValid,
  bidDeliveryStatusLabel,
  type BidDeliveryChannel,
} from '../domain/bidDelivery';
import {
  bidDollarsToCents,
  projectBidDraftIsValid,
  projectBidDraftTotalCents,
  type ProjectBidDraftLine,
} from '../domain/projectBidDraft';
import type { DayPlanAmendmentRequest, ProjectBid } from '../domain/stopProgress';

type ManagerProjectBidEditorProps = {
  amendment: DayPlanAmendmentRequest;
  dayPlanId: string;
  existingBid?: ProjectBid;
  onSaved: (bid: ProjectBid) => void;
};

function initialLines(
  amendment: DayPlanAmendmentRequest,
  existingBid?: ProjectBid,
): ProjectBidDraftLine[] {
  if (existingBid?.lineItems.length) {
    return existingBid.lineItems.map((item) => ({
      id: item.id,
      serviceId: item.service.id,
      serviceName: item.service.name,
      serviceDescription: item.service.description,
      quantity: String(item.quantity),
      unitPriceDollars: (item.unitPriceCents / 100).toFixed(2),
      note: item.note ?? '',
    }));
  }

  const service = amendment.service;
  return [{
    id: `${amendment.id}_source_line`,
    serviceId: service?.id ?? 'custom_service',
    serviceName: service?.name ?? '',
    serviceDescription: service?.description,
    quantity: '1',
    unitPriceDollars: ((service?.defaultPriceCents ?? 0) / 100).toFixed(2),
    note: '',
  }];
}

function currencyLabel(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function ManagerProjectBidEditor({
  amendment,
  dayPlanId,
  existingBid,
  onSaved,
}: ManagerProjectBidEditorProps) {
  const [lines, setLines] = useState<ProjectBidDraftLine[]>(() => initialLines(amendment, existingBid));
  const [customerMessage, setCustomerMessage] = useState(existingBid?.customerMessage ?? 'We found additional work during your scheduled service. Please review the proposed scope and price.');
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [deliveryChannel, setDeliveryChannel] = useState<BidDeliveryChannel>(existingBid?.deliveryChannel ?? 'email');
  const [deliveryRecipient, setDeliveryRecipient] = useState(existingBid?.deliveryRecipient ?? '');
  const [message, setMessage] = useState(existingBid ? 'Draft loaded from the manager workspace.' : 'Build a draft before sending it to the customer.');
  const totalCents = projectBidDraftTotalCents(lines);
  const isEditable = !existingBid || existingBid.status === 'draft';
  const canIssueLink = Boolean(
    existingBid?.persisted
      && (existingBid.status === 'draft' || (existingBid.status === 'sent' && existingBid.shareRevokedAt)),
  );

  function updateLine(id: string, update: Partial<ProjectBidDraftLine>) {
    setLines((current) => current.map((line) => (line.id === id ? { ...line, ...update } : line)));
  }

  function addLine() {
    const nonce = Date.now();
    setLines((current) => [
      ...current,
      {
        id: `${amendment.id}_custom_${nonce}`,
        serviceId: `custom_service_${nonce}`,
        serviceName: '',
        quantity: '1',
        unitPriceDollars: '0.00',
        note: '',
      },
    ]);
  }

  function saveDraft() {
    if (!projectBidDraftIsValid(lines)) return;

    setIsSaving(true);
    void saveProjectBidDraft(dayPlanId, amendment.id, {
      customerMessage: customerMessage.trim() || undefined,
      lineItems: lines.map((line) => ({
        serviceId: line.serviceId,
        serviceName: line.serviceName.trim(),
        serviceDescription: line.serviceDescription,
        quantity: Number(line.quantity),
        unitPriceCents: bidDollarsToCents(line.unitPriceDollars) ?? 0,
        note: line.note.trim() || undefined,
      })),
    })
      .then((bid) => {
        onSaved(bid);
        setMessage(bid.persisted ? 'Draft bid saved.' : 'Draft is local until the API can persist it.');
      })
      .catch((error: unknown) => setMessage(
        isApiErrorCode(error, 'project_bid_draft_unavailable')
          ? 'Bid storage is unavailable. The draft was not saved; retry after API readiness recovers.'
          : isApiErrorCode(error, 'project_bid_draft_conflict')
            ? 'This request is no longer eligible for a bid draft. Refresh amendment review.'
            : 'Draft bid could not be saved.',
      ))
      .finally(() => setIsSaving(false));
  }

  function sendBid() {
    if (!existingBid?.persisted || !canIssueLink || !bidDeliveryRecipientIsValid(deliveryChannel, deliveryRecipient)) return;

    setIsSending(true);
    void sendProjectBid(dayPlanId, existingBid.id, deliveryChannel, deliveryRecipient.trim())
      .then((bid) => {
        onSaved(bid);
        setMessage('Approval link issued and notification queued for provider delivery.');
      })
      .catch((error: unknown) => setMessage(
        isApiErrorCode(error, 'project_bid_notification_preference_blocked')
          ? 'Delivery blocked by this customer’s account preferences. Enable the selected channel and use the configured account recipient.'
          : 'Bid could not be sent. Confirm the draft is persisted and try again.',
      ))
      .finally(() => setIsSending(false));
  }

  function revokeBid() {
    if (!existingBid?.persisted || existingBid.status !== 'sent' || !existingBid.shareUrl) return;

    setIsRevoking(true);
    void revokeProjectBid(dayPlanId, existingBid.id)
      .then((bid) => {
        onSaved(bid);
        setMessage('Customer review link revoked. Reissue it when a new destination is ready.');
      })
      .catch((error: unknown) => setMessage(
        isApiErrorCode(error, 'project_bid_revoke_unavailable')
          ? 'Bid storage is unavailable. The customer link was not revoked.'
          : 'Customer review link could not be revoked.',
      ))
      .finally(() => setIsRevoking(false));
  }

  function convertBid() {
    if (!existingBid?.persisted || existingBid.status !== 'approved') return;

    setIsConverting(true);
    void convertProjectBid(dayPlanId, existingBid.id)
      .then((bid) => {
        onSaved(bid);
        setMessage('Approved bid converted into scheduled job add-ons.');
      })
      .catch((error: unknown) => setMessage(
        isApiErrorCode(error, 'project_bid_conversion_unavailable')
          ? 'Bid storage is unavailable. No job add-ons were created.'
          : 'Approved bid could not be converted to work.',
      ))
      .finally(() => setIsConverting(false));
  }

  return (
    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">Project bid workspace</p>
          <p className="mt-1 text-xs text-amber-900">{message}</p>
        </div>
        <span className="rounded-full bg-white px-2 py-1 text-xs font-bold text-amber-900">
          {existingBid?.status ?? 'draft'} · {currencyLabel(totalCents)}
        </span>
      </div>

      <fieldset className="disabled:opacity-70" disabled={!isEditable}>
      <div className="mt-3 space-y-3">
        {lines.map((line, index) => (
          <div key={line.id} className="rounded-lg border border-amber-200 bg-white p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-slate-700">Line item {index + 1}</p>
              {lines.length > 1 ? (
                <button className="text-xs font-semibold text-rose-700" onClick={() => setLines((current) => current.filter((item) => item.id !== line.id))} type="button">
                  Remove
                </button>
              ) : null}
            </div>
            <input className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs" onChange={(event) => updateLine(line.id, { serviceName: event.target.value })} placeholder="Service or material" value={line.serviceName} />
            <div className="mt-2 grid grid-cols-2 gap-2">
              <label className="text-[11px] font-semibold text-slate-600">
                Quantity
                <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs" min="1" onChange={(event) => updateLine(line.id, { quantity: event.target.value })} type="number" value={line.quantity} />
              </label>
              <label className="text-[11px] font-semibold text-slate-600">
                Unit price
                <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs" min="0" onChange={(event) => updateLine(line.id, { unitPriceDollars: event.target.value })} step="0.01" type="number" value={line.unitPriceDollars} />
              </label>
            </div>
            <input className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs" onChange={(event) => updateLine(line.id, { note: event.target.value })} placeholder="Optional line-item note" value={line.note} />
          </div>
        ))}
      </div>

      <button className="mt-3 rounded-full border border-amber-400 px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100" onClick={addLine} type="button">
        Add line item
      </button>

      <label className="mt-3 block text-xs font-semibold text-amber-950">
        Customer message
        <textarea className="mt-1 min-h-20 w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs text-slate-900" onChange={(event) => setCustomerMessage(event.target.value)} value={customerMessage} />
      </label>

      <button className="mt-3 w-full rounded-xl bg-amber-700 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-60" disabled={isSaving || !projectBidDraftIsValid(lines)} onClick={saveDraft} type="button">
        {isSaving ? 'Saving draft...' : existingBid ? 'Update draft bid' : 'Save draft bid'}
      </button>
      </fieldset>

      {canIssueLink ? (
        <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">Approval delivery</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-[120px_1fr]">
            <select className="rounded-lg border border-emerald-300 bg-white px-3 py-2 text-xs" onChange={(event) => setDeliveryChannel(event.target.value as BidDeliveryChannel)} value={deliveryChannel}>
              <option value="email">Email</option>
              <option value="sms">Text / SMS</option>
            </select>
            <input className="rounded-lg border border-emerald-300 bg-white px-3 py-2 text-xs" onChange={(event) => setDeliveryRecipient(event.target.value)} placeholder={deliveryChannel === 'email' ? 'customer@example.com' : '+16025550123'} value={deliveryRecipient} />
          </div>
          <button className="mt-2 w-full rounded-xl bg-emerald-700 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-60" disabled={isSending || !bidDeliveryRecipientIsValid(deliveryChannel, deliveryRecipient)} onClick={sendBid} type="button">
            {isSending ? 'Queueing delivery...' : existingBid?.shareRevokedAt ? 'Reissue link and queue delivery' : 'Issue link and queue delivery'}
          </button>
        </div>
      ) : null}

      {existingBid?.shareUrl ? (
        <div className="mt-2 rounded-lg bg-white p-3 text-xs text-slate-600">
          <a className="block break-all font-semibold text-emerald-800 underline" href={existingBid.shareUrl} rel="noreferrer" target="_blank">
            Customer review link: {existingBid.shareUrl}
          </a>
          <p className="mt-2">{bidDeliveryStatusLabel(existingBid.deliveryStatus)}{existingBid.deliveryChannel && existingBid.deliveryRecipient ? ` via ${existingBid.deliveryChannel} to ${existingBid.deliveryRecipient}` : ''}</p>
          {existingBid.shareExpiresAt ? <p className="mt-1">Link expires {new Date(existingBid.shareExpiresAt).toLocaleString()}.</p> : null}
          {existingBid.status === 'sent' ? (
            <button className="mt-2 rounded-full border border-rose-300 px-3 py-1.5 font-semibold text-rose-700 disabled:opacity-60" disabled={isRevoking} onClick={revokeBid} type="button">
              {isRevoking ? 'Revoking...' : 'Revoke customer link'}
            </button>
          ) : null}
        </div>
      ) : null}

      {existingBid?.shareRevokedAt ? (
        <p className="mt-2 rounded-lg bg-rose-50 p-2 text-xs font-semibold text-rose-800">Previous customer link revoked.</p>
      ) : null}

      {existingBid?.status === 'approved' ? (
        <button className="mt-3 w-full rounded-xl bg-sky-700 px-3 py-2 text-xs font-semibold text-white hover:bg-sky-800 disabled:opacity-60" disabled={isConverting} onClick={convertBid} type="button">
          {isConverting ? 'Scheduling add-ons...' : 'Convert approved bid to scheduled work'}
        </button>
      ) : null}

      {existingBid?.status === 'converted' && existingBid.convertedJobId ? (
        <p className="mt-3 rounded-xl bg-sky-50 p-3 text-xs font-semibold text-sky-900">
          Scheduled as add-on work for {existingBid.convertedJobId}.
        </p>
      ) : null}
    </div>
  );
}
