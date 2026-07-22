import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  createOperationalException, fetchOperationalExceptions, updateOperationalException,
  type OperationalException, type OperationalExceptionCategory,
  type OperationalExceptionPriority, type OperationalExceptionStatus,
} from '../api/operationalExceptionsClient';

const categories: OperationalExceptionCategory[] = ['delay', 'staffing', 'access', 'weather', 'equipment', 'safety', 'customer_escalation'];
const priorities: OperationalExceptionPriority[] = ['low', 'medium', 'high', 'critical'];

export function exceptionLabel(value: string): string {
  return value.replace(/_/g, ' ').replace(/^./, (letter: string) => letter.toUpperCase());
}

export function ManagerOperationalExceptionsPanel({ organizationId }: { organizationId: string }) {
  const [items, setItems] = useState<OperationalException[]>([]);
  const [status, setStatus] = useState<OperationalExceptionStatus | 'all'>('open');
  const [category, setCategory] = useState<OperationalExceptionCategory | 'all'>('all');
  const [priority, setPriority] = useState<OperationalExceptionPriority | 'all'>('all');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [newCategory, setNewCategory] = useState<OperationalExceptionCategory>('delay');
  const [newPriority, setNewPriority] = useState<OperationalExceptionPriority>('medium');
  const [resolutionId, setResolutionId] = useState<string | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [assignmentId, setAssignmentId] = useState<string | null>(null);
  const [assignedUserId, setAssignedUserId] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setNotice(null);
    try {
      setItems(await fetchOperationalExceptions({ organizationId, status: status === 'all' ? undefined : status, category: category === 'all' ? undefined : category, priority: priority === 'all' ? undefined : priority, limit: 100 }));
    } catch { setNotice('Operational exceptions could not be loaded. Check the connection and retry.'); }
    finally { setLoading(false); }
  }, [organizationId, status, category, priority]);

  useEffect(() => { void load(); }, [load]);
  const attentionCount = useMemo(() => items.filter((item) => item.status !== 'resolved').length, [items]);

  async function createItem() {
    if (!title.trim()) return;
    setLoading(true); setNotice(null);
    try {
      await createOperationalException({ organizationId, category: newCategory, priority: newPriority, title: title.trim() });
      setTitle(''); setNotice('Exception created and added to the manager queue.'); await load();
    } catch { setNotice('The exception was not saved. Your current queue is unchanged.'); setLoading(false); }
  }

  async function transition(item: OperationalException, action: 'assign' | 'start' | 'resolve' | 'reopen') {
    setLoading(true); setNotice(null);
    try {
      const updated = await updateOperationalException(item.id, { action, expectedUpdatedAt: item.updatedAt, assignedUserId: action === 'assign' ? assignedUserId.trim() : undefined, resolutionNote: action === 'resolve' ? resolutionNote.trim() : undefined });
      setItems((current) => current.map((candidate) => candidate.id === updated.id ? updated : candidate).filter((candidate) => status === 'all' || candidate.status === status));
      setResolutionId(null); setResolutionNote(''); setNotice(`Exception ${action === 'assign' ? 'assigned' : action === 'start' ? 'started' : action === 'resolve' ? 'resolved' : 'reopened'}.`);
      setAssignmentId(null); setAssignedUserId('');
    } catch { setNotice('The exception changed or could not be updated. The last synced queue is preserved; refresh before retrying.'); }
    finally { setLoading(false); }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Operations recovery</p><h2 className="mt-1 text-xl font-black text-slate-950">Exception queue</h2><p className="mt-1 text-sm text-slate-600">Delays, staffing, access, weather, equipment, safety, and customer escalations.</p></div><span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-black text-amber-900">{attentionCount} active</span></div>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <select aria-label="Exception status" className="rounded-lg border border-slate-300 px-3 py-2" value={status} onChange={(event) => setStatus(event.target.value as typeof status)}><option value="all">All statuses</option><option value="open">Open</option><option value="in_progress">In progress</option><option value="resolved">Resolved</option></select>
        <select aria-label="Exception category" className="rounded-lg border border-slate-300 px-3 py-2" value={category} onChange={(event) => setCategory(event.target.value as typeof category)}><option value="all">All categories</option>{categories.map((value) => <option key={value} value={value}>{exceptionLabel(value)}</option>)}</select>
        <select aria-label="Exception priority" className="rounded-lg border border-slate-300 px-3 py-2" value={priority} onChange={(event) => setPriority(event.target.value as typeof priority)}><option value="all">All priorities</option>{priorities.map((value) => <option key={value} value={value}>{exceptionLabel(value)}</option>)}</select>
      </div>
      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3"><h3 className="font-black text-slate-900">Report an exception</h3><div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto_auto_auto]"><input aria-label="Exception title" className="rounded-lg border border-slate-300 px-3 py-2" maxLength={120} placeholder="What needs attention?" value={title} onChange={(event) => setTitle(event.target.value)} /><select aria-label="New exception category" className="rounded-lg border border-slate-300 px-3 py-2" value={newCategory} onChange={(event) => setNewCategory(event.target.value as OperationalExceptionCategory)}>{categories.map((value) => <option key={value} value={value}>{exceptionLabel(value)}</option>)}</select><select aria-label="New exception priority" className="rounded-lg border border-slate-300 px-3 py-2" value={newPriority} onChange={(event) => setNewPriority(event.target.value as OperationalExceptionPriority)}>{priorities.map((value) => <option key={value} value={value}>{exceptionLabel(value)}</option>)}</select><button className="min-h-11 rounded-lg bg-emerald-700 px-4 font-bold text-white disabled:opacity-50" disabled={loading || !title.trim()} onClick={() => void createItem()} type="button">Create</button></div></div>
      {notice ? <p role="status" className="mt-3 rounded-lg bg-slate-100 p-3 text-sm text-slate-700">{notice}</p> : null}
      {loading && items.length === 0 ? <p className="mt-4 text-sm text-slate-600">Loading persisted exceptions…</p> : null}
      {!loading && items.length === 0 ? <p className="mt-4 rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-600">No exceptions match these filters.</p> : null}
      <div className="mt-4 space-y-3">{items.map((item) => <article className="rounded-xl border border-slate-200 p-3" key={item.id}><div className="flex items-start justify-between gap-3"><div><p className="font-black text-slate-950">{item.title}</p><p className="mt-1 text-xs font-bold uppercase text-slate-500">{exceptionLabel(item.category)} · {exceptionLabel(item.priority)} · {exceptionLabel(item.status)}</p><p className="mt-1 text-xs text-slate-500">Assigned: {item.assignedUserId ?? 'Unassigned'}</p></div></div>{item.description ? <p className="mt-2 text-sm text-slate-600">{item.description}</p> : null}<div className="mt-3 flex flex-wrap gap-2">{item.status !== 'resolved' ? <button className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold" onClick={() => { setAssignmentId(item.id); setAssignedUserId(item.assignedUserId ?? ''); }} type="button">Assign</button> : null}{item.status === 'open' ? <button className="rounded-lg border border-emerald-700 px-3 py-2 text-sm font-bold text-emerald-800" disabled={loading} onClick={() => void transition(item, 'start')} type="button">Start</button> : null}{item.status !== 'resolved' ? <button className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold" onClick={() => setResolutionId(item.id)} type="button">Resolve</button> : <button className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold" disabled={loading} onClick={() => void transition(item, 'reopen')} type="button">Reopen</button>}</div>{assignmentId === item.id ? <div className="mt-3 flex flex-col gap-2 sm:flex-row"><input aria-label={`Assignee for ${item.title}`} className="min-h-11 flex-1 rounded-lg border border-slate-300 px-3" placeholder="Manager user ID" value={assignedUserId} onChange={(event) => setAssignedUserId(event.target.value)} /><button className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-bold text-white disabled:opacity-50" disabled={loading || !assignedUserId.trim()} onClick={() => void transition(item, 'assign')} type="button">Save assignment</button></div> : null}{resolutionId === item.id ? <div className="mt-3 flex flex-col gap-2 sm:flex-row"><input aria-label={`Resolution note for ${item.title}`} className="min-h-11 flex-1 rounded-lg border border-slate-300 px-3" placeholder="How was this resolved?" value={resolutionNote} onChange={(event) => setResolutionNote(event.target.value)} /><button className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-bold text-white disabled:opacity-50" disabled={loading || !resolutionNote.trim()} onClick={() => void transition(item, 'resolve')} type="button">Confirm resolution</button></div> : null}</article>)}</div>
      <button className="mt-4 min-h-11 rounded-lg border border-slate-300 px-3 text-sm font-bold" disabled={loading} onClick={() => void load()} type="button">Refresh queue</button>
    </section>
  );
}
