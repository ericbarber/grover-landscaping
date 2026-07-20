import { useEffect, useState } from 'react';
import type { MarketingPersona } from '../api/marketingLeadsClient';
import { trackMarketingEvent } from '../api/marketingAnalyticsClient';
import {
  marketingPathForPersona,
  type MarketingPersonaId,
} from '../domain/marketingRoute';
import {
  marketingCallToAction,
  MarketingLeadDialog,
} from './MarketingLeadDialog';
import { MarketingProductTour } from './MarketingProductTour';

const marketingPersonas: Array<{
  id: MarketingPersonaId;
  label: string;
  eyebrow: string;
  headline: string;
  description: string;
  outcomes: [string, string, string];
}> = [
  {
    id: 'owner',
    label: 'Yard owner',
    eyebrow: 'Confidence after every visit',
    headline: 'See the care behind your yard.',
    description: 'Know what was planned, what was completed, and what your property may need next.',
    outcomes: ['Upcoming service', 'Before-and-after proof', 'Recommendations in one place'],
  },
  {
    id: 'property-manager',
    label: 'Property manager',
    eyebrow: 'Clarity across every address',
    headline: 'Keep every property ready.',
    description: 'Track service quality, open needs, and completion evidence across your portfolio.',
    outcomes: ['Portfolio-wide visibility', 'Fewer status calls', 'Property-ready reports'],
  },
  {
    id: 'company',
    label: 'Landscaping company',
    eyebrow: 'Operations customers can trust',
    headline: 'Turn great field work into growth.',
    description: 'Connect scheduling, crews, proof, customer communication, and revenue in one operating view.',
    outcomes: ['Clearer daily execution', 'Faster approvals', 'More work ready to invoice'],
  },
  {
    id: 'crew',
    label: 'Crew lead',
    eyebrow: 'A better day in the field',
    headline: 'Know the next stop—and what done looks like.',
    description: 'Give crews the route, service details, and evidence requirements they need without the office back-and-forth.',
    outcomes: ['Field-ready routes', 'Offline work capture', 'Clean handoffs'],
  },
];

function marketingPersonaFor(id: MarketingPersonaId): MarketingPersona {
  if (id === 'owner') return 'yard_owner';
  if (id === 'property-manager') return 'property_manager';
  if (id === 'crew') return 'crew_lead';
  return 'landscaping_company';
}

export function PublicLandingPage({
  initialPersonaId = 'company',
}: {
  initialPersonaId?: MarketingPersonaId;
}) {
  const [activePersonaId, setActivePersonaId] = useState<MarketingPersonaId>(initialPersonaId);
  const [leadDialogPersona, setLeadDialogPersona] = useState<MarketingPersona | null>(null);
  const activePersona = marketingPersonas.find((persona) => persona.id === activePersonaId)
    ?? marketingPersonas[0];
  const activeMarketingPersona = marketingPersonaFor(activePersona.id);
  const activeCallToAction = marketingCallToAction(activeMarketingPersona);

  useEffect(() => {
    const title = `${activePersona.label} landscaping software | Grover`;
    const description = activePersona.description;
    const canonicalUrl = new URL(marketingPathForPersona(activePersona.id), window.location.origin)
      .toString();
    document.title = title;
    setMetadata('description', description);
    setMetadata('og:title', title, 'property');
    setMetadata('og:description', description, 'property');
    setMetadata('og:type', 'website', 'property');
    setMetadata('og:url', canonicalUrl, 'property');
    setMetadata('twitter:card', 'summary_large_image');
    setMetadata('twitter:title', title);
    setMetadata('twitter:description', description);
    setCanonicalUrl(canonicalUrl);
  }, [activePersona]);

  useEffect(() => {
    trackMarketingEvent('page_view', marketingPersonaFor(initialPersonaId));
  }, [initialPersonaId]);

  function openLeadDialog(persona: MarketingPersona, placement: string) {
    trackMarketingEvent('cta_clicked', persona, placement);
    setLeadDialogPersona(persona);
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f6f7f2] text-slate-950">
      <header className="fixed inset-x-0 top-0 z-30 border-b border-white/10 bg-slate-950/80 text-white backdrop-blur-xl">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8" aria-label="Main navigation">
          <a className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.25em]" href="/">
            <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_0_5px_rgba(52,211,153,0.16)]" />
            Grover
          </a>
          <div className="hidden items-center gap-7 text-sm font-bold text-slate-200 md:flex">
            <a className="transition hover:text-white" href="#tour">How it works</a>
            <a className="transition hover:text-white" href="#who-its-for">Who it’s for</a>
            <a className="transition hover:text-white" href="#proof">Why Grover</a>
          </div>
          <a className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-black text-emerald-950 transition hover:bg-emerald-300" href="/app">
            Open Grover
          </a>
        </nav>
      </header>

      <section className="relative min-h-[46rem] overflow-hidden bg-slate-950 px-4 pb-16 pt-28 text-white sm:px-6 lg:px-8">
        <img alt="" className="absolute inset-0 h-full w-full object-cover object-center" src="/brand/grover-landscape-home-hero.webp" />
        <span className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/78 to-emerald-950/20" />
        <span className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/10 to-slate-950/25" />
        <div className="relative mx-auto grid min-h-[36rem] max-w-7xl items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-300 sm:text-sm">
              {activePersona.eyebrow}
            </p>
            <h1 className="mt-6 text-5xl font-black leading-[0.92] tracking-[-0.045em] sm:text-6xl lg:text-7xl xl:text-8xl">
              {activePersona.headline}
            </h1>
            <p className="mt-7 max-w-2xl text-lg font-medium leading-8 text-slate-200 sm:text-xl">
              {activePersona.description} Grover connects the people, properties, and proof behind exceptional landscape care.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <button className="inline-flex min-h-12 items-center justify-center rounded-full bg-emerald-400 px-6 py-3 font-black text-emerald-950 transition hover:bg-emerald-300" onClick={() => openLeadDialog(activeMarketingPersona, 'hero')} type="button">
                {activeCallToAction.label} <span className="ml-2" aria-hidden="true">→</span>
              </button>
              <a className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/25 bg-white/10 px-6 py-3 font-black text-white backdrop-blur-sm transition hover:bg-white/15" href="#who-its-for">
                See who it’s for
              </a>
            </div>
          </div>

          <div className="hidden justify-self-end lg:block">
            <div className="w-[25rem] rotate-2 rounded-[2rem] border border-white/20 bg-slate-950/55 p-4 shadow-2xl backdrop-blur-xl">
              <div className="rounded-[1.4rem] bg-white p-5 text-slate-950">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">Today at a glance</p>
                    <p className="mt-2 text-2xl font-black">A clear day ahead.</p>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800">On track</span>
                </div>
                <div className="mt-6 grid grid-cols-3 gap-2">
                  {[
                    ['8', 'Properties'],
                    ['5', 'Complete'],
                    ['3', 'Remaining'],
                  ].map(([value, label]) => (
                    <div className="rounded-xl bg-slate-100 p-3" key={label}>
                      <p className="text-2xl font-black">{value}</p>
                      <p className="mt-1 text-[0.65rem] font-bold uppercase tracking-wide text-slate-500">{label}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 rounded-xl bg-emerald-800 p-4 text-white">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-200">Recommended next</p>
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-lg font-black">Continue today’s route</p>
                    <span className="text-2xl" aria-hidden="true">→</span>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-200 p-3 text-sm">
                  <span className="font-bold">Customer-ready proof</span>
                  <span className="font-black text-emerald-700">5 reports</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="relative mx-auto grid max-w-7xl grid-cols-3 gap-3 border-t border-white/15 pt-7 text-center sm:text-left">
          {['Built for the field', 'Visible to customers', 'Ready for every role'].map((item) => (
            <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-300 sm:text-sm" key={item}>{item}</p>
          ))}
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8" id="who-its-for">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">One platform, every perspective</p>
            <h2 className="mt-4 text-4xl font-black leading-tight tracking-tight sm:text-5xl">Relevant from the first tap.</h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">Choose a perspective to see how Grover turns the same field work into the clarity each person needs.</p>
          </div>
          <div className="mt-9 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap" role="tablist" aria-label="Choose your perspective">
            {marketingPersonas.map((persona) => (
              <button
                aria-selected={persona.id === activePersona.id}
                className={`rounded-full px-3 py-2.5 text-xs font-black transition sm:px-4 sm:text-sm ${
                  persona.id === activePersona.id
                    ? 'bg-emerald-800 text-white shadow-lg shadow-emerald-950/15'
                    : 'border border-slate-300 bg-white text-slate-700 hover:border-emerald-500'
                }`}
                key={persona.id}
                onClick={() => {
                  setActivePersonaId(persona.id);
                  trackMarketingEvent('persona_selected', marketingPersonaFor(persona.id), 'audience_tabs');
                  window.history.replaceState(
                    null,
                    '',
                    `${marketingPathForPersona(persona.id)}${window.location.search}`,
                  );
                }}
                role="tab"
                type="button"
              >
                {persona.label}
              </button>
            ))}
          </div>
          <article className="mt-5 grid overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-xl lg:grid-cols-[0.9fr_1.1fr]" role="tabpanel">
            <div className="p-7 sm:p-10">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">{activePersona.eyebrow}</p>
              <h3 className="mt-4 text-4xl font-black leading-tight tracking-tight">{activePersona.headline}</h3>
              <p className="mt-4 text-base leading-7 text-slate-300">{activePersona.description}</p>
              <button
                className="mt-7 rounded-full bg-emerald-400 px-5 py-3 font-black text-emerald-950 transition hover:bg-emerald-300"
                onClick={() => openLeadDialog(activeMarketingPersona, 'persona_panel')}
                type="button"
              >
                {activeCallToAction.label} <span className="ml-1" aria-hidden="true">→</span>
              </button>
            </div>
            <div className="grid gap-px bg-white/10 sm:grid-cols-3">
              {activePersona.outcomes.map((outcome, index) => (
                <div className="bg-emerald-950/60 p-6" key={outcome}>
                  <p className="text-sm font-black text-emerald-300">0{index + 1}</p>
                  <p className="mt-8 text-lg font-black">{outcome}</p>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>

      <MarketingProductTour persona={activePersona.id} />

      <section className="bg-white px-4 py-20 sm:px-6 lg:px-8" id="proof">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Credibility by design</p>
              <h2 className="mt-4 text-4xl font-black leading-tight tracking-tight sm:text-5xl">
                Built around the moments that usually fall through the cracks.
              </h2>
            </div>
            <p className="max-w-2xl text-lg leading-8 text-slate-600">
              Grover’s proof is in the workflow: durable planning, field-safe capture, traceable decisions, and customer-ready handoffs. Every claim below maps to a working product capability.
            </p>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['Works beyond the signal', 'Offline mutations queue locally and recover when connectivity returns.', 'Field resilience'],
              ['Keeps decisions traceable', 'Route changes, access updates, and recovery actions retain an operational record.', 'Accountability'],
              ['Protects every perspective', 'Organization roles and persona-aware workspaces keep the right tools in view.', 'Role-aware access'],
              ['Turns work into evidence', 'Photos, notes, checklists, reports, bids, and recommendations stay connected.', 'Visible outcomes'],
            ].map(([title, description, label]) => (
              <article className="flex min-h-64 flex-col rounded-[1.75rem] border border-slate-200 bg-[#f6f7f2] p-6" key={title}>
                <span className="grid h-10 w-10 place-items-center rounded-full bg-emerald-800 text-lg font-black text-white" aria-hidden="true">✓</span>
                <h3 className="mt-8 text-xl font-black tracking-tight">{title}</h3>
                <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">{description}</p>
                <p className="mt-6 border-t border-slate-200 pt-4 text-xs font-black uppercase tracking-[0.15em] text-emerald-700">{label}</p>
              </article>
            ))}
          </div>
          <div className="mt-6 rounded-[1.75rem] bg-emerald-50 p-6 sm:flex sm:items-center sm:justify-between sm:gap-8 sm:p-8">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.17em] text-emerald-700">Our evidence standard</p>
              <p className="mt-2 max-w-3xl text-lg font-bold leading-7 text-emerald-950">
                Customer results will appear here only when they are verified and approved—not as placeholder logos, invented quotes, or speculative percentages.
              </p>
            </div>
            <a className="mt-5 inline-flex shrink-0 items-center font-black text-emerald-800 sm:mt-0" href="#tour">
              Inspect the workflow <span className="ml-2" aria-hidden="true">↑</span>
            </a>
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8" id="product">
        <div className="mx-auto grid max-w-7xl gap-10 rounded-[2rem] bg-emerald-900 p-7 text-white sm:p-10 lg:grid-cols-2 lg:items-center lg:p-14">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-300">Designed around the work</p>
            <h2 className="mt-4 text-4xl font-black leading-tight tracking-tight sm:text-5xl">Less chasing. More confidence.</h2>
            <p className="mt-5 max-w-xl text-lg leading-8 text-emerald-50/80">
              Grover brings schedules, route context, field evidence, customer communication, and operational follow-through into one role-aware experience.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ['Offline-ready field work', 'Keep moving when coverage does not.'],
              ['Customer-ready reports', 'Show the result, not just the status.'],
              ['Persona-aware workspaces', 'Give each role the right next step.'],
              ['Revenue-ready handoffs', 'Move completed work toward approval and billing.'],
            ].map(([title, description]) => (
              <article className="rounded-2xl border border-white/15 bg-white/10 p-5" key={title}>
                <p className="font-black">{title}</p>
                <p className="mt-2 text-sm leading-6 text-emerald-50/75">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-950 px-4 py-20 text-center text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-300">Make the work visible</p>
          <h2 className="mt-5 text-4xl font-black leading-tight tracking-tight sm:text-6xl">A better property experience starts with a clearer day.</h2>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-slate-300">Step into Grover and explore the role-aware workspace already taking shape.</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button className="inline-flex min-h-12 items-center justify-center rounded-full bg-emerald-400 px-7 py-3 font-black text-emerald-950 transition hover:bg-emerald-300" onClick={() => openLeadDialog(activeMarketingPersona, 'final_cta')} type="button">
              {activeCallToAction.label} <span className="ml-2" aria-hidden="true">→</span>
            </button>
            <a className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/20 px-7 py-3 font-black text-white transition hover:bg-white/10" href="/app">
              Existing user sign in
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-800 bg-slate-950 px-4 py-8 text-slate-400 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="font-black uppercase tracking-[0.2em] text-white">Grover</p>
          <p>Plan the work. Care for the property. Prove the difference.</p>
        </div>
      </footer>
      {leadDialogPersona ? (
        <MarketingLeadDialog
          initialPersona={leadDialogPersona}
          onClose={() => setLeadDialogPersona(null)}
        />
      ) : null}
    </main>
  );
}

function setMetadata(name: string, content: string, attribute = 'name') {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${name}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, name);
    document.head.appendChild(element);
  }
  element.content = content;
}

function setCanonicalUrl(url: string) {
  let element = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!element) {
    element = document.createElement('link');
    element.rel = 'canonical';
    document.head.appendChild(element);
  }
  element.href = url;
}
