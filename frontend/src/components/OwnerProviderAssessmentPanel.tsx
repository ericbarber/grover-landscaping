import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiRequestError, isApiErrorCode } from '../api/apiError';
import {
  createOwnerProviderAssessmentMessage,
  decideOwnerProviderAssessmentWindow,
  fetchOwnerProviderAssessmentMessages,
  fetchOwnerProviderAssessments,
  type OwnerProviderAssessment,
  type OwnerProviderAssessmentMessage,
  type OwnerProviderConnectionProgress,
} from '../api/ownerAcquisitionClient';

type AssessmentTone = 'attention' | 'active' | 'complete' | 'closed';

export function ownerAssessmentStatus(status: OwnerProviderAssessment['status']): {
  label: string;
  detail: string;
  tone: AssessmentTone;
  terminal: boolean;
} {
  const values: Record<OwnerProviderAssessment['status'], {
    label: string; detail: string; tone: AssessmentTone; terminal: boolean;
  }> = {
    remote_review: {
      label: 'Remote review ready',
      detail: 'The provider can review only the information you approved.',
      tone: 'active', terminal: false,
    },
    window_proposed: {
      label: 'Assessment time needs your review',
      detail: 'Confirm this proposed window or ask the provider for another time.',
      tone: 'attention', terminal: false,
    },
    window_change_requested: {
      label: 'Different time requested',
      detail: 'The provider needs to propose another assessment window.',
      tone: 'attention', terminal: false,
    },
    owner_confirmed: {
      label: 'Assessment time confirmed',
      detail: 'This confirms only the assessment appointment—not ongoing service.',
      tone: 'active', terminal: false,
    },
    in_progress: {
      label: 'Assessment in progress',
      detail: 'The provider is reviewing the approved yard information.',
      tone: 'active', terminal: false,
    },
    completed: {
      label: 'Assessment completed',
      detail: 'Review the provider’s customer-safe outcome before any proposal decision.',
      tone: 'complete', terminal: true,
    },
    cannot_assess: {
      label: 'Provider could not complete the assessment',
      detail: 'Review the explanation and decide whether another assessment is needed.',
      tone: 'closed', terminal: true,
    },
    cancelled: {
      label: 'Assessment cancelled',
      detail: 'No service was accepted or scheduled by this assessment.',
      tone: 'closed', terminal: true,
    },
  };
  return values[status];
}

function assessmentError(error: unknown, fallback: string): string {
  if (error instanceof ApiRequestError || error instanceof Error) return error.message;
  return fallback;
}

function formatWindow(assessment: OwnerProviderAssessment): string | null {
  if (!assessment.proposedWindowStartEpochSeconds || !assessment.proposedWindowEndEpochSeconds) {
    return null;
  }
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
    ...(assessment.timeZone ? { timeZone: assessment.timeZone } : {}),
  };
  const start = new Date(assessment.proposedWindowStartEpochSeconds * 1000);
  const end = new Date(assessment.proposedWindowEndEpochSeconds * 1000);
  try {
    return `${start.toLocaleString(undefined, options)} – ${end.toLocaleTimeString(undefined, {
      hour: 'numeric', minute: '2-digit',
      ...(assessment.timeZone ? { timeZone: assessment.timeZone } : {}),
    })}${assessment.timeZone ? ` · ${assessment.timeZone.replace(/_/g, ' ')}` : ''}`;
  } catch {
    return `${start.toLocaleString()} – ${end.toLocaleTimeString()}`;
  }
}

function messageLabel(message: OwnerProviderAssessmentMessage): string {
  return {
    owner_question: 'Your question',
    provider_answer: 'Provider answer',
    window_change_request: message.authorRole === 'owner'
      ? 'Your timing request'
      : 'Provider timing update',
    additional_photo_request: 'Provider photo request',
    clarification: message.authorRole === 'owner' ? 'Your clarification' : 'Provider clarification',
  }[message.messageKind];
}

const keyFor = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;

export function OwnerProviderAssessmentPanel({
  propertyId,
  connections,
}: {
  propertyId: string;
  connections: OwnerProviderConnectionProgress[];
}) {
  const [assessments, setAssessments] = useState<OwnerProviderAssessment[]>([]);
  const [messages, setMessages] = useState<Record<string, OwnerProviderAssessmentMessage[]>>({});
  const [loading, setLoading] = useState(true);
  const [busyAssessmentId, setBusyAssessmentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [conversationError, setConversationError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [messageKinds, setMessageKinds] = useState<Record<string, 'owner_question' | 'window_change_request' | 'clarification'>>({});
  const decisionKeys = useRef(new Map<string, string>());
  const messageKeys = useRef(new Map<string, string>());

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setConversationError(null);
    try {
      const loaded = await fetchOwnerProviderAssessments(propertyId);
      setAssessments(loaded);
      const messageResults = await Promise.all(loaded.map(async (assessment) => {
        try {
          return [assessment.assessmentId, await fetchOwnerProviderAssessmentMessages(
            propertyId, assessment.assessmentId,
          )] as const;
        } catch {
          return [assessment.assessmentId, null] as const;
        }
      }));
      const availableMessages: Record<string, OwnerProviderAssessmentMessage[]> = {};
      let unavailable = false;
      messageResults.forEach(([assessmentId, entries]) => {
        if (entries) availableMessages[assessmentId] = entries;
        else unavailable = true;
      });
      setMessages(availableMessages);
      if (unavailable) {
        setConversationError('Some assessment messages could not be loaded. Existing messages are unchanged.');
      }
    } catch (loadError) {
      setAssessments([]);
      setMessages({});
      setError(assessmentError(loadError, 'Assessment progress could not be loaded.'));
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    setNotice(null);
    setDrafts({});
    decisionKeys.current.clear();
    messageKeys.current.clear();
    void load();
  }, [load]);

  function replaceAssessment(updated: OwnerProviderAssessment) {
    setAssessments((current) => current.map((assessment) => (
      assessment.assessmentId === updated.assessmentId ? updated : assessment
    )));
  }

  async function decideWindow(
    assessment: OwnerProviderAssessment,
    action: 'confirm' | 'request_change',
  ) {
    const keyId = `${assessment.assessmentId}:${action}`;
    const idempotencyKey = decisionKeys.current.get(keyId) ?? keyFor('owner-assessment-window');
    decisionKeys.current.set(keyId, idempotencyKey);
    setBusyAssessmentId(assessment.assessmentId);
    setError(null);
    setNotice(null);
    try {
      const updated = await decideOwnerProviderAssessmentWindow(
        propertyId, assessment, action, idempotencyKey,
      );
      replaceAssessment(updated);
      decisionKeys.current.delete(keyId);
      setNotice(action === 'confirm'
        ? 'Assessment time confirmed. This did not accept service or schedule recurring care.'
        : 'A different assessment time was requested. Add timing details in the conversation if helpful.');
    } catch (decisionError) {
      setError(assessmentError(
        decisionError,
        'The assessment-time decision could not be confirmed. Reload before retrying.',
      ));
      if (isApiErrorCode(decisionError, 'owner_provider_assessment_window_decision_conflict')) {
        await load();
      }
    } finally {
      setBusyAssessmentId(null);
    }
  }

  async function sendMessage(assessment: OwnerProviderAssessment) {
    const body = drafts[assessment.assessmentId]?.trim() ?? '';
    if (!body) {
      setConversationError('Enter a question or clarification before sending.');
      return;
    }
    const messageKind = messageKinds[assessment.assessmentId] ?? 'owner_question';
    const keyId = assessment.assessmentId;
    const idempotencyKey = messageKeys.current.get(keyId) ?? keyFor('owner-assessment-message');
    messageKeys.current.set(keyId, idempotencyKey);
    setBusyAssessmentId(assessment.assessmentId);
    setConversationError(null);
    setNotice(null);
    try {
      const created = await createOwnerProviderAssessmentMessage(
        propertyId, assessment, messageKind, body, idempotencyKey,
      );
      setMessages((current) => ({
        ...current,
        [assessment.assessmentId]: [...(current[assessment.assessmentId] ?? []), created],
      }));
      setDrafts((current) => ({ ...current, [assessment.assessmentId]: '' }));
      messageKeys.current.delete(keyId);
      setNotice('Your assessment message was saved for this provider. It did not make a service decision.');
    } catch (messageError) {
      setConversationError(assessmentError(
        messageError,
        'Your message could not be confirmed. It remains in the form so you can retry.',
      ));
    } finally {
      setBusyAssessmentId(null);
    }
  }

  const hasAssessmentReadyConnection = connections.some((connection) => (
    connection.progressStage === 'assessment_access_approved'
  ));

  return (
    <section aria-labelledby="owner-assessment-title" className="mt-7 rounded-2xl border border-violet-200 bg-violet-50 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-800">Assessment</p>
          <h4 className="mt-2 text-xl font-black text-slate-950" id="owner-assessment-title">
            Review the yard before agreeing on care
          </h4>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-700">
            An assessment verifies context for a provider-authored proposal. It does not accept pricing,
            create a customer account, assign a crew, or schedule ongoing service.
          </p>
        </div>
        <button className="min-h-11 rounded-lg border border-violet-700 bg-white px-4 text-sm font-bold text-violet-900 disabled:opacity-60" disabled={loading} onClick={() => void load()} type="button">
          {loading ? 'Refreshing…' : 'Refresh assessments'}
        </button>
      </div>

      {notice ? <p className="mt-4 rounded-xl border border-emerald-200 bg-white p-4 text-sm font-semibold text-emerald-950" role="status">{notice}</p> : null}
      {error ? <div className="mt-4 rounded-xl border border-rose-300 bg-white p-4" role="alert"><strong className="text-rose-950">Assessment progress is unavailable.</strong><p className="mt-1 text-sm text-rose-900">{error} Existing assessment state is unchanged.</p></div> : null}
      {conversationError ? <p className="mt-4 rounded-xl border border-amber-300 bg-white p-4 text-sm font-semibold text-amber-950" role="alert">{conversationError}</p> : null}

      {loading && assessments.length === 0 ? (
        <p className="mt-5 rounded-xl bg-white p-4 text-sm font-semibold text-slate-600" role="status">Loading assessment progress…</p>
      ) : assessments.length === 0 && !error ? (
        <div className="mt-5 rounded-xl border border-dashed border-violet-300 bg-white/70 p-4">
          <strong className="text-slate-900">{hasAssessmentReadyConnection ? 'Waiting for the provider to start the assessment' : 'No assessment has started yet'}</strong>
          <p className="mt-1 text-sm leading-6 text-slate-600">{hasAssessmentReadyConnection
            ? 'Your approved access is ready. The provider must explicitly start a remote review or propose an on-site window.'
            : 'Assessment planning appears only after a provider expresses interest and you approve provider-specific access.'}</p>
        </div>
      ) : (
        <ul className="mt-5 grid gap-4">
          {assessments.map((assessment) => {
            const status = ownerAssessmentStatus(assessment.status);
            const providerName = connections.find((connection) => (
              connection.invitationId === assessment.invitationId
            ))?.providerName ?? 'Connected provider';
            const assessmentMessages = messages[assessment.assessmentId] ?? [];
            const windowLabel = formatWindow(assessment);
            const busy = busyAssessmentId === assessment.assessmentId;
            return (
              <li className="rounded-2xl border border-violet-200 bg-white p-5" key={assessment.assessmentId}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-violet-700">{assessment.assessmentMethod === 'remote' ? 'Remote assessment' : 'On-site assessment'} · {providerName}</p>
                    <h5 className="mt-1 text-lg font-black text-slate-950">{status.label}</h5>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{status.detail}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide ${
                    status.tone === 'complete' ? 'bg-emerald-100 text-emerald-900'
                      : status.tone === 'attention' ? 'bg-amber-100 text-amber-950'
                        : status.tone === 'closed' ? 'bg-slate-200 text-slate-800'
                          : 'bg-violet-100 text-violet-900'
                  }`}>Version {assessment.version}</span>
                </div>

                {windowLabel ? <p className="mt-4 rounded-xl bg-violet-50 p-4 text-sm font-bold text-violet-950">{windowLabel}</p> : null}
                {assessment.ownerVisibleSummary ? <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4"><strong className="text-sm text-emerald-950">Provider outcome</strong><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-emerald-900">{assessment.ownerVisibleSummary}</p></div> : null}

                {assessment.status === 'window_proposed' ? (
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button className="min-h-12 rounded-xl bg-violet-800 px-5 font-black text-white disabled:opacity-60" disabled={busy} onClick={() => void decideWindow(assessment, 'confirm')} type="button">Confirm assessment time</button>
                    <button className="min-h-12 rounded-xl border border-violet-300 px-5 font-bold text-violet-950 disabled:opacity-60" disabled={busy} onClick={() => void decideWindow(assessment, 'request_change')} type="button">Request a different time</button>
                  </div>
                ) : null}

                <div className="mt-5 border-t border-violet-100 pt-5">
                  <h6 className="font-black text-slate-900">Assessment conversation</h6>
                  {assessmentMessages.length > 0 ? (
                    <ol className="mt-3 space-y-3">
                      {assessmentMessages.map((entry) => (
                        <li className={`rounded-xl p-4 ${entry.authorRole === 'owner' ? 'ml-4 bg-emerald-50' : 'mr-4 bg-violet-50'}`} key={entry.messageId}>
                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                            <span>{messageLabel(entry)}</span>
                            <time dateTime={new Date(entry.createdAtEpochSeconds * 1000).toISOString()}>{new Date(entry.createdAtEpochSeconds * 1000).toLocaleString()}</time>
                          </div>
                          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-800">{entry.customerSafeBody}</p>
                        </li>
                      ))}
                    </ol>
                  ) : <p className="mt-2 text-sm text-slate-600">No customer-safe messages yet. Provider-private notes never appear here.</p>}

                  {!status.terminal ? (
                    <div className="mt-4 grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <label className="text-sm font-bold text-slate-800">
                        Message type
                        <select className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3" onChange={(event) => setMessageKinds((current) => ({ ...current, [assessment.assessmentId]: event.target.value as 'owner_question' | 'window_change_request' | 'clarification' }))} value={messageKinds[assessment.assessmentId] ?? 'owner_question'}>
                          <option value="owner_question">Question for the provider</option>
                          <option value="window_change_request">Assessment timing details</option>
                          <option value="clarification">Clarification</option>
                        </select>
                      </label>
                      <label className="text-sm font-bold text-slate-800">
                        Customer-safe message
                        <textarea className="mt-2 min-h-28 w-full rounded-xl border border-slate-300 bg-white p-3 font-normal" maxLength={2000} onChange={(event) => setDrafts((current) => ({ ...current, [assessment.assessmentId]: event.target.value }))} placeholder="Ask about the assessment without including alarm codes, payment details, or other secrets." value={drafts[assessment.assessmentId] ?? ''} />
                      </label>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-xs leading-5 text-slate-500">Visible to you and this provider. Provider-private operating notes are stored separately.</p>
                        <button className="min-h-11 rounded-lg bg-slate-900 px-4 text-sm font-black text-white disabled:opacity-60" disabled={busy || !(drafts[assessment.assessmentId]?.trim())} onClick={() => void sendMessage(assessment)} type="button">{busy ? 'Saving…' : 'Send assessment message'}</button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
