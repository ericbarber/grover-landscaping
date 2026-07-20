import { useEffect, useState, type FormEvent } from 'react';
import {
  createMarketingLead,
  marketingAttributionFromSearch,
  type MarketingIntent,
  type MarketingPersona,
} from '../api/marketingLeadsClient';

const personaLabels: Record<MarketingPersona, string> = {
  yard_owner: 'Yard owner',
  property_manager: 'Property manager',
  landscaping_company: 'Landscaping company',
  crew_lead: 'Crew lead',
};

export function marketingCallToAction(persona: MarketingPersona): {
  intent: MarketingIntent;
  label: string;
  title: string;
} {
  if (persona === 'property_manager') {
    return {
      intent: 'portfolio_discussion',
      label: 'Discuss my portfolio',
      title: 'Let’s talk about your properties.',
    };
  }
  if (persona === 'yard_owner') {
    return {
      intent: 'early_access',
      label: 'Join early access',
      title: 'Be among the first to experience Grover.',
    };
  }
  return {
    intent: 'demo',
    label: 'Request a demo',
    title: persona === 'crew_lead'
      ? 'See a better field day.'
      : 'See how Grover fits your operation.',
  };
}

export function MarketingLeadDialog({
  initialPersona,
  onClose,
}: {
  initialPersona: MarketingPersona;
  onClose: () => void;
}) {
  const [persona, setPersona] = useState<MarketingPersona>(initialPersona);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [teamSize, setTeamSize] = useState('');
  const [message, setMessage] = useState('');
  const [website, setWebsite] = useState('');
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'preview' | 'error'>('idle');
  const callToAction = marketingCallToAction(persona);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('submitting');
    try {
      const receipt = await createMarketingLead({
        fullName,
        email,
        companyName: companyName || undefined,
        persona,
        teamSize: teamSize || undefined,
        intent: callToAction.intent,
        message: message || undefined,
        landingPath: `${window.location.pathname}${window.location.search}`,
        consentToContact: consent,
        website,
        ...marketingAttributionFromSearch(window.location.search),
      });
      setStatus(receipt.persisted ? 'success' : 'preview');
    } catch {
      setStatus('error');
    }
  }

  return (
    <div
      aria-labelledby="marketing-lead-title"
      aria-modal="true"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 p-3 backdrop-blur-sm sm:p-6"
      role="dialog"
    >
      <div className="mx-auto flex min-h-full max-w-4xl items-center justify-center">
        <section className="relative grid w-full overflow-hidden rounded-[2rem] bg-white shadow-2xl lg:grid-cols-[0.75fr_1.25fr]">
          <aside className="bg-emerald-950 p-7 text-white sm:p-9">
            <button
              aria-label="Close request form"
              className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full border border-slate-200 bg-white text-xl font-black text-slate-800 lg:border-white/20 lg:bg-white/10 lg:text-white"
              onClick={onClose}
              type="button"
            >
              ×
            </button>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-300">Start a conversation</p>
            <h2 className="mt-5 text-3xl font-black leading-tight tracking-tight" id="marketing-lead-title">
              {callToAction.title}
            </h2>
            <p className="mt-4 text-sm leading-6 text-emerald-50/75">
              Tell us a little about your work. We’ll use it to make the conversation relevant from the start.
            </p>
            <div className="mt-8 border-t border-white/15 pt-6">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-300">What happens next</p>
              <ol className="mt-4 space-y-4 text-sm font-semibold text-emerald-50">
                <li>1. We review your goals.</li>
                <li>2. We tailor the product conversation.</li>
                <li>3. We agree on the right next step.</li>
              </ol>
            </div>
          </aside>

          {status === 'success' || status === 'preview' ? (
            <div className="flex min-h-[30rem] flex-col justify-center p-7 sm:p-10">
              <span aria-hidden="true" className="grid h-14 w-14 place-items-center rounded-full bg-emerald-100 text-2xl font-black text-emerald-800">✓</span>
              <p className="mt-6 text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                {status === 'success' ? 'Request received' : 'Local preview complete'}
              </p>
              <h3 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                {status === 'success' ? `Thank you, ${fullName.split(' ')[0]}.` : 'The form is working as designed.'}
              </h3>
              <p className="mt-4 max-w-lg leading-7 text-slate-600">
                {status === 'success'
                  ? 'Your request is safely recorded. We’ll follow up using the email you provided.'
                  : 'This local environment validated the request but does not retain marketing leads. Production stores requests securely.'}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button className="rounded-full bg-emerald-800 px-6 py-3 font-black text-white" onClick={onClose} type="button">
                  Return to Grover
                </button>
                <a className="inline-flex min-h-12 items-center justify-center rounded-full border border-slate-300 px-6 py-3 font-black text-slate-800" href="/app">
                  Explore the workspace
                </a>
              </div>
            </div>
          ) : (
            <form className="p-7 sm:p-10" onSubmit={submit}>
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="text-sm font-bold text-slate-700">
                  I’m exploring Grover as
                  <select className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-slate-950" onChange={(event) => setPersona(event.target.value as MarketingPersona)} value={persona}>
                    {Object.entries(personaLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </label>
                <label className="text-sm font-bold text-slate-700">
                  Name
                  <input autoComplete="name" className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-3 font-normal text-slate-950" maxLength={120} onChange={(event) => setFullName(event.target.value)} required value={fullName} />
                </label>
                <label className="text-sm font-bold text-slate-700">
                  Work email
                  <input autoComplete="email" className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-3 font-normal text-slate-950" maxLength={254} onChange={(event) => setEmail(event.target.value)} required type="email" value={email} />
                </label>
                <label className="text-sm font-bold text-slate-700">
                  Company or portfolio
                  <input autoComplete="organization" className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-3 font-normal text-slate-950" maxLength={160} onChange={(event) => setCompanyName(event.target.value)} value={companyName} />
                </label>
                <label className="text-sm font-bold text-slate-700 sm:col-span-2">
                  Team or portfolio size
                  <select className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 font-normal text-slate-950" onChange={(event) => setTeamSize(event.target.value)} value={teamSize}>
                    <option value="">Choose the closest fit</option>
                    <option value="1">Just me / one property</option>
                    <option value="2-5">2–5 people or properties</option>
                    <option value="6-20">6–20 people or properties</option>
                    <option value="21-100">21–100 people or properties</option>
                    <option value="100+">More than 100</option>
                  </select>
                </label>
                <label className="text-sm font-bold text-slate-700 sm:col-span-2">
                  What would make Grover valuable to you?
                  <textarea className="mt-2 min-h-28 w-full rounded-xl border border-slate-300 px-3 py-3 font-normal text-slate-950" maxLength={2000} onChange={(event) => setMessage(event.target.value)} value={message} />
                </label>
              </div>
              <label className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
                Website
                <input autoComplete="off" onChange={(event) => setWebsite(event.target.value)} tabIndex={-1} value={website} />
              </label>
              <label className="mt-5 flex items-start gap-3 text-sm leading-6 text-slate-600">
                <input checked={consent} className="mt-1 h-4 w-4 accent-emerald-700" onChange={(event) => setConsent(event.target.checked)} required type="checkbox" />
                <span>I agree that Grover may contact me about this request. My details will only be used to continue this product conversation.</span>
              </label>
              {status === 'error' ? (
                <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-bold text-rose-800" role="alert">
                  We couldn’t safely record your request. Please try again.
                </p>
              ) : null}
              <button className="mt-6 w-full rounded-full bg-emerald-700 px-6 py-3 font-black text-white transition hover:bg-emerald-600 disabled:cursor-wait disabled:opacity-70" disabled={status === 'submitting'} type="submit">
                {status === 'submitting' ? 'Sending securely…' : callToAction.label}
              </button>
              <p className="mt-3 text-center text-xs text-slate-500">No mailing list. No automated sales sequence.</p>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}
