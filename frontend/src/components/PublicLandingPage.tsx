import { useEffect, useState, type KeyboardEvent } from 'react';
import type { MarketingPersona } from '../api/marketingLeadsClient';
import { trackMarketingEvent } from '../api/marketingAnalyticsClient';
import {
  marketingCanonicalPath,
  type MarketingPersonaId,
} from '../domain/marketingRoute';
import {
  marketingCallToAction,
  MarketingLeadDialog,
} from './MarketingLeadDialog';
import { MarketingProductTour } from './MarketingProductTour';
import { OWNER_ACQUISITION_PATH } from '../domain/ownerAcquisitionRoute';
import { ProductBrand } from './ProductBrand';
import { providerEntryHref } from '../domain/providerEntryRoute';
import { PRODUCT_NAME, productPageTitle } from '../productBrand';

const marketingPersonas: Array<{
  id: MarketingPersonaId;
  label: string;
  eyebrow: string;
  headline: string;
  description: string;
  perspective: {
    eyebrow: string;
    title: string;
    description: string;
  };
  outcomes: Array<{ title: string; description: string }>;
  journey: Array<{
    id: 'plan' | 'care' | 'prove';
    label: string;
    status: string;
    kicker: string;
    title: string;
    description: string;
    progress: number;
    progressLabel: string;
    metaOne: string;
    metaTwo: string;
  }>;
  trust: {
    heading: string;
    items: string[];
  };
  proof: {
    eyebrow: string;
    title: string;
    description: string;
    cards: Array<{ title: string; description: string; label: string }>;
  };
  product: {
    eyebrow: string;
    title: string;
    description: string;
    capabilities: Array<{ title: string; description: string }>;
  };
  invitation: {
    eyebrow: string;
    title: string;
    description: string;
  };
}> = [
  {
    id: 'owner',
    label: 'Yard owner',
    eyebrow: 'A private service record for your yard',
    headline: 'Know what happened—without chasing an update.',
    description: 'Keep upcoming visits, completed work, photos, and recommendations together while you control what your provider can see.',
    perspective: {
      eyebrow: 'A homeowner-first view',
      title: 'The service story—without the operations clutter.',
      description: 'See upcoming care, progress, proof, and recommendations in homeowner language while provider coordination stays with the provider.',
    },
    outcomes: [
      { title: 'Know what’s next', description: 'Upcoming service and property expectations stay easy to find.' },
      { title: 'See the care', description: 'Before-and-after evidence makes each visit feel tangible.' },
      { title: 'Stay ahead', description: 'Recommendations arrive with the context needed to decide.' },
    ],
    journey: [
      {
        id: 'plan', label: 'Upcoming', status: 'Confirmed', kicker: 'Next visit',
        title: 'Tuesday · 8:00–10:00 AM',
        description: 'Weekly care, approved yard details, and the visit plan are ready in one place.',
        progress: 33, progressLabel: 'Upcoming visit confirmed',
        metaOne: 'Mow, edge + inspect', metaTwo: 'Private notes protected',
      },
      {
        id: 'care', label: 'In progress', status: 'Care underway', kicker: 'Today’s service',
        title: 'Your crew has started',
        description: 'Follow the visit without interrupting the people caring for your yard.',
        progress: 67, progressLabel: 'Two of three service stages complete',
        metaOne: 'Front yard complete', metaTwo: 'Irrigation check next',
      },
      {
        id: 'prove', label: 'Review', status: 'Report ready', kicker: 'Latest visit',
        title: 'Your care summary is ready',
        description: 'Completed work, photo evidence, and the next recommendation are together.',
        progress: 100, progressLabel: 'Latest service report complete',
        metaOne: '4 photos delivered', metaTwo: '1 recommendation',
      },
    ],
    trust: {
      heading: 'Confidence before and after care',
      items: ['Private yard setup', 'Upcoming care in one place', 'Evidence tied to each visit', 'Recommendations you control'],
    },
    proof: {
      eyebrow: 'Clarity for your yard',
      title: 'Yard care should never feel like a mystery.',
      description: `${PRODUCT_NAME} keeps your property private while you get started, then connects each visit, update, and recommendation into a story you can actually follow.`,
      cards: [
        { title: 'Start privately', description: 'Describe your yard before choosing what any provider can see.', label: 'Owner control' },
        { title: 'Know the plan', description: 'Find upcoming service expectations without chasing an update.', label: 'Service confidence' },
        { title: 'See what changed', description: 'Review photos, notes, and completion details together.', label: 'Visible care' },
        { title: 'Choose what comes next', description: 'Consider recommendations and proposals with their full context.', label: 'Informed decisions' },
      ],
    },
    product: {
      eyebrow: 'Your yard, one connected story',
      title: 'From connecting your provider to understanding every visit.',
      description: 'A private place to describe the yard, connect a provider you know, follow service, and keep proof of the work without learning an operations system.',
      capabilities: [
        { title: 'Private yard brief', description: 'Start with your goals and property context.' },
        { title: 'Connection controls', description: 'Choose who can review each detail.' },
        { title: 'Service-day visibility', description: 'Know what is planned and completed.' },
        { title: 'Proof and recommendations', description: 'Keep outcomes and next decisions together.' },
      ],
    },
    invitation: {
      eyebrow: 'Start with your yard',
      title: 'Make the next care decision with more confidence.',
      description: 'Create your private yard setup now, then choose when and how to connect a provider.',
    },
  },
  {
    id: 'property-manager',
    label: 'Property manager',
    eyebrow: 'Clarity across every address',
    headline: 'Keep your entire property portfolio in view.',
    description: 'Review service status and delivered completion evidence across the properties you are authorized to access.',
    perspective: {
      eyebrow: 'Built for authorized portfolio oversight',
      title: 'Move from your portfolio to the exact service record.',
      description: 'Keep accessible properties visible, then open the right address, service summary, or delivered evidence without mixing customer records.',
    },
    outcomes: [
      { title: 'See your authorized portfolio', description: 'Accessible properties and service status stay visible by address.' },
      { title: 'Review delivered work', description: 'Customer-safe completion records replace scattered service updates.' },
      { title: 'Keep property context', description: 'Evidence stays connected to the correct customer and address.' },
    ],
    journey: [
      {
        id: 'plan', label: 'Access', status: 'Access verified', kicker: 'Authorized portfolio',
        title: '16 properties available',
        description: 'Active customer grants define exactly which properties and records are visible.',
        progress: 33, progressLabel: 'Portfolio access verified',
        metaOne: '16 active grants', metaTwo: 'Customer scope preserved',
      },
      {
        id: 'care', label: 'Review', status: '2 need review', kicker: 'Portfolio readiness',
        title: '14 of 16 properties on track',
        description: 'The two open needs have owners, due dates, and service evidence ready for review.',
        progress: 67, progressLabel: 'Fourteen of sixteen properties on track',
        metaOne: '14 on track', metaTwo: '2 owned needs',
      },
      {
        id: 'prove', label: 'Proof', status: 'Proof available', kicker: 'Delivered service history',
        title: '14 reports ready by address',
        description: 'Customer-safe completion evidence stays connected to the correct property.',
        progress: 100, progressLabel: 'Delivered service evidence available',
        metaOne: '14 delivered reports', metaTwo: 'Address-level history',
      },
    ],
    trust: {
      heading: 'Portfolio clarity within approved access',
      items: ['Scoped property access', 'Service status by property', 'Delivered evidence by address', 'Clear unavailable states'],
    },
    proof: {
      eyebrow: 'Clarity across the portfolio',
      title: 'Keep service records connected to the right address.',
      description: `${PRODUCT_NAME} brings authorized property status and delivered proof into one focused portfolio without exposing provider-private operations.`,
      cards: [
        { title: 'Respect property access', description: 'See only properties covered by an active authorized grant.', label: 'Authorized scope' },
        { title: 'Review service status', description: 'Scan customer-safe visit information for each accessible property.', label: 'Service visibility' },
        { title: 'Review by property', description: 'Keep delivered evidence tied to the correct address.', label: 'Property context' },
        { title: 'Retain delivered proof', description: 'Return to customer-safe completion history when access remains active.', label: 'Service history' },
      ],
    },
    product: {
      eyebrow: 'Built for authorized multi-property care',
      title: 'One focused view for the properties you can access.',
      description: 'Move from your authorized portfolio to the exact property status or delivered service evidence without rebuilding the story from messages.',
      capabilities: [
        { title: 'Authorized portfolio', description: 'See properties covered by active customer grants.' },
        { title: 'Service status', description: 'Review customer-safe visit information by address.' },
        { title: 'Address-level proof', description: 'Review delivered work in the right property context.' },
        { title: 'Delivered history', description: 'Return to available completion records over time.' },
      ],
    },
    invitation: {
      eyebrow: 'Bring the portfolio into focus',
      title: 'Keep authorized property service easier to review.',
      description: 'Tell us about your portfolio and we’ll shape the conversation around authorized access, service visibility, and delivered proof.',
    },
  },
  {
    id: 'company',
    label: 'Landscaping company',
    eyebrow: 'Operations customers can trust',
    headline: 'Plan the day. Guide the crew. Prove the work.',
    description: 'Connect daily planning, field progress, customer-ready proof, and follow-through in one calm operating view.',
    perspective: {
      eyebrow: 'One connected operation',
      title: 'Keep office, field, and customer work aligned.',
      description: 'Give each role the right operational view while plans, service progress, evidence, and customer follow-through stay connected.',
    },
    outcomes: [
      { title: 'Run a clearer day', description: 'Routes, crews, property context, and exceptions stay connected.' },
      { title: 'Move approvals faster', description: 'Evidence and recommendations give customers a complete story.' },
      { title: 'Deliver proof faster', description: 'Reviewed completion records move cleanly from the field to the customer.' },
    ],
    journey: [
      {
        id: 'plan', label: 'Plan', status: 'Plan ready', kicker: 'Today · North crew',
        title: '8 ordered stops',
        description: 'Routes, service expectations, and property context are ready before crews roll.',
        progress: 33, progressLabel: 'Today’s route plan is ready',
        metaOne: 'Workload balanced', metaTwo: 'Details published',
      },
      {
        id: 'care', label: 'Care', status: 'On track', kicker: 'Field progress',
        title: '6 of 8 properties complete',
        description: 'The office can see progress while crews keep working through the route.',
        progress: 75, progressLabel: 'Six of eight properties complete',
        metaOne: 'Field progress visible', metaTwo: '2 stops remain',
      },
      {
        id: 'prove', label: 'Prove', status: 'Review ready', kicker: 'Completion review',
        title: 'Service story ready',
        description: 'Photos, notes, and completion details are together for one customer-ready handoff.',
        progress: 100, progressLabel: 'Completion evidence ready for review',
        metaOne: 'Evidence complete', metaTwo: '1 review needed',
      },
    ],
    trust: {
      heading: 'One shared view of the work',
      items: ['Routes and workloads aligned', 'Offline-ready field progress', 'Evidence linked to service', 'Traceable operational decisions'],
    },
    proof: {
      eyebrow: 'Operational confidence by design',
      title: 'Run the day without losing the service story.',
      description: `${PRODUCT_NAME} connects planning, execution, evidence, and customer follow-through so the office and field can work from the same operational truth.`,
      cards: [
        { title: 'Plan a workable day', description: 'Balance routes, crew assignments, commitments, and workload risk.', label: 'Daily operations' },
        { title: 'Stay aligned in the field', description: 'Give crews property context and resilient progress capture.', label: 'Field execution' },
        { title: 'Review complete evidence', description: 'Connect photos, notes, exceptions, and completion status.', label: 'Quality control' },
        { title: 'Close the service loop', description: 'Carry verified service into customer updates and the next approved action.', label: 'Customer follow-through' },
      ],
    },
    product: {
      eyebrow: 'Designed around your operation',
      title: 'A calmer system from morning plan to customer-ready proof.',
      description: 'Give owners, managers, dispatchers, and crews the right view while keeping the underlying service story connected.',
      capabilities: [
        { title: 'Route and workload planning', description: 'Build a day crews can actually deliver.' },
        { title: 'Field-safe execution', description: 'Keep progress moving beyond the signal.' },
        { title: 'Customer-ready proof', description: 'Turn completed work into a clear update.' },
        { title: 'Accountable follow-through', description: 'Keep decisions, exceptions, and next actions connected.' },
      ],
    },
    invitation: {
      eyebrow: 'Build a clearer operation',
      title: 'Give every team one connected way to plan, care, and prove.',
      description: 'Open the company workspace or request a focused walkthrough of the workflows that matter most to your operation.',
    },
  },
  {
    id: 'crew',
    label: 'Crew lead',
    eyebrow: 'A better day in the field',
    headline: 'Know the next stop—and what done looks like.',
    description: 'Give crews the route, service details, and evidence requirements they need without the office back-and-forth.',
    perspective: {
      eyebrow: 'Built for the field',
      title: 'Give crews the context to finish each stop well.',
      description: 'Keep the route, access notes, service expectations, progress, required proof, and exception path close to the work.',
    },
    outcomes: [
      { title: 'Start field-ready', description: 'Every stop includes the service and property details crews need.' },
      { title: 'Keep working offline', description: 'Progress and evidence wait safely when coverage disappears.' },
      { title: 'Finish with a clean handoff', description: 'Photos, notes, and exceptions reach the office together.' },
    ],
    journey: [
      {
        id: 'plan', label: 'Route', status: 'Offline ready', kicker: 'North crew · Today',
        title: '8 ordered stops',
        description: 'The route, service details, and access notes are ready before leaving the yard.',
        progress: 33, progressLabel: 'Today’s route is ready',
        metaOne: '8 stops downloaded', metaTwo: 'Access notes included',
      },
      {
        id: 'care', label: 'Work', status: 'In progress', kicker: 'Stop 3 of 8',
        title: 'Oak Street residence',
        description: 'Four of six tasks are complete. Required property context is available offline.',
        progress: 67, progressLabel: 'Four of six tasks complete',
        metaOne: 'Details offline-ready', metaTwo: '2 tasks remain',
      },
      {
        id: 'prove', label: 'Handoff', status: 'Complete', kicker: 'Route closeout',
        title: '8 stops ready to hand off',
        description: 'Completed tasks, photos, notes, and exceptions return to the office together.',
        progress: 100, progressLabel: 'Route handoff complete',
        metaOne: '22 photos attached', metaTwo: 'Final sync complete',
      },
    ],
    trust: {
      heading: 'Everything the field needs to move',
      items: ['Route and stop context', 'Clear completion expectations', 'Offline-safe progress', 'One clean office handoff'],
    },
    proof: {
      eyebrow: 'A field-ready workday',
      title: 'The next stop should already make sense.',
      description: `${PRODUCT_NAME} puts the route, property context, required work, evidence, and exception path together so crews can focus on the yard instead of reconstructing the plan.`,
      cards: [
        { title: 'Start with the route', description: 'See the ordered day and the context behind each stop.', label: 'Clear direction' },
        { title: 'Know what done means', description: 'Keep service details and required evidence close to the work.', label: 'Completion clarity' },
        { title: 'Work beyond the signal', description: 'Queue progress safely when mobile coverage disappears.', label: 'Field resilience' },
        { title: 'Hand off once', description: 'Send photos, notes, progress, and exceptions back together.', label: 'Clean closeout' },
      ],
    },
    product: {
      eyebrow: 'Built for the field',
      title: 'Less office back-and-forth. More time caring for properties.',
      description: 'A focused mobile workday keeps the next stop, service expectations, progress, and proof available without exposing office-only complexity.',
      capabilities: [
        { title: 'Route-first day', description: 'Keep stops ordered and easy to scan.' },
        { title: 'Property context', description: 'Bring access and service details along.' },
        { title: 'Offline progress', description: 'Capture work safely when coverage drops.' },
        { title: 'Complete handoff', description: 'Return evidence and exceptions together.' },
      ],
    },
    invitation: {
      eyebrow: 'Make the field day clearer',
      title: 'Give crews the plan before they reach the property.',
      description: `Request a field-workflow demo and see how ${PRODUCT_NAME} keeps routes, progress, and proof connected.`,
    },
  },
];

const marketingPersonaNavigationOrder: MarketingPersonaId[] = [
  'company',
  'crew',
  'owner',
  'property-manager',
];

const marketingPersonasForNavigation = marketingPersonaNavigationOrder.map((id) => {
  const persona = marketingPersonas.find((candidate) => candidate.id === id);
  if (!persona) throw new Error(`Missing marketing persona: ${id}`);
  return persona;
});

function marketingPersonaFor(id: MarketingPersonaId): MarketingPersona {
  if (id === 'owner') return 'yard_owner';
  if (id === 'property-manager') return 'property_manager';
  if (id === 'crew') return 'crew_lead';
  return 'landscaping_company';
}

function marketingTitleFor(id: MarketingPersonaId): string {
  if (id === 'owner') return productPageTitle('Clearer yard care for homeowners');
  if (id === 'property-manager') return productPageTitle('Landscaping oversight for property managers');
  if (id === 'crew') return productPageTitle('Field workflow for landscaping crews');
  return productPageTitle('Landscaping operations software');
}

export function PublicLandingPage({
  initialPersonaId = 'owner',
}: {
  initialPersonaId?: MarketingPersonaId;
}) {
  const [activePersonaId, setActivePersonaId] = useState<MarketingPersonaId>(initialPersonaId);
  const [activeHeroStepId, setActiveHeroStepId] = useState<'plan' | 'care' | 'prove'>('plan');
  const [leadDialogPersona, setLeadDialogPersona] = useState<MarketingPersona | null>(null);
  const entryPersona = marketingPersonas.find((persona) => persona.id === initialPersonaId)
    ?? marketingPersonas[0];
  const activePersona = marketingPersonas.find((persona) => persona.id === activePersonaId)
    ?? marketingPersonas[0];
  const entryMarketingPersona = marketingPersonaFor(entryPersona.id);
  const entryCallToAction = marketingCallToAction(entryMarketingPersona);
  const activeMarketingPersona = marketingPersonaFor(activePersona.id);
  const activeCallToAction = marketingCallToAction(activeMarketingPersona);
  const activeHeroPreview = entryPersona.journey.find((step) => step.id === activeHeroStepId)
    ?? entryPersona.journey[0];
  const providerEntryPath = providerEntryHref(
    typeof window === 'undefined' ? '' : window.location.search,
  );

  useEffect(() => {
    const title = marketingTitleFor(entryPersona.id);
    const description = entryPersona.description;
    const canonicalUrl = new URL(
      marketingCanonicalPath(window.location.pathname, entryPersona.id),
      window.location.origin,
    )
      .toString();
    const shareImageUrl = new URL('/brand/yardfolio-landscape-home-hero.webp', window.location.origin)
      .toString();
    document.title = title;
    setMetadata('description', description);
    setMetadata('og:title', title, 'property');
    setMetadata('og:description', description, 'property');
    setMetadata('og:type', 'website', 'property');
    setMetadata('og:url', canonicalUrl, 'property');
    setMetadata('og:image', shareImageUrl, 'property');
    setMetadata('og:image:width', '1440', 'property');
    setMetadata('og:image:height', '688', 'property');
    setMetadata('og:image:alt', 'Landscape care team working in a Southwestern garden at sunrise', 'property');
    setMetadata('twitter:card', 'summary_large_image');
    setMetadata('twitter:title', title);
    setMetadata('twitter:description', description);
    setMetadata('twitter:image', shareImageUrl);
    setCanonicalUrl(canonicalUrl);
  }, [entryPersona]);

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
  }

  function movePersonaTab(
    event: KeyboardEvent<HTMLButtonElement>,
    currentIndex: number,
  ) {
    let nextIndex: number | null = null;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextIndex = (currentIndex + 1) % marketingPersonasForNavigation.length;
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      nextIndex = (currentIndex - 1 + marketingPersonasForNavigation.length)
        % marketingPersonasForNavigation.length;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = marketingPersonasForNavigation.length - 1;
    }
    if (nextIndex === null) return;

    event.preventDefault();
    const nextPersona = marketingPersonasForNavigation[nextIndex];
    selectPersona(nextPersona.id, 'audience_review_tabs_keyboard');
    const tabs = event.currentTarget.parentElement
      ?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    tabs?.[nextIndex]?.focus();
  }

  return (
    <>
      <a
        className="sr-only fixed left-4 top-4 z-50 rounded-lg bg-white px-4 py-3 font-black text-emerald-900 shadow-xl focus:not-sr-only"
        href="#main-content"
      >
        Skip to main content
      </a>
      <header className="sticky inset-x-0 top-0 z-30 border-b border-slate-200 bg-paper/95 backdrop-blur-xl">
        <nav className="mx-auto flex min-h-20 max-w-[86rem] items-center justify-between px-4 sm:px-6 lg:px-8" aria-label="Main navigation">
          <a aria-label={`${PRODUCT_NAME} home`} className="text-emerald-800" href="/">
            <ProductBrand />
          </a>
          <div className="hidden items-center gap-7 text-sm font-bold text-slate-600 md:flex">
            <a className="min-h-11 content-center underline-offset-4 transition hover:text-emerald-800 hover:underline" href="#tour">How it works</a>
            <a className="min-h-11 content-center underline-offset-4 transition hover:text-emerald-800 hover:underline" href="#who-its-for">Who it helps</a>
            <a className="min-h-11 content-center underline-offset-4 transition hover:text-emerald-800 hover:underline" href="#proof">Why {PRODUCT_NAME}</a>
          </div>
          <a className="yardfolio-button-primary px-4 sm:px-5" href="/app">
            Sign in
          </a>
        </nav>
      </header>

      <main className="min-h-screen overflow-x-hidden bg-bone text-ink" id="main-content">
      <section className="bg-bone" data-testid="marketing-hero">
        <div className="mx-auto grid max-w-[86rem] gap-8 px-4 py-10 sm:px-6 sm:py-12 lg:grid-cols-[minmax(0,0.92fr)_minmax(30rem,1.08fr)] lg:items-center lg:gap-12 lg:px-8 lg:py-8">
          <div className="min-w-0 lg:py-2">
            <p className="yardfolio-eyebrow flex items-center gap-3 before:h-px before:w-7 before:bg-emerald-700">
              {entryPersona.eyebrow}
            </p>
            <h1 className="yardfolio-display mt-4 max-w-[12ch] text-[clamp(3rem,5.5vw,5rem)] leading-[0.96]">
              {entryPersona.headline}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600 lg:text-[1.05rem] lg:leading-7 xl:text-lg xl:leading-8">
              {entryPersona.description}
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap" aria-label="Hero next steps">
              {entryPersona.id === 'owner' ? (
                <a className="yardfolio-button-primary" href={OWNER_ACQUISITION_PATH} onClick={() => trackMarketingEvent('cta_clicked', 'yard_owner', 'hero_yard_signup')}>
                  Create my private yard <span className="ml-2" aria-hidden="true">→</span>
                </a>
              ) : entryPersona.id === 'company' ? (
                <a className="yardfolio-button-primary" href={providerEntryPath} onClick={() => trackMarketingEvent('cta_clicked', 'landscaping_company', 'hero_company_signup')}>
                  Start company setup <span className="ml-2" aria-hidden="true">→</span>
                </a>
              ) : (
                <button className="yardfolio-button-primary" onClick={() => openLeadDialog(entryMarketingPersona, 'hero_conversation')} type="button">
                  {entryCallToAction.label} <span className="ml-2" aria-hidden="true">→</span>
                </button>
              )}
              <a className="yardfolio-button-secondary" href="#tour" onClick={() => trackMarketingEvent('cta_clicked', entryMarketingPersona, 'hero_product_tour')}>See how it works</a>
            </div>
          </div>

          <div className="relative h-[28rem] overflow-hidden rounded-[2rem] bg-forest shadow-yardfolio-lg sm:h-[29rem] lg:h-[calc(100svh-9rem)] lg:min-h-[28rem] lg:max-h-[33rem]" data-testid="hero-visual">
            <img alt="Landscape care team working in a Southwestern garden at sunrise" className="absolute inset-0 h-full w-full object-cover object-[68%_center]" decoding="async" {...{ fetchpriority: 'high' }} height="688" src="/brand/yardfolio-landscape-home-hero.webp" width="1440" />
            <span className="absolute inset-0 bg-gradient-to-t from-forest/45 via-forest/5 to-transparent" />
            <article className="absolute bottom-4 left-4 right-4 rounded-[1.35rem] border border-white/60 bg-paper/95 p-4 text-ink shadow-yardfolio-lg backdrop-blur sm:bottom-7 sm:left-auto sm:right-7 sm:w-[min(29rem,calc(100%-3.5rem))] sm:p-6" data-testid="hero-entry-preview">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[0.62rem] font-black uppercase tracking-[0.14em] text-slate-600">Sample {entryPersona.label.toLowerCase()} workspace</p>
                <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-[0.65rem] font-black uppercase tracking-wide text-emerald-800">{activeHeroPreview.status}</span>
              </div>
              <div aria-label="Sample service journey" className="mt-4 grid grid-cols-3 gap-1 rounded-xl bg-emerald-50 p-1">
                {entryPersona.journey.map((step) => (
                  <button
                    aria-pressed={step.id === activeHeroPreview.id}
                    className={`min-h-10 rounded-lg px-2 py-2 text-[0.68rem] font-black transition ${step.id === activeHeroPreview.id ? 'bg-emerald-800 text-white shadow-sm' : 'text-emerald-800 hover:bg-emerald-100'}`}
                    key={step.id}
                    onClick={() => {
                      setActiveHeroStepId(step.id);
                      trackMarketingEvent('tour_step_selected', entryMarketingPersona, `hero_${step.id}`);
                    }}
                    type="button"
                  >
                    {step.label}
                  </button>
                ))}
              </div>
              <div aria-live="polite">
                <p className="mt-4 text-[0.7rem] font-black uppercase tracking-[0.1em] text-emerald-700">{activeHeroPreview.kicker}</p>
                <h2 className="mt-1 text-xl font-black leading-tight text-ink sm:text-2xl">{activeHeroPreview.title}</h2>
                <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-600 sm:text-sm sm:leading-6">{activeHeroPreview.description}</p>
              </div>
              <div aria-label={activeHeroPreview.progressLabel} className="mt-4 h-2 overflow-hidden rounded-full bg-emerald-100" role="progressbar" aria-valuemax={100} aria-valuemin={0} aria-valuenow={activeHeroPreview.progress}>
                <span className="block h-full rounded-full bg-emerald-700 transition-[width]" style={{ width: `${activeHeroPreview.progress}%` }} />
              </div>
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[0.7rem] font-bold text-slate-600 sm:text-xs">
                <span className="flex items-center gap-2 before:h-2 before:w-2 before:rounded-full before:bg-emerald-700">{activeHeroPreview.metaOne}</span>
                <span className="flex items-center gap-2 before:h-2 before:w-2 before:rounded-full before:bg-[#c99f55]">{activeHeroPreview.metaTwo}</span>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="bg-paper px-4 py-16 sm:px-6 sm:py-20 lg:px-8" id="who-its-for">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(28rem,0.9fr)] lg:items-end">
            <div className="max-w-3xl">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">One service story · four focused views</p>
              <h2 className="yardfolio-display mt-4 text-4xl leading-tight sm:text-5xl">See {PRODUCT_NAME} from every side of the work.</h2>
              <p className="mt-4 text-lg leading-8 text-slate-600">Choose a perspective to review the information, outcomes, and next step designed for that role. Your original page and primary invitation stay unchanged.</p>
            </div>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.1em] text-slate-600">Choose a perspective</p>
              <div aria-label="Choose your perspective" aria-orientation="horizontal" className="mt-3 flex flex-wrap gap-2" role="tablist">
                {marketingPersonasForNavigation.map((persona, index) => (
                  <button
                    aria-controls="persona-review-panel"
                    aria-selected={persona.id === activePersona.id}
                    className={`min-h-11 rounded-full border px-3.5 py-2 text-xs font-extrabold transition ${persona.id === activePersona.id ? 'border-emerald-800 bg-emerald-800 text-white shadow-yardfolio-sm' : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-700 hover:text-emerald-800'}`}
                    id={`persona-review-tab-${persona.id}`}
                    key={persona.id}
                    onClick={() => selectPersona(persona.id, 'audience_review_tabs')}
                    onKeyDown={(event) => movePersonaTab(event, index)}
                    role="tab"
                    tabIndex={persona.id === activePersona.id ? 0 : -1}
                    type="button"
                  >
                    {persona.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <p aria-live="polite" className="sr-only">Showing {PRODUCT_NAME} for {activePersona.label}</p>
          <article aria-labelledby={`persona-review-tab-${activePersona.id}`} className="mt-8 grid overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-xl lg:grid-cols-[0.9fr_1.1fr]" data-testid="persona-review-panel" id="persona-review-panel" role="tabpanel">
            <div className="p-7 sm:p-10">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">{activePersona.perspective.eyebrow}</p>
              <h3 className="mt-4 font-display text-4xl font-bold leading-tight tracking-tight">{activePersona.perspective.title}</h3>
              <p className="mt-4 text-base leading-7 text-slate-300">{activePersona.perspective.description}</p>
              {activePersona.id === 'company' ? (
                <a
                  className="mt-7 inline-flex min-h-12 items-center rounded-full bg-emerald-400 px-5 py-3 font-black text-emerald-950 transition hover:bg-emerald-300"
                  href={providerEntryPath}
                  onClick={() => trackMarketingEvent('cta_clicked', 'landscaping_company', 'persona_company_signup')}
                >
                  Start company setup <span className="ml-1" aria-hidden="true">→</span>
                </a>
              ) : activePersona.id === 'owner' ? (
                <a
                  className="mt-7 inline-flex min-h-12 items-center rounded-full bg-emerald-400 px-5 py-3 font-black text-emerald-950 transition hover:bg-emerald-300"
                  href={OWNER_ACQUISITION_PATH}
                  onClick={() => trackMarketingEvent('cta_clicked', 'yard_owner', 'persona_private_setup')}
                >
                  Create my private yard <span className="ml-1" aria-hidden="true">→</span>
                </a>
              ) : (
                <button
                  className="mt-7 rounded-full bg-emerald-400 px-5 py-3 font-black text-emerald-950 transition hover:bg-emerald-300"
                  onClick={() => openLeadDialog(activeMarketingPersona, 'persona_panel')}
                  type="button"
                >
                  {activeCallToAction.label} <span className="ml-1" aria-hidden="true">→</span>
                </button>
              )}
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

      <section aria-labelledby="trust-heading" className="grid gap-5 bg-emerald-800 px-4 py-6 text-white sm:px-6 lg:grid-cols-[minmax(13rem,0.8fr)_minmax(0,3.2fr)] lg:items-center lg:px-[max(2rem,calc((100vw-86rem)/2+2rem))]">
        <h2 className="text-xs font-black uppercase tracking-[0.14em] text-sand" id="trust-heading">{activePersona.trust.heading}</h2>
        <ul className="grid gap-3 text-sm font-bold text-emerald-50 sm:grid-cols-2 lg:grid-cols-4">
          {activePersona.trust.items.map((item) => (
            <li className="flex items-center gap-2 before:text-sand before:content-['✓']" key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <MarketingProductTour persona={activePersona.id} />

      <section className="bg-paper px-4 py-20 sm:px-6 lg:px-8" id="proof">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">{activePersona.proof.eyebrow}</p>
              <h2 className="yardfolio-display mt-4 text-4xl leading-tight sm:text-5xl">
                {activePersona.proof.title}
              </h2>
            </div>
            <p className="max-w-2xl text-lg leading-8 text-slate-600">
              {activePersona.proof.description}
            </p>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {activePersona.proof.cards.map(({ title, description, label }) => (
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
            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-300">{activePersona.product.eyebrow}</p>
            <h2 className="mt-4 font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl">{activePersona.product.title}</h2>
            <p className="mt-5 max-w-xl text-lg leading-8 text-emerald-50/80">
              {activePersona.product.description}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {activePersona.product.capabilities.map(({ title, description }) => (
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
          <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-300">{activePersona.invitation.eyebrow}</p>
          <h2 className="mt-5 font-display text-4xl font-bold leading-tight tracking-tight sm:text-6xl">{activePersona.invitation.title}</h2>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-slate-300">{activePersona.invitation.description}</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            {activePersona.id === 'company' ? (
              <a className="inline-flex min-h-12 items-center justify-center rounded-full bg-emerald-400 px-7 py-3 font-black text-emerald-950 transition hover:bg-emerald-300" href={providerEntryPath} onClick={() => trackMarketingEvent('cta_clicked', 'landscaping_company', 'final_company_signup')}>
                Start company setup <span className="ml-2" aria-hidden="true">→</span>
              </a>
            ) : activePersona.id === 'owner' ? (
              <a className="inline-flex min-h-12 items-center justify-center rounded-full bg-emerald-400 px-7 py-3 font-black text-emerald-950 transition hover:bg-emerald-300" href={OWNER_ACQUISITION_PATH} onClick={() => trackMarketingEvent('cta_clicked', 'yard_owner', 'final_yard_signup')}>
                Create my private yard <span className="ml-2" aria-hidden="true">→</span>
              </a>
            ) : (
              <button className="inline-flex min-h-12 items-center justify-center rounded-full bg-emerald-400 px-7 py-3 font-black text-emerald-950 transition hover:bg-emerald-300" onClick={() => openLeadDialog(activeMarketingPersona, 'final_cta')} type="button">
                {activeCallToAction.label} <span className="ml-2" aria-hidden="true">→</span>
              </button>
            )}
            {activePersona.id === 'company' ? (
              <button className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/20 px-7 py-3 font-black text-white transition hover:bg-white/10" onClick={() => openLeadDialog('landscaping_company', 'final_walkthrough')} type="button">
                Request a walkthrough
              </button>
            ) : null}
            <a className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/20 px-7 py-3 font-black text-white transition hover:bg-white/10" href="/app">
              Existing user sign in
            </a>
          </div>
        </div>
      </section>
      </main>

      <footer className="border-t border-slate-800 bg-slate-950 px-4 py-8 text-slate-400 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <ProductBrand className="text-white" />
          <p>Plan the work. Care for the property. Prove the difference.</p>
        </div>
      </footer>
      {leadDialogPersona ? (
        <MarketingLeadDialog
          initialPersona={leadDialogPersona}
          onClose={() => setLeadDialogPersona(null)}
        />
      ) : null}
    </>
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
