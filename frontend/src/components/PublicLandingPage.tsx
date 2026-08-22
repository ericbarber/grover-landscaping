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
import { OWNER_ACQUISITION_PATH } from '../domain/ownerAcquisitionRoute';
import { GroverBrand } from './GroverBrand';

const marketingPersonas: Array<{
  id: MarketingPersonaId;
  label: string;
  eyebrow: string;
  headline: string;
  description: string;
  outcomes: Array<{ title: string; description: string }>;
  preview: {
    status: string;
    kicker: string;
    title: string;
    description: string;
    progress: number;
    progressLabel: string;
    metaOne: string;
    metaTwo: string;
  };
}> = [
  {
    id: 'owner',
    label: 'Yard owner',
    eyebrow: 'Confidence after every visit',
    headline: 'See the care behind your yard.',
    description: 'Know what was planned, what was completed, and what your property may need next—without chasing an update.',
    outcomes: [
      { title: 'Know what’s next', description: 'Upcoming service and property expectations stay easy to find.' },
      { title: 'See the care', description: 'Before-and-after evidence makes each visit feel tangible.' },
      { title: 'Stay ahead', description: 'Recommendations arrive with the context needed to decide.' },
    ],
    preview: {
      status: 'Report ready',
      kicker: 'Oak Street residence',
      title: 'Your latest service is ready',
      description: 'Completed work, photo evidence, and the next recommendation are together in one update.',
      progress: 100,
      progressLabel: 'Latest service report complete',
      metaOne: 'Service complete',
      metaTwo: '1 recommendation',
    },
  },
  {
    id: 'property-manager',
    label: 'Property manager',
    eyebrow: 'Clarity across every address',
    headline: 'Keep every property ready.',
    description: 'Track service quality, open needs, and completion evidence across your portfolio from one focused view.',
    outcomes: [
      { title: 'See the whole portfolio', description: 'Service progress and open needs stay visible across addresses.' },
      { title: 'Replace status chasing', description: 'Shared progress reduces calls between properties and vendors.' },
      { title: 'Report with confidence', description: 'Property-ready evidence supports owners and stakeholders.' },
    ],
    preview: {
      status: '2 need review',
      kicker: 'Portfolio readiness',
      title: '14 of 16 properties on track',
      description: 'The two open needs have owners, due dates, and service evidence ready for review.',
      progress: 88,
      progressLabel: 'Fourteen of sixteen properties on track',
      metaOne: '14 on track',
      metaTwo: '2 owned needs',
    },
  },
  {
    id: 'company',
    label: 'Landscaping company',
    eyebrow: 'Operations customers can trust',
    headline: 'Plan every visit. Care with confidence. Prove the work.',
    description: 'Connect scheduling, crews, proof, customer communication, and revenue in one calm operating view.',
    outcomes: [
      { title: 'Run a clearer day', description: 'Routes, crews, property context, and exceptions stay connected.' },
      { title: 'Move approvals faster', description: 'Evidence and recommendations give customers a complete story.' },
      { title: 'Turn work into revenue', description: 'Verified completion keeps approved work moving toward invoice.' },
    ],
    preview: {
      status: 'On track',
      kicker: 'Today · North crew',
      title: '6 of 8 properties complete',
      description: 'Photos are synced and one completion report is ready for review.',
      progress: 75,
      progressLabel: 'Six of eight properties complete',
      metaOne: 'Field progress visible',
      metaTwo: '1 review needed',
    },
  },
  {
    id: 'crew',
    label: 'Crew lead',
    eyebrow: 'A better day in the field',
    headline: 'Know the next stop—and what done looks like.',
    description: 'Give crews the route, service details, and evidence requirements they need without the office back-and-forth.',
    outcomes: [
      { title: 'Start field-ready', description: 'Every stop includes the service and property details crews need.' },
      { title: 'Keep working offline', description: 'Progress and evidence wait safely when coverage disappears.' },
      { title: 'Finish with a clean handoff', description: 'Photos, notes, and exceptions reach the office together.' },
    ],
    preview: {
      status: 'In progress',
      kicker: 'Stop 3 of 8',
      title: 'Oak Street residence',
      description: 'Four of six tasks are complete. Required property context is available offline.',
      progress: 67,
      progressLabel: 'Four of six tasks complete',
      metaOne: 'Details offline-ready',
      metaTwo: '2 tasks remain',
    },
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

  function selectPersona(personaId: MarketingPersonaId, placement: string) {
    setActivePersonaId(personaId);
    trackMarketingEvent('persona_selected', marketingPersonaFor(personaId), placement);
    window.history.replaceState(
      null,
      '',
      `${marketingPathForPersona(personaId)}${window.location.search}`,
    );
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-bone text-ink">
      <header className="sticky inset-x-0 top-0 z-30 border-b border-slate-200 bg-paper/95 backdrop-blur-xl">
        <nav className="mx-auto flex min-h-20 max-w-[86rem] items-center justify-between px-4 sm:px-6 lg:px-8" aria-label="Main navigation">
          <a aria-label="Grover home" className="text-emerald-800" href="/">
            <GroverBrand />
          </a>
          <div className="hidden items-center gap-7 text-sm font-bold text-slate-600 md:flex">
            <a className="min-h-11 content-center underline-offset-4 transition hover:text-emerald-800 hover:underline" href="#tour">How it works</a>
            <a className="min-h-11 content-center underline-offset-4 transition hover:text-emerald-800 hover:underline" href="#who-its-for">Who it helps</a>
            <a className="min-h-11 content-center underline-offset-4 transition hover:text-emerald-800 hover:underline" href="#proof">Why Grover</a>
          </div>
          <a className="grover-button-primary px-4 sm:px-5" href="/app">
            Open Grover
          </a>
        </nav>
      </header>

      <section className="grid bg-bone lg:min-h-[42rem] lg:grid-cols-[1.02fr_0.98fr]">
        <div className="flex items-center px-4 py-14 sm:px-8 sm:py-20 lg:px-[max(2rem,calc((100vw-86rem)/2+2rem))] lg:py-24">
          <div className="w-full max-w-[40rem]">
            <p className="grover-eyebrow flex items-center gap-3 before:h-px before:w-7 before:bg-emerald-700">
              {activePersona.eyebrow}
            </p>
            <h1 className="grover-display mt-6 max-w-[12ch] text-[clamp(3.25rem,6vw,5.8rem)] leading-[0.98]">
              {activePersona.headline}
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-slate-600 sm:text-xl">
              {activePersona.description}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap" aria-label="Get started with Grover">
              <a
                className={activePersona.id === 'owner' ? 'grover-button-primary' : 'grover-button-secondary'}
                href={OWNER_ACQUISITION_PATH}
                onClick={() => trackMarketingEvent('cta_clicked', 'yard_owner', 'hero_yard_signup')}
              >
                Sign up your yard <span className="ml-2" aria-hidden="true">→</span>
              </a>
              <a
                className={activePersona.id === 'owner' ? 'grover-button-secondary' : 'grover-button-primary'}
                href="/app"
                onClick={() => trackMarketingEvent('cta_clicked', 'landscaping_company', 'hero_company_signup')}
              >
                Sign up your company <span className="ml-2" aria-hidden="true">→</span>
              </a>
            </div>
            <button className="mt-4 min-h-11 px-1 text-sm font-extrabold text-slate-600 underline decoration-slate-300 underline-offset-4 transition hover:text-emerald-800" onClick={() => openLeadDialog(activeMarketingPersona, 'hero_conversation')} type="button">
              {activeCallToAction.label}
            </button>
            <div className="mt-10">
              <p className="text-xs font-extrabold uppercase tracking-[0.1em] text-slate-600">Show me Grover as a</p>
              <div className="mt-3 flex flex-wrap gap-2" role="tablist" aria-label="Choose your perspective">
                {marketingPersonas.map((persona) => (
                  <button
                    aria-selected={persona.id === activePersona.id}
                    className={`min-h-11 rounded-full border px-3.5 py-2 text-xs font-extrabold transition ${persona.id === activePersona.id ? 'border-emerald-800 bg-emerald-800 text-white shadow-grover-sm' : 'border-slate-200 bg-paper text-slate-600 hover:border-emerald-700 hover:text-emerald-800'}`}
                    key={persona.id}
                    onClick={() => selectPersona(persona.id, 'hero_audience_tabs')}
                    role="tab"
                    type="button"
                  >
                    {persona.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="relative min-h-[31rem] overflow-hidden bg-forest lg:min-h-[42rem] lg:rounded-bl-[5rem]">
          <img alt="Landscape care team working in a Southwestern garden at sunrise" className="absolute inset-0 h-full w-full object-cover object-center" src="/brand/grover-landscape-home-hero.webp" />
          <span className="absolute inset-0 bg-gradient-to-t from-forest/35 via-transparent to-transparent" />
          <article aria-live="polite" className="absolute bottom-5 left-4 right-4 rounded-[1.35rem] border border-white/60 bg-paper/95 p-5 text-ink shadow-grover-lg backdrop-blur sm:bottom-8 sm:left-auto sm:right-8 sm:w-[min(31rem,calc(100%-4rem))] sm:p-7 lg:bottom-14 lg:right-12">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[0.62rem] font-black uppercase tracking-[0.14em] text-slate-600">Illustrative product preview</p>
              <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-[0.65rem] font-black uppercase tracking-wide text-emerald-800">{activePersona.preview.status}</span>
            </div>
            <p className="mt-5 text-[0.7rem] font-black uppercase tracking-[0.1em] text-emerald-700">{activePersona.preview.kicker}</p>
            <h2 className="mt-2 text-2xl font-black leading-tight text-ink sm:text-[1.75rem]">{activePersona.preview.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{activePersona.preview.description}</p>
            <div aria-label={activePersona.preview.progressLabel} className="mt-5 h-2 overflow-hidden rounded-full bg-emerald-100" role="progressbar" aria-valuemax={100} aria-valuemin={0} aria-valuenow={activePersona.preview.progress}>
              <span className="block h-full rounded-full bg-emerald-700 transition-[width]" style={{ width: `${activePersona.preview.progress}%` }} />
            </div>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs font-bold text-slate-600">
              <span className="flex items-center gap-2 before:h-2 before:w-2 before:rounded-full before:bg-emerald-700">{activePersona.preview.metaOne}</span>
              <span className="flex items-center gap-2 before:h-2 before:w-2 before:rounded-full before:bg-[#c99f55]">{activePersona.preview.metaTwo}</span>
            </div>
          </article>
        </div>
      </section>

      <section aria-labelledby="trust-heading" className="grid gap-5 bg-emerald-800 px-4 py-6 text-white sm:px-6 lg:grid-cols-[minmax(13rem,0.8fr)_minmax(0,3.2fr)] lg:items-center lg:px-[max(2rem,calc((100vw-86rem)/2+2rem))]">
        <h2 className="text-xs font-black uppercase tracking-[0.14em] text-sand" id="trust-heading">One shared view of the work</h2>
        <ul className="grid gap-3 text-sm font-bold text-emerald-50 sm:grid-cols-2 lg:grid-cols-4">
          {['Offline-ready field progress', 'Role-aware workspaces', 'Evidence linked to service', 'Traceable operational decisions'].map((item) => (
            <li className="flex items-center gap-2 before:text-sand before:content-['✓']" key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8" id="who-its-for">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">One platform, every perspective</p>
            <h2 className="grover-display mt-4 text-4xl leading-tight sm:text-5xl">Relevant from the first tap.</h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">Choose a perspective to see how Grover turns the same field work into the clarity each person needs.</p>
          </div>
          <article className="mt-5 grid overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-xl lg:grid-cols-[0.9fr_1.1fr]" role="tabpanel">
            <div className="p-7 sm:p-10">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">{activePersona.eyebrow}</p>
              <h3 className="mt-4 font-display text-4xl font-bold leading-tight tracking-tight">{activePersona.headline}</h3>
              <p className="mt-4 text-base leading-7 text-slate-300">{activePersona.description}</p>
              <button
                className="mt-7 rounded-full bg-emerald-400 px-5 py-3 font-black text-emerald-950 transition hover:bg-emerald-300"
                onClick={() => openLeadDialog(activeMarketingPersona, 'persona_panel')}
                type="button"
              >
                {activeCallToAction.label} <span className="ml-1" aria-hidden="true">→</span>
              </button>
              {activePersona.id === 'owner' ? (
                <a
                  className="ml-0 mt-3 inline-flex min-h-12 items-center rounded-full border border-white/25 px-5 py-3 font-black text-white hover:bg-white/10 sm:ml-2 sm:mt-0"
                  href={OWNER_ACQUISITION_PATH}
                  onClick={() => trackMarketingEvent('cta_clicked', 'yard_owner', 'persona_private_setup')}
                >
                  Create my private yard
                </a>
              ) : null}
            </div>
            <div className="bg-gradient-to-br from-emerald-950 via-emerald-950 to-slate-950 p-5 sm:p-7">
              <div className="flex items-end justify-between gap-4 border-b border-white/10 pb-5">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">What improves</p>
                  <p className="mt-2 text-xl font-black">One connected view. Three meaningful outcomes.</p>
                </div>
                <span aria-hidden="true" className="hidden text-3xl text-emerald-400 sm:block">↗</span>
              </div>
              <div className="mt-2 divide-y divide-white/10">
                {activePersona.outcomes.map((outcome) => (
                  <div className="group grid grid-cols-[2.75rem_1fr] gap-3 py-5" key={outcome.title}>
                    <span aria-hidden="true" className="grid h-10 w-10 place-items-center rounded-xl border border-emerald-300/20 bg-emerald-400/10 font-black text-emerald-300 transition group-hover:bg-emerald-400 group-hover:text-emerald-950">✓</span>
                    <div>
                      <p className="text-lg font-black text-white">{outcome.title}</p>
                      <p className="mt-1 text-sm leading-6 text-emerald-50/65">{outcome.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </article>
        </div>
      </section>

      <MarketingProductTour persona={activePersona.id} />

      <section className="bg-paper px-4 py-20 sm:px-6 lg:px-8" id="proof">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Credibility by design</p>
              <h2 className="grover-display mt-4 text-4xl leading-tight sm:text-5xl">
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
              <article className="flex min-h-64 flex-col rounded-2xl border border-slate-200 bg-bone p-6" key={title}>
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
            <h2 className="mt-4 font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl">Less chasing. More confidence.</h2>
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
          <h2 className="mt-5 font-display text-4xl font-bold leading-tight tracking-tight sm:text-6xl">A better property experience starts with a clearer day.</h2>
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
          <GroverBrand className="text-white" />
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
