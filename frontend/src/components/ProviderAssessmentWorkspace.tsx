import { useRef, useState } from 'react';
import { ApiRequestError } from '../api/apiError';
import {
  createProviderAssessmentMessage,
  createProviderAssessmentPrivateNote,
  startProviderAssessment,
  transitionProviderAssessment,
  type ProviderAssessment,
  type ProviderAssessmentMessageKind,
  type ProviderAssessmentPrivateNoteKind,
  type ProviderDisclosureAccess,
} from '../api/providerInvitationClient';

const requestKey = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;

function errorMessage(error: unknown): string {
  return error instanceof ApiRequestError || error instanceof Error
    ? error.message : 'The assessment update could not be confirmed.';
}

export function providerAssessmentAction(status: ProviderAssessment['status']): 'begin' | 'complete' | 'wait' | 'closed' {
  if (status === 'remote_review' || status === 'owner_confirmed') return 'begin';
  if (status === 'in_progress') return 'complete';
  if (['completed', 'cannot_assess', 'cancelled'].includes(status)) return 'closed';
  return 'wait';
}

export function ProviderAssessmentWorkspace({
  token,
  access,
  onChange,
  onReload,
}: {
  token: string;
  access: ProviderDisclosureAccess;
  onChange: (access: ProviderDisclosureAccess) => void;
  onReload: () => Promise<void>;
}) {
  const [method, setMethod] = useState<'remote' | 'on_site'>('remote');
  const [windowStart, setWindowStart] = useState('');
  const [windowEnd, setWindowEnd] = useState('');
  const [messageKind, setMessageKind] = useState<Exclude<ProviderAssessmentMessageKind, 'owner_question'>>('provider_answer');
  const [messageBody, setMessageBody] = useState('');
  const [noteKind, setNoteKind] = useState<ProviderAssessmentPrivateNoteKind>('scope_assumption');
  const [noteBody, setNoteBody] = useState('');
  const [outcome, setOutcome] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const keys = useRef(new Map<string, string>());
  const assessment = access.assessment;

  async function perform(keyName: string, operation: (key: string) => Promise<void>) {
    const key = keys.current.get(keyName) ?? requestKey(keyName);
    keys.current.set(keyName, key);
    setBusy(true); setError(null); setNotice(null);
    try {
      await operation(key);
      keys.current.delete(keyName);
    } catch (operationError) {
      setError(errorMessage(operationError));
    } finally {
      setBusy(false);
    }
  }

  async function start() {
    if (!access.grantId) return setError('Reload owner-approved access before starting.');
    const startSeconds = windowStart ? Math.floor(new Date(windowStart).getTime() / 1000) : undefined;
    const endSeconds = windowEnd ? Math.floor(new Date(windowEnd).getTime() / 1000) : undefined;
    if (method === 'on_site' && (!startSeconds || !endSeconds || endSeconds <= startSeconds)) {
      return setError('Choose a valid start and end for the proposed on-site window.');
    }
    await perform('provider-assessment-start', async (key) => {
      const created = await startProviderAssessment(token, access.grantId!, method, method === 'on_site' ? {
        startEpochSeconds: startSeconds,
        endEpochSeconds: endSeconds,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Phoenix',
      } : {}, key);
      onChange({ ...access, assessment: created, customerSafeMessages: [], privateNotes: [] });
      setNotice(method === 'remote' ? 'Remote review started.' : 'The proposed window is waiting for owner confirmation.');
    });
  }

  async function transition(action: 'begin' | 'complete' | 'cannot_assess' | 'cancel') {
    if (!assessment) return;
    if (action !== 'begin' && !outcome.trim()) return setError('Add a customer-safe outcome before continuing.');
    await perform(`provider-assessment-${action}`, async (key) => {
      const updated = await transitionProviderAssessment(token, assessment, action, action === 'begin' ? {} : {
        reasonCode: action === 'cannot_assess' ? 'insufficient_information'
          : action === 'cancel' ? 'assessment_no_longer_needed' : undefined,
        ownerVisibleSummary: outcome.trim(),
      }, key);
      onChange({ ...access, assessment: updated });
      setOutcome('');
      setNotice(action === 'begin' ? 'Assessment marked in progress.' : 'Customer-safe assessment outcome saved. No service was activated.');
    });
  }

  async function sendMessage() {
    if (!assessment || !messageBody.trim()) return setError('Enter a customer-safe message first.');
    await perform('provider-assessment-message', async (key) => {
      const created = await createProviderAssessmentMessage(token, assessment, messageKind, messageBody.trim(), key);
      onChange({ ...access, customerSafeMessages: [...(access.customerSafeMessages ?? []), created] });
      setMessageBody(''); setNotice('Customer-safe message shared with the owner.');
    });
  }

  async function saveNote() {
    if (!assessment || !noteBody.trim()) return setError('Enter a private note first.');
    await perform('provider-assessment-note', async (key) => {
      const created = await createProviderAssessmentPrivateNote(token, assessment, noteKind, noteBody.trim(), key);
      onChange({ ...access, privateNotes: [...(access.privateNotes ?? []), created] });
      setNoteBody(''); setNotice('Provider-private note saved. It is not visible to the owner.');
    });
  }

  const action = assessment ? providerAssessmentAction(assessment.status) : null;
  return <section className="mt-6 rounded-2xl border border-violet-200 bg-violet-50 p-5" aria-labelledby="provider-assessment-workspace-title">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-wide text-violet-800">Assessment workspace</p><h3 className="mt-2 text-xl font-black" id="provider-assessment-workspace-title">Review context without starting service</h3></div><button className="min-h-11 rounded-lg border border-violet-700 bg-white px-4 text-sm font-bold" disabled={busy} onClick={() => void onReload()} type="button">Reload workspace</button></div>
    <p className="mt-2 text-sm leading-6 text-slate-700">Assessment actions do not price work, accept a proposal, assign a crew, or schedule recurring service.</p>
    {notice ? <p className="mt-4 rounded-xl border border-emerald-200 bg-white p-3 text-sm font-semibold text-emerald-900" role="status">{notice}</p> : null}
    {error ? <p className="mt-4 rounded-xl border border-rose-300 bg-white p-3 text-sm font-semibold text-rose-900" role="alert">{error} Reload before retrying if the result is uncertain.</p> : null}
    {!assessment ? <div className="mt-5 rounded-xl bg-white p-4"><h4 className="font-black">Start one assessment</h4><div className="mt-3 flex flex-wrap gap-4"><label><input checked={method === 'remote'} name="assessment-method" onChange={() => setMethod('remote')} type="radio" /> <span className="font-bold">Remote review</span></label><label><input checked={method === 'on_site'} name="assessment-method" onChange={() => setMethod('on_site')} type="radio" /> <span className="font-bold">Propose on-site window</span></label></div>{method === 'on_site' ? <div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="text-sm font-bold">Starts<input className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3" onChange={(event) => setWindowStart(event.target.value)} type="datetime-local" value={windowStart} /></label><label className="text-sm font-bold">Ends<input className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3" onChange={(event) => setWindowEnd(event.target.value)} type="datetime-local" value={windowEnd} /></label></div> : null}<button className="mt-4 min-h-11 rounded-lg bg-violet-800 px-4 font-black text-white disabled:opacity-60" disabled={busy} onClick={() => void start()} type="button">{method === 'remote' ? 'Start remote review' : 'Send proposed window'}</button></div> : <>
      <div className="mt-5 rounded-xl bg-white p-4"><div className="flex flex-wrap justify-between gap-2"><h4 className="font-black">{assessment.assessmentMethod === 'remote' ? 'Remote assessment' : 'On-site assessment'}</h4><span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-black uppercase">{assessment.status.split('_').join(' ')}</span></div><p className="mt-2 text-sm text-slate-600">Authoritative version {assessment.version}</p>{action === 'wait' ? <p className="mt-3 text-sm font-semibold text-amber-900">{assessment.status === 'window_change_requested' ? 'The owner requested another time. Contact them in the shared thread before proposing a replacement.' : 'Wait for the owner to confirm the proposed window.'}</p> : null}{action === 'begin' ? <button className="mt-4 min-h-11 rounded-lg bg-violet-800 px-4 font-black text-white" disabled={busy} onClick={() => void transition('begin')} type="button">Begin assessment</button> : null}{action === 'complete' ? <div className="mt-4"><label className="text-sm font-bold">Customer-safe outcome<textarea className="mt-1 min-h-24 w-full rounded-lg border border-slate-300 p-3 font-normal" onChange={(event) => setOutcome(event.target.value)} value={outcome} /></label><div className="mt-3 flex flex-wrap gap-2"><button className="min-h-11 rounded-lg bg-emerald-800 px-4 font-black text-white" disabled={busy} onClick={() => void transition('complete')} type="button">Complete assessment</button><button className="min-h-11 rounded-lg border border-amber-700 bg-white px-4 font-bold" disabled={busy} onClick={() => void transition('cannot_assess')} type="button">Cannot assess</button><button className="min-h-11 rounded-lg border border-rose-700 bg-white px-4 font-bold" disabled={busy} onClick={() => void transition('cancel')} type="button">Cancel assessment</button></div></div> : null}{action === 'closed' && assessment.ownerVisibleSummary ? <p className="mt-3 text-sm leading-6">{assessment.ownerVisibleSummary}</p> : null}</div>
      {action !== 'closed' ? <div className="mt-4 grid gap-4 lg:grid-cols-2"><div className="rounded-xl bg-white p-4"><h4 className="font-black">Shared with the owner</h4><ul className="mt-3 grid gap-2 text-sm">{(access.customerSafeMessages ?? []).map((entry) => <li className="rounded-lg bg-sky-50 p-3" key={entry.messageId}><strong>{entry.authorRole === 'owner' ? 'Owner' : 'Provider'}</strong><p className="mt-1 whitespace-pre-wrap">{entry.customerSafeBody}</p></li>)}</ul><select className="mt-3 min-h-11 w-full rounded-lg border border-slate-300 px-3" onChange={(event) => setMessageKind(event.target.value as typeof messageKind)} value={messageKind}><option value="provider_answer">Answer</option><option value="clarification">Clarification</option><option value="additional_photo_request">Request another photo</option><option value="window_change_request">Timing update</option></select><textarea aria-label="Customer-safe message" className="mt-2 min-h-24 w-full rounded-lg border border-slate-300 p-3" onChange={(event) => setMessageBody(event.target.value)} value={messageBody} /><button className="mt-2 min-h-11 rounded-lg bg-sky-800 px-4 font-black text-white" disabled={busy} onClick={() => void sendMessage()} type="button">Share with owner</button></div><div className="rounded-xl border border-dashed border-slate-400 bg-slate-100 p-4"><h4 className="font-black">Provider-private notes</h4><p className="mt-1 text-xs font-semibold text-slate-600">Never shown in the owner workspace.</p><ul className="mt-3 grid gap-2 text-sm">{(access.privateNotes ?? []).map((entry) => <li className="rounded-lg bg-white p-3" key={entry.noteId}>{entry.privateBody}</li>)}</ul><select className="mt-3 min-h-11 w-full rounded-lg border border-slate-300 px-3" onChange={(event) => setNoteKind(event.target.value as ProviderAssessmentPrivateNoteKind)} value={noteKind}><option value="scope_assumption">Scope assumption</option><option value="measurement">Measurement</option><option value="access_constraint">Access constraint</option><option value="safety_observation">Safety observation</option><option value="production_assumption">Production assumption</option><option value="route_fit">Route fit</option></select><textarea aria-label="Provider-private note" className="mt-2 min-h-24 w-full rounded-lg border border-slate-300 p-3" onChange={(event) => setNoteBody(event.target.value)} value={noteBody} /><button className="mt-2 min-h-11 rounded-lg bg-slate-800 px-4 font-black text-white" disabled={busy} onClick={() => void saveNote()} type="button">Save private note</button></div></div> : null}
    </>}
  </section>;
}
