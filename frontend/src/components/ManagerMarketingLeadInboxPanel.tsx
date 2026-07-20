import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { listMarketingLeads, updateMarketingLead, type MarketingLeadInboxItem } from '../api/marketingLeadInboxClient';

export function ManagerMarketingLeadInboxPanel() {
  const [leads, setLeads] = useState<MarketingLeadInboxItem[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [nextActionAt, setNextActionAt] = useState('');
  const [note, setNote] = useState('');
  const [status, setStatus] = useState('new');
  const selected = leads.find((lead) => lead.id === selectedId) ?? leads[0];
  const visible = useMemo(() => leads.filter((lead) => statusFilter === 'all'
    || (statusFilter === 'active' ? lead.status !== 'closed' : lead.status === statusFilter)), [leads, statusFilter]);

  async function refresh() {
    setIsLoading(true); setError('');
    try { const next = await listMarketingLeads(); setLeads(next); setSelectedId((current) => current || next[0]?.id || ''); }
    catch { setError('The platform lead inbox could not be loaded.'); }
    finally { setIsLoading(false); }
  }
  useEffect(() => { void refresh(); }, []);
  useEffect(() => {
    if (!selected) return;
    setStatus(selected.status); setAssignedTo(selected.assigned_to ?? '');
    setNextActionAt(selected.next_action_at?.slice(0, 16) ?? ''); setNote('');
  }, [selected?.id]);

  async function save(event: FormEvent) {
    event.preventDefault(); if (!selected) return;
    setError('');
    try {
      const result = await updateMarketingLead(selected.id, { status, assignedTo, nextActionAt: nextActionAt ? new Date(nextActionAt).toISOString() : undefined, note });
      setLeads((items) => items.map((item) => item.id === result.lead.id ? result.lead : item)); setNote('');
    } catch { setError('The lead workflow update could not be saved.'); }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6" id="marketing-lead-inbox">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">Platform operations</p><h2 className="mt-1 text-2xl font-black">Marketing lead inbox</h2><p className="mt-1 text-sm text-slate-500">Support-admin access only · {leads.filter((lead) => lead.status === 'new').length} new</p></div>
        <div className="flex gap-2"><select className="min-h-11 rounded-xl border border-slate-300 px-3 text-sm font-bold" onChange={(event) => setStatusFilter(event.target.value)} value={statusFilter}><option value="active">Active</option><option value="new">New</option><option value="contacted">Contacted</option><option value="qualified">Qualified</option><option value="closed">Closed</option><option value="all">All</option></select><button className="min-h-11 rounded-xl border border-slate-300 px-4 text-sm font-bold" onClick={() => void refresh()} type="button">Refresh</button></div>
      </div>
      {error ? <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-800" role="alert">{error}</p> : null}
      {isLoading ? <p className="mt-6 text-sm font-semibold text-slate-500">Loading leads…</p> : null}
      {!isLoading && visible.length === 0 ? <p className="mt-6 rounded-xl bg-slate-50 p-5 text-sm text-slate-600">No leads match this view.</p> : null}
      {visible.length > 0 ? <div className="mt-5 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="max-h-[34rem] space-y-2 overflow-y-auto pr-1">{visible.map((lead) => <button className={`w-full rounded-xl border p-4 text-left ${selected?.id === lead.id ? 'border-emerald-700 bg-emerald-50' : 'border-slate-200'}`} key={lead.id} onClick={() => setSelectedId(lead.id)} type="button"><span className="flex justify-between gap-2"><span className="font-black">{lead.full_name}</span><span className="text-xs font-black uppercase text-emerald-700">{lead.status}</span></span><span className="mt-1 block text-sm text-slate-600">{lead.company_name || lead.email}</span><span className="mt-2 block text-xs font-bold text-slate-400">{lead.persona.split('_').join(' ')} · {new Date(lead.created_at).toLocaleString()}</span></button>)}</div>
        {selected ? <form className="rounded-2xl bg-slate-950 p-5 text-white" onSubmit={save}><p className="text-xs font-black uppercase tracking-wide text-emerald-300">{selected.intent.split('_').join(' ')}</p><h3 className="mt-2 text-2xl font-black">{selected.full_name}</h3><a className="mt-1 block text-sm text-emerald-300 underline" href={`mailto:${selected.email}`}>{selected.email}</a><p className="mt-4 text-sm leading-6 text-slate-300">{selected.message || 'No additional goal was provided.'}</p><div className="mt-5 grid gap-3 sm:grid-cols-2"><label className="text-sm font-bold">Status<select className="mt-1 w-full rounded-xl bg-white px-3 py-3 text-slate-950" onChange={(event) => setStatus(event.target.value)} value={status}><option value="new">New</option><option value="contacted">Contacted</option><option value="qualified">Qualified</option><option value="closed">Closed</option></select></label><label className="text-sm font-bold">Owner<input className="mt-1 w-full rounded-xl px-3 py-3 text-slate-950" maxLength={160} onChange={(event) => setAssignedTo(event.target.value)} value={assignedTo} /></label><label className="text-sm font-bold sm:col-span-2">Next action<input className="mt-1 w-full rounded-xl px-3 py-3 text-slate-950" onChange={(event) => setNextActionAt(event.target.value)} type="datetime-local" value={nextActionAt} /></label><label className="text-sm font-bold sm:col-span-2">Follow-up note<textarea className="mt-1 min-h-24 w-full rounded-xl px-3 py-3 text-slate-950" maxLength={2000} onChange={(event) => setNote(event.target.value)} value={note} /></label></div><button className="mt-4 w-full rounded-full bg-emerald-400 px-5 py-3 font-black text-emerald-950" type="submit">Save workflow update</button><p className="mt-4 text-xs text-slate-400">Campaign: {selected.campaign || 'direct'} · Source: {selected.source || 'unknown'}</p></form> : null}
      </div> : null}
    </section>
  );
}
