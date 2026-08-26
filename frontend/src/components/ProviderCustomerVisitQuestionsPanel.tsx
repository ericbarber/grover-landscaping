import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import {
  createProviderCustomerVisitResponse,
  fetchProviderCustomerVisitThread,
  fetchProviderCustomerVisitThreads,
} from '../api/customerVisitCommunicationClient';
import type {
  CustomerVisitMessage,
  CustomerVisitQuestionTopic,
  CustomerVisitThread,
  ProviderCustomerVisitThreadSummary,
} from '../domain/customerVisitCommunication';
import { WorkspaceStatusNotice } from './WorkspaceStatus';

const topicLabels: Record<CustomerVisitQuestionTopic, string> = {
  timing: 'Timing',
  preparation: 'Preparation',
  access: 'Property access',
  service_scope: 'Planned service',
  other: 'Something else',
};

export function unansweredCustomerQuestions(
  messages: CustomerVisitMessage[],
): CustomerVisitMessage[] {
  const answeredQuestionIds = new Set(
    messages
      .filter((message) => message.messageKind === 'provider_response')
      .map((message) => message.inReplyToMessageId)
      .filter((messageId): messageId is string => Boolean(messageId)),
  );
  return messages.filter(
    (message) => message.messageKind === 'customer_question'
      && !answeredQuestionIds.has(message.messageId),
  );
}

function serviceDateLabel(value: string): string {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  });
}

function VisitQueueItem({
  selected,
  summary,
  onSelect,
}: {
  selected: boolean;
  summary: ProviderCustomerVisitThreadSummary;
  onSelect: () => void;
}) {
  return (
    <button
      aria-pressed={selected}
      className={`w-full rounded-2xl border p-4 text-left ${
        selected
          ? 'border-emerald-700 bg-emerald-50'
          : 'border-slate-200 bg-white hover:border-emerald-300'
      }`}
      onClick={onSelect}
      type="button"
    >
      <span className="flex flex-wrap items-start justify-between gap-2">
        <span>
          <span className="block font-black text-forest">{summary.customerName}</span>
          <span className="mt-1 block text-xs font-semibold text-slate-600">
            {summary.propertyDisplayName} · {serviceDateLabel(summary.serviceDate)}
          </span>
        </span>
        <span className={`rounded-full px-2.5 py-1 text-[0.68rem] font-black uppercase tracking-wide ${
          summary.awaitingProviderResponse
            ? 'bg-amber-100 text-amber-950'
            : 'bg-slate-100 text-slate-600'
        }`}>
          {summary.awaitingProviderResponse ? 'Needs response' : 'Responded'}
        </span>
      </span>
      <span className="mt-3 block text-sm font-bold text-slate-800">{summary.serviceTitle}</span>
      {summary.latestMessage ? (
        <span className="mt-1 line-clamp-2 block text-xs leading-5 text-slate-600">
          {summary.latestMessage.customerSafeBody}
        </span>
      ) : null}
    </button>
  );
}

export function ProviderCustomerVisitQuestionsPanel() {
  const [queue, setQueue] = useState<ProviderCustomerVisitThreadSummary[]>([]);
  const [queueLoading, setQueueLoading] = useState(true);
  const [queueError, setQueueError] = useState<string | null>(null);
  const [selectedReference, setSelectedReference] = useState<string | null>(null);
  const [thread, setThread] = useState<CustomerVisitThread | null>(null);
  const [threadLoading, setThreadLoading] = useState(false);
  const [threadError, setThreadError] = useState<string | null>(null);
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const retryKey = useRef<string | null>(null);

  const pendingQuestions = useMemo(
    () => unansweredCustomerQuestions(thread?.messages ?? []),
    [thread],
  );
  const responseTarget = pendingQuestions[pendingQuestions.length - 1];

  async function loadThread(reference: string): Promise<CustomerVisitThread | null> {
    if (reference !== selectedReference) setThread(null);
    setSelectedReference(reference);
    setThreadLoading(true);
    setThreadError(null);
    setNotice(null);
    try {
      const latestThread = await fetchProviderCustomerVisitThread(reference);
      setThread(latestThread);
      return latestThread;
    } catch (loadError) {
      setThread(null);
      setThreadError(loadError instanceof Error
        ? loadError.message
        : 'The customer visit conversation could not be loaded.');
      return null;
    } finally {
      setThreadLoading(false);
    }
  }

  async function loadQueue(preferredReference?: string | null) {
    setQueueLoading(true);
    setQueueError(null);
    try {
      const latestQueue = await fetchProviderCustomerVisitThreads();
      setQueue(latestQueue.threads);
      const candidate = preferredReference
        ?? selectedReference
        ?? latestQueue.threads[0]?.customerVisitReference;
      if (candidate && latestQueue.threads.some(
        ({ customerVisitReference }) => customerVisitReference === candidate,
      )) {
        if (candidate !== selectedReference || !thread) await loadThread(candidate);
      } else {
        setSelectedReference(null);
        setThread(null);
      }
    } catch (loadError) {
      setQueueError(loadError instanceof Error
        ? loadError.message
        : 'Customer visit questions could not be loaded.');
    } finally {
      setQueueLoading(false);
    }
  }

  useEffect(() => {
    void loadQueue();
    // Initial authoritative load only. Later refreshes retain the exact selection.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submitResponse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!thread || !responseTarget || !body.trim()) return;
    const targetMessageId = responseTarget.messageId;
    retryKey.current ??= `provider-visit-response-${crypto.randomUUID()}`;
    setSaving(true);
    setThreadError(null);
    setNotice(null);
    try {
      await createProviderCustomerVisitResponse(
        thread,
        targetMessageId,
        body.trim(),
        retryKey.current,
      );
      retryKey.current = null;
      setBody('');
      const latestThread = await loadThread(thread.customerVisitReference);
      await loadQueue(thread.customerVisitReference);
      if (latestThread) setNotice('Response confirmed in this visit conversation.');
    } catch (writeError) {
      const latestThread = await loadThread(thread.customerVisitReference);
      const confirmed = latestThread?.messages.some(
        (message) => message.messageKind === 'provider_response'
          && message.inReplyToMessageId === targetMessageId,
      ) ?? false;
      if (confirmed) {
        retryKey.current = null;
        setBody('');
        setNotice('Response confirmed in this visit conversation.');
      } else {
        setThreadError(`${writeError instanceof Error
          ? writeError.message
          : 'The customer response could not be confirmed.'} Review the latest conversation before retrying.`);
      }
      await loadQueue(thread.customerVisitReference);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="grover-card p-5" aria-labelledby="visit-question-queue-heading">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="grover-eyebrow">Customer communication</p>
          <h2 className="mt-1 text-2xl font-black text-forest" id="visit-question-queue-heading">
            Visit questions
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Review questions attached to a confirmed visit and respond in that exact conversation.
          </p>
        </div>
        <button
          className="grover-button-secondary"
          disabled={queueLoading}
          onClick={() => void loadQueue(selectedReference)}
          type="button"
        >
          {queueLoading ? 'Refreshing…' : 'Refresh questions'}
        </button>
      </div>

      {queueError ? (
        <WorkspaceStatusNotice
          className="mt-4"
          detail={queueError}
          title="Visit questions need attention."
          tone="warning"
        />
      ) : null}
      {queueLoading && !queue.length ? (
        <p className="mt-5 text-sm font-bold text-slate-600" role="status">Loading visit questions…</p>
      ) : null}
      {!queueLoading && !queueError && !queue.length ? (
        <p className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
          No customer visit conversations are available for this company.
        </p>
      ) : null}

      {queue.length ? (
        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(16rem,0.85fr)_minmax(0,1.4fr)]">
          <div aria-label="Customer visit question queue" className="space-y-3">
            {queue.map((summary) => (
              <VisitQueueItem
                key={summary.customerVisitReference}
                onSelect={() => {
                  setBody('');
                  retryKey.current = null;
                  void loadThread(summary.customerVisitReference);
                }}
                selected={selectedReference === summary.customerVisitReference}
                summary={summary}
              />
            ))}
          </div>

          <section aria-label="Selected visit conversation" className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            {threadLoading ? <p className="text-sm font-bold text-slate-600" role="status">Loading conversation…</p> : null}
            {threadError ? (
              <WorkspaceStatusNotice
                detail={threadError}
                title="Conversation needs attention."
                tone="warning"
              />
            ) : null}
            {notice ? (
              <WorkspaceStatusNotice detail={notice} title="Response saved." tone="success" />
            ) : null}
            {!threadLoading && thread ? (
              <>
                <ol className="space-y-3">
                  {thread.messages.map((message) => (
                    <li
                      className={`rounded-xl p-3 text-sm leading-6 ${
                        message.authorRole === 'customer'
                          ? 'border border-sky-200 bg-white text-slate-800'
                          : 'bg-emerald-950 text-white'
                      }`}
                      key={message.messageId}
                    >
                      <p className={`text-xs font-black uppercase tracking-wide ${
                        message.authorRole === 'customer' ? 'text-sky-800' : 'text-emerald-100'
                      }`}>
                        {message.authorRole === 'customer' ? 'Customer question' : 'Your response'} · {topicLabels[message.topic]}
                      </p>
                      <p className="mt-1 whitespace-pre-wrap">{message.customerSafeBody}</p>
                    </li>
                  ))}
                </ol>
                {responseTarget ? (
                  <form className="mt-5 grid gap-3 border-t border-slate-200 pt-5" onSubmit={submitResponse}>
                    <div className="rounded-xl bg-amber-50 p-3 text-sm leading-6 text-amber-950">
                      <p className="font-black">Responding to {topicLabels[responseTarget.topic]}</p>
                      <p className="mt-1">{responseTarget.customerSafeBody}</p>
                    </div>
                    <label className="text-sm font-bold text-forest">
                      Response for the customer
                      <textarea
                        className="mt-1 min-h-28 w-full rounded-xl border border-slate-300 bg-white p-3 font-normal"
                        maxLength={2000}
                        onChange={(event) => {
                          setBody(event.target.value);
                          retryKey.current = null;
                        }}
                        placeholder="Share the confirmed details that answer this question."
                        value={body}
                      />
                    </label>
                    <button
                      className="grover-button-primary disabled:opacity-60"
                      disabled={saving || !body.trim()}
                      type="submit"
                    >
                      {saving ? 'Confirming response…' : 'Send response'}
                    </button>
                  </form>
                ) : (
                  <p className="mt-5 rounded-xl bg-emerald-50 p-3 text-sm font-semibold leading-6 text-emerald-950">
                    Every customer question in this visit conversation has a response.
                  </p>
                )}
              </>
            ) : null}
          </section>
        </div>
      ) : null}
    </section>
  );
}
