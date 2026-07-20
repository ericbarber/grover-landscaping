import { useEffect, useState } from 'react';
import { getMarketingDashboard, type MarketingDashboard, type MarketingFunnelSegment } from '../api/marketingLeadInboxClient';

function rate(numerator: number, denominator: number): string {
  if (denominator === 0) return '—';
  return `${Math.round((numerator / denominator) * 100)}%`;
}

export function ManagerMarketingConversionDashboard() {
  const [dashboard, setDashboard] = useState<MarketingDashboard>();
  const [error, setError] = useState('');
  async function refresh() {
    setError('');
    try { setDashboard(await getMarketingDashboard()); }
    catch { setError('Conversion reporting could not be loaded.'); }
  }
  useEffect(() => { void refresh(); }, []);

  if (error) return <section className="rounded-2xl bg-white p-6"><h2 className="text-xl font-black">Conversion dashboard</h2><p className="mt-3 rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-800" role="alert">{error}</p><button className="mt-4 rounded-xl border px-4 py-2 font-bold" onClick={() => void refresh()} type="button">Try again</button></section>;
  if (!dashboard) return <section className="rounded-2xl bg-white p-6"><p className="text-sm font-semibold text-slate-500">Loading conversion dashboard…</p></section>;

  const totals = dashboard.totals;
  const lowVolume = totals.page_views < 100;
  const stages = [
    ['Visits', totals.page_views, 'Unique sessions'],
    ['CTA engaged', totals.cta_clicks, rate(totals.cta_clicks, totals.page_views)],
    ['Form started', totals.form_starts, rate(totals.form_starts, totals.cta_clicks)],
    ['Submitted', totals.submissions, rate(totals.submissions, totals.form_starts)],
  ] as const;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6" id="marketing-conversion-dashboard">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">Last {dashboard.window_days} days</p><h2 className="mt-1 text-2xl font-black">Conversion dashboard</h2><p className="mt-1 text-sm text-slate-500">Anonymous first-party sessions · Support-admin access only</p></div><button className="min-h-11 rounded-xl border border-slate-300 px-4 text-sm font-bold" onClick={() => void refresh()} type="button">Refresh</button></div>
      {lowVolume ? <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-amber-900">Early signal: fewer than 100 visits. Treat rates as directional, not conclusive.</p> : null}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{stages.map(([label, value, context], index) => <article className="relative overflow-hidden rounded-2xl bg-slate-950 p-5 text-white" key={label}><span className="absolute right-3 top-2 text-5xl font-black text-white/5">{index + 1}</span><p className="text-xs font-black uppercase tracking-wide text-emerald-300">{label}</p><p className="mt-5 text-4xl font-black">{value}</p><p className="mt-2 text-sm font-bold text-slate-400">{context}</p></article>)}</div>
      <div className="mt-5 rounded-2xl bg-emerald-50 p-5"><div className="flex items-center justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-wide text-emerald-700">Visit to request</p><p className="mt-1 text-3xl font-black text-emerald-950">{rate(totals.submissions, totals.page_views)}</p></div><div className="text-right"><p className="text-sm font-bold text-emerald-900">{totals.failures} form failures</p><p className="text-xs text-emerald-800">Operational signal, not unique sessions</p></div></div></div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2"><SegmentTable label="By audience" segments={dashboard.by_persona} /><SegmentTable label="By campaign" segments={dashboard.by_campaign} /></div>
    </section>
  );
}

function SegmentTable({ label, segments }: { label: string; segments: MarketingFunnelSegment[] }) {
  return <div><h3 className="font-black">{label}</h3><div className="mt-3 overflow-x-auto rounded-xl border border-slate-200"><table className="w-full min-w-[28rem] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="p-3">Segment</th><th className="p-3">Visits</th><th className="p-3">CTA</th><th className="p-3">Starts</th><th className="p-3">Requests</th></tr></thead><tbody className="divide-y divide-slate-100">{segments.length ? segments.map((item) => <tr key={item.segment}><th className="p-3 font-black capitalize">{item.segment.split('_').join(' ')}</th><td className="p-3">{item.page_views}</td><td className="p-3">{item.cta_clicks}</td><td className="p-3">{item.form_starts}</td><td className="p-3 font-black text-emerald-700">{item.submissions}</td></tr>) : <tr><td className="p-4 text-slate-500" colSpan={5}>No measured activity yet.</td></tr>}</tbody></table></div></div>;
}
