import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  createOperationalException,
  fetchOperationalExceptions,
  updateOperationalException,
  type OperationalException,
  type OperationalExceptionCategory,
  type OperationalExceptionPriority,
  type OperationalExceptionStatus,
} from '../api/operationalExceptionsClient';
import { WorkspaceStatusBadge, WorkspaceStatusNotice } from './WorkspaceStatus';

const categories: OperationalExceptionCategory[] = [
  'delay', 'staffing', 'access', 'weather', 'equipment', 'safety', 'customer_escalation',
];
const priorities: OperationalExceptionPriority[] = ['low', 'medium', 'high', 'critical'];

export function exceptionLabel(value: string): string {
  return value.replace(/_/g, ' ').replace(/^./, (letter: string) => letter.toUpperCase());
}

export function summarizeOperationalExceptions(items: OperationalException[], today: string) {
  return {
    open: items.filter((item) => item.status !== 'resolved').length,
    assigned: items.filter((item) => item.status !== 'resolved' && item.assignedUserId).length,
    urgent: items.filter((item) => (
      item.status !== 'resolved' && (item.priority === 'high' || item.priority === 'critical')
    )).length,
    resolvedToday: items.filter((item) => item.resolvedAt?.startsWith(today)).length,
  };
}

function priorityTone(priority: OperationalExceptionPriority): 'neutral' | 'warning' | 'danger' {
  if (priority === 'critical') return 'danger';
  if (priority === 'high') return 'warning';
  return 'neutral';
}

export function ManagerOperationalExceptionsPanel({
  onOpenAffectedResource,
  organizationId,
}: {
  onOpenAffectedResource?: (resourceType: string, resourceId: string) => void;
  organizationId: string;
}) {
  const [items, setItems] = useState<OperationalException[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [status, setStatus] = useState<OperationalExceptionStatus | 'all'>('all');
  const [category, setCategory] = useState<OperationalExceptionCategory | 'all'>('all');
  const [priority, setPriority] = useState<OperationalExceptionPriority | 'all'>('all');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{ message: string; tone: 'success' | 'warning' | 'danger' } | null>(null);
  const [title, setTitle] = useState('');
  const [newCategory, setNewCategory] = useState<OperationalExceptionCategory>('delay');
  const [newPriority, setNewPriority] = useState<OperationalExceptionPriority>('medium');
  const [resolutionId, setResolutionId] = useState<string | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [assignmentId, setAssignmentId] = useState<string | null>(null);
  const [assignedUserId, setAssignedUserId] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setNotice(null);
    try {
      const nextItems = await fetchOperationalExceptions({
        organizationId,
        status: status === 'all' ? undefined : status,
        category: category === 'all' ? undefined : category,
        priority: priority === 'all' ? undefined : priority,
        limit: 100,
      });
      setItems(nextItems);
      setSelectedId((current) => (
        nextItems.some((item) => item.id === current) ? current : nextItems[0]?.id ?? null
      ));
    } catch {
      setNotice({
        message: 'Operational exceptions could not be loaded. Check the connection and retry.',
        tone: 'warning',
      });
    } finally {
      setLoading(false);
    }
  }, [organizationId, status, category, priority]);

  useEffect(() => {
    void load();
  }, [load]);

  const selectedItem = items.find((item) => item.id === selectedId) ?? items[0] ?? null;
  const summary = useMemo(
    () => summarizeOperationalExceptions(items, new Date().toISOString().slice(0, 10)),
    [items],
  );

  async function createItem() {
    if (!title.trim()) return;
    setLoading(true);
    setNotice(null);
    try {
      const created = await createOperationalException({
        organizationId,
        category: newCategory,
        priority: newPriority,
        title: title.trim(),
      });
      setTitle('');
      setNotice({ message: 'Exception created and added to the manager queue.', tone: 'success' });
      setStatus('all');
      await load();
      setSelectedId(created.id);
    } catch {
      setNotice({ message: 'The exception was not saved. Your current queue is unchanged.', tone: 'danger' });
      setLoading(false);
    }
  }

  async function transition(
    item: OperationalException,
    action: 'assign' | 'start' | 'resolve' | 'reopen',
  ) {
    setLoading(true);
    setNotice(null);
    try {
      const updated = await updateOperationalException(item.id, {
        action,
        expectedUpdatedAt: item.updatedAt,
        assignedUserId: action === 'assign' ? assignedUserId.trim() : undefined,
        resolutionNote: action === 'resolve' ? resolutionNote.trim() : undefined,
      });
      setItems((current) => current
        .map((candidate) => candidate.id === updated.id ? updated : candidate)
        .filter((candidate) => status === 'all' || candidate.status === status));
      setSelectedId(updated.id);
      setResolutionId(null);
      setResolutionNote('');
      setAssignmentId(null);
      setAssignedUserId('');
      setNotice({
        message: `Exception ${action === 'assign' ? 'assigned' : action === 'start' ? 'started' : action === 'resolve' ? 'resolved' : 'reopened'}.`,
        tone: 'success',
      });
    } catch {
      setNotice({
        message: 'The exception changed or could not be updated. The last synced queue is preserved; refresh before retrying.',
        tone: 'warning',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl bg-forest p-5 text-white shadow-grover-sm sm:p-6">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-sand">Operations recovery</p>
        <h2 className="mt-2 font-display text-3xl font-black">Recovery and exceptions</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-mist">
          Every failed or risky workflow stays visible, attributable, and actionable until it is resolved.
        </p>
      </section>

      <section aria-label="Recovery summary" className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          ['Open', summary.open, 'Needs a decision'],
          ['Assigned', summary.assigned, 'Has an owner'],
          ['Urgent', summary.urgent, 'High or critical'],
          ['Resolved today', summary.resolvedToday, 'Closed with history'],
        ].map(([label, value, detail]) => (
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm" key={label}>
            <p className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-black text-forest">{value}</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">{detail}</p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-2 sm:grid-cols-3">
          <select aria-label="Exception status" className="min-h-11 rounded-lg border border-slate-300 px-3 py-2" value={status} onChange={(event) => setStatus(event.target.value as typeof status)}><option value="all">All statuses</option><option value="open">Open</option><option value="in_progress">In progress</option><option value="resolved">Resolved</option></select>
          <select aria-label="Exception category" className="min-h-11 rounded-lg border border-slate-300 px-3 py-2" value={category} onChange={(event) => setCategory(event.target.value as typeof category)}><option value="all">All categories</option>{categories.map((value) => <option key={value} value={value}>{exceptionLabel(value)}</option>)}</select>
          <select aria-label="Exception priority" className="min-h-11 rounded-lg border border-slate-300 px-3 py-2" value={priority} onChange={(event) => setPriority(event.target.value as typeof priority)}><option value="all">All priorities</option>{priorities.map((value) => <option key={value} value={value}>{exceptionLabel(value)}</option>)}</select>
        </div>
      </section>

      {notice ? (
        <WorkspaceStatusNotice compact detail={notice.message} tone={notice.tone} />
      ) : null}

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <section aria-labelledby="exception-queue-heading" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-emerald-800">Exception queue</p>
              <h3 className="mt-1 text-xl font-black text-slate-950" id="exception-queue-heading">Work needing recovery</h3>
            </div>
            <WorkspaceStatusBadge tone={summary.open > 0 ? 'warning' : 'success'}>
              {summary.open} active
            </WorkspaceStatusBadge>
          </div>
          {loading && items.length === 0 ? <p className="mt-4 text-sm text-slate-600">Loading persisted exceptions…</p> : null}
          {!loading && items.length === 0 ? (
            <WorkspaceStatusNotice className="mt-4" detail="Change the filters or refresh to review other recovery work." title="No exceptions match these filters." tone="neutral" />
          ) : null}
          <div className="mt-4 space-y-2">
            {items.map((item) => (
              <button
                aria-pressed={selectedItem?.id === item.id}
                className={`w-full rounded-xl border p-3 text-left ${selectedItem?.id === item.id ? 'border-emerald-700 bg-emerald-50 shadow-sm' : 'border-slate-200 bg-paper hover:border-emerald-400'}`}
                key={item.id}
                onClick={() => setSelectedId(item.id)}
                type="button"
              >
                <span className="flex flex-wrap items-start justify-between gap-2">
                  <span className="font-black text-slate-950">{item.title}</span>
                  <WorkspaceStatusBadge tone={priorityTone(item.priority)}>{exceptionLabel(item.priority)}</WorkspaceStatusBadge>
                </span>
                <span className="mt-2 block text-xs font-bold uppercase text-slate-500">{exceptionLabel(item.category)} · {exceptionLabel(item.status)}</span>
                <span className="mt-1 block text-xs text-slate-500">{item.assignedUserId ? `Owned by ${item.assignedUserId}` : 'Unassigned'}</span>
              </button>
            ))}
          </div>
          <button className="mt-4 min-h-11 rounded-lg border border-slate-300 px-3 text-sm font-bold" disabled={loading} onClick={() => void load()} type="button">Refresh queue</button>
        </section>

        <aside aria-labelledby="exception-detail-heading" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-black uppercase tracking-wide text-emerald-800">Exception detail</p>
          <h3 className="mt-1 text-xl font-black text-slate-950" id="exception-detail-heading">
            {selectedItem?.title ?? 'Select recovery work'}
          </h3>
          {selectedItem ? (
            <>
              <div className="mt-3 flex flex-wrap gap-2">
                <WorkspaceStatusBadge tone={priorityTone(selectedItem.priority)}>{exceptionLabel(selectedItem.priority)}</WorkspaceStatusBadge>
                <WorkspaceStatusBadge tone={selectedItem.status === 'resolved' ? 'success' : 'info'}>{exceptionLabel(selectedItem.status)}</WorkspaceStatusBadge>
              </div>
              {selectedItem.description ? <p className="mt-3 text-sm leading-6 text-slate-600">{selectedItem.description}</p> : null}
              <dl className="mt-4 space-y-3 rounded-xl bg-paper p-3 text-sm">
                <div><dt className="text-xs font-bold uppercase text-slate-500">Owner</dt><dd className="mt-1 font-semibold text-slate-900">{selectedItem.assignedUserId ?? 'Unassigned'}</dd></div>
                <div><dt className="text-xs font-bold uppercase text-slate-500">Affected work</dt><dd className="mt-1 font-semibold text-slate-900">{selectedItem.affectedResourceType && selectedItem.affectedResourceId ? `${exceptionLabel(selectedItem.affectedResourceType)} · ${selectedItem.affectedResourceId}` : 'No affected record linked'}</dd></div>
                <div><dt className="text-xs font-bold uppercase text-slate-500">Last changed</dt><dd className="mt-1 font-semibold text-slate-900">{new Date(selectedItem.updatedAt).toLocaleString()}</dd></div>
              </dl>
              {selectedItem.affectedResourceType && selectedItem.affectedResourceId && onOpenAffectedResource ? (
                <button className="mt-3 min-h-11 w-full rounded-xl bg-forest px-3 text-sm font-bold text-white" onClick={() => onOpenAffectedResource(selectedItem.affectedResourceType!, selectedItem.affectedResourceId!)} type="button">Open affected work</button>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedItem.status !== 'resolved' ? <button className="min-h-11 rounded-lg border border-slate-300 px-3 text-sm font-bold" onClick={() => { setAssignmentId(selectedItem.id); setAssignedUserId(selectedItem.assignedUserId ?? ''); }} type="button">Assign</button> : null}
                {selectedItem.status === 'open' ? <button className="min-h-11 rounded-lg border border-emerald-700 px-3 text-sm font-bold text-emerald-800" disabled={loading} onClick={() => void transition(selectedItem, 'start')} type="button">Start</button> : null}
                {selectedItem.status !== 'resolved' ? <button className="min-h-11 rounded-lg border border-slate-300 px-3 text-sm font-bold" onClick={() => setResolutionId(selectedItem.id)} type="button">Resolve</button> : <button className="min-h-11 rounded-lg border border-slate-300 px-3 text-sm font-bold" disabled={loading} onClick={() => void transition(selectedItem, 'reopen')} type="button">Reopen</button>}
              </div>
              {assignmentId === selectedItem.id ? <div className="mt-3 space-y-2"><input aria-label={`Assignee for ${selectedItem.title}`} className="min-h-11 w-full rounded-lg border border-slate-300 px-3" placeholder="Manager user ID" value={assignedUserId} onChange={(event) => setAssignedUserId(event.target.value)} /><button className="min-h-11 w-full rounded-lg bg-emerald-700 px-3 text-sm font-bold text-white disabled:opacity-50" disabled={loading || !assignedUserId.trim()} onClick={() => void transition(selectedItem, 'assign')} type="button">Save assignment</button></div> : null}
              {resolutionId === selectedItem.id ? <div className="mt-3 space-y-2"><input aria-label={`Resolution note for ${selectedItem.title}`} className="min-h-11 w-full rounded-lg border border-slate-300 px-3" placeholder="How was this resolved?" value={resolutionNote} onChange={(event) => setResolutionNote(event.target.value)} /><button className="min-h-11 w-full rounded-lg bg-emerald-700 px-3 text-sm font-bold text-white disabled:opacity-50" disabled={loading || !resolutionNote.trim()} onClick={() => void transition(selectedItem, 'resolve')} type="button">Confirm resolution</button></div> : null}
            </>
          ) : (
            <p className="mt-3 text-sm text-slate-600">Choose an exception from the queue to inspect ownership, affected work, and resolution actions.</p>
          )}
        </aside>
      </div>

      <details className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <summary className="min-h-11 cursor-pointer font-black text-slate-900">Report an exception</summary>
        <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto_auto_auto]"><input aria-label="Exception title" className="min-h-11 rounded-lg border border-slate-300 px-3 py-2" maxLength={120} placeholder="What needs attention?" value={title} onChange={(event) => setTitle(event.target.value)} /><select aria-label="New exception category" className="min-h-11 rounded-lg border border-slate-300 px-3 py-2" value={newCategory} onChange={(event) => setNewCategory(event.target.value as OperationalExceptionCategory)}>{categories.map((value) => <option key={value} value={value}>{exceptionLabel(value)}</option>)}</select><select aria-label="New exception priority" className="min-h-11 rounded-lg border border-slate-300 px-3 py-2" value={newPriority} onChange={(event) => setNewPriority(event.target.value as OperationalExceptionPriority)}>{priorities.map((value) => <option key={value} value={value}>{exceptionLabel(value)}</option>)}</select><button className="min-h-11 rounded-lg bg-emerald-700 px-4 font-bold text-white disabled:opacity-50" disabled={loading || !title.trim()} onClick={() => void createItem()} type="button">Create</button></div>
      </details>
    </div>
  );
}
