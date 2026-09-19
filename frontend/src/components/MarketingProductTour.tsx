import { useState } from 'react';
import type { MarketingPersonaId } from '../domain/marketingRoute';
import { trackMarketingEvent } from '../api/marketingAnalyticsClient';
import type { MarketingPersona } from '../api/marketingLeadsClient';
import { MarketingOperationsPlanner } from './MarketingOperationsPlanner';

type TourStepId = 'plan' | 'care' | 'prove';
type PreviewTone = 'amber' | 'emerald' | 'sky';

type TourPreviewContent = {
  eyebrow: string;
  title: string;
  detail: string;
  status: string;
  tone: PreviewTone;
  items: Array<{ label: string; value: string; detail: string }>;
  notice: string;
};

type TourStepContent = {
  id: TourStepId;
  label: string;
  title: string;
  description: string;
  outcome: string;
  preview?: TourPreviewContent;
};

type PersonaTourContent = {
  eyebrow: string;
  title: string;
  description: string;
  steps: TourStepContent[];
};

const tourContentByPersona: Record<MarketingPersonaId, PersonaTourContent> = {
  owner: {
    eyebrow: 'Your yard care, clearly explained',
    title: 'Follow your yard from upcoming care to completed proof.',
    description: 'See the service experience from your side: what is coming, what is happening, and what changed after the visit.',
    steps: [
      {
        id: 'plan',
        label: '01 · Upcoming',
        title: 'Know what is planned before the visit.',
        description: 'The service window, approved yard details, and planned care stay together without exposing provider-only operations.',
        outcome: 'You know when care is coming and what the visit includes.',
        preview: {
          eyebrow: 'Next visit',
          title: 'Tuesday · 8:00–10:00 AM',
          detail: 'Oak Street yard · Weekly landscape care',
          status: 'Confirmed',
          tone: 'emerald',
          items: [
            { label: 'Visit plan', value: 'Mow, edge + inspect', detail: 'Irrigation check included' },
            { label: 'Property note', value: 'Side gate access', detail: 'Saved for this provider' },
            { label: 'Your control', value: 'Approved details only', detail: 'Private notes stay private' },
          ],
          notice: 'We’ll let you know when service starts.',
        },
      },
      {
        id: 'care',
        label: '02 · In progress',
        title: 'See progress without chasing an update.',
        description: 'A simple service status shows what is underway while crew coordination remains with the provider.',
        outcome: 'You can follow the visit without interrupting the people caring for your yard.',
        preview: {
          eyebrow: 'Today’s service',
          title: 'Care is underway',
          detail: 'Started at 8:17 AM · Oak Street yard',
          status: 'In progress',
          tone: 'amber',
          items: [
            { label: 'Front yard', value: 'Complete', detail: 'Mow and edge finished' },
            { label: 'Irrigation', value: 'Being checked', detail: 'One zone remains' },
            { label: 'Your update', value: 'After the visit', detail: 'Photos arrive with completion' },
          ],
          notice: 'No action is needed while the scheduled visit is in progress.',
        },
      },
      {
        id: 'prove',
        label: '03 · Review',
        title: 'Understand what changed and what comes next.',
        description: 'Completed work, photo evidence, and any recommendation arrive as one clear service record.',
        outcome: 'You receive proof of the care and keep control of every next decision.',
        preview: {
          eyebrow: 'Latest visit',
          title: 'Your care summary is ready',
          detail: 'Completed Tuesday at 9:36 AM',
          status: 'Report ready',
          tone: 'emerald',
          items: [
            { label: 'Completed care', value: '3 items', detail: 'Mow, edge, irrigation check' },
            { label: 'Visit evidence', value: '4 photos', detail: 'Before and completed result' },
            { label: 'Recommendation', value: '1 to review', detail: 'You decide what happens next' },
          ],
          notice: 'Review the recommendation before approving, declining, or requesting a change.',
        },
      },
    ],
  },
  'property-manager': {
    eyebrow: 'Portfolio care in context',
    title: 'Move from portfolio readiness to owner-ready reporting.',
    description: 'See how Grover helps you prioritize addresses, monitor exceptions, and retain evidence for every property you represent.',
    steps: [
      {
        id: 'plan',
        label: '01 · Prioritize',
        title: 'See which properties need attention first.',
        description: 'Upcoming commitments and readiness gaps roll into one portfolio view without losing address-level context.',
        outcome: 'You can coordinate service expectations across every property.',
        preview: {
          eyebrow: 'Portfolio readiness',
          title: '14 of 16 properties ready',
          detail: 'Phoenix portfolio · Tuesday service window',
          status: '2 need review',
          tone: 'amber',
          items: [
            { label: 'Ready', value: '14 properties', detail: 'Service details confirmed' },
            { label: 'Access review', value: '1 property', detail: 'Gate instructions missing' },
            { label: 'Vendor reply', value: '1 property', detail: 'Window confirmation due' },
          ],
          notice: 'Each open readiness item has a property, owner, and due date.',
        },
      },
      {
        id: 'care',
        label: '02 · Monitor',
        title: 'Watch progress and exceptions across addresses.',
        description: 'Portfolio status highlights where service is on track and where accountable follow-through is needed.',
        outcome: 'You can act on exceptions without rebuilding status from vendor messages.',
        preview: {
          eyebrow: 'Service-day progress',
          title: '12 properties complete',
          detail: '16 scheduled · Updated 10 minutes ago',
          status: '2 exceptions',
          tone: 'amber',
          items: [
            { label: 'Complete', value: '12 properties', detail: 'Evidence received' },
            { label: 'In progress', value: '2 properties', detail: 'Within service window' },
            { label: 'Need attention', value: '2 properties', detail: 'Owners and next steps set' },
          ],
          notice: 'Open exceptions stay tied to the correct address and responsible provider.',
        },
      },
      {
        id: 'prove',
        label: '03 · Report',
        title: 'Prepare a clear update for every stakeholder.',
        description: 'Property-level proof and decisions become a portfolio story you can review and share with confidence.',
        outcome: 'You can report service outcomes without mixing evidence between properties.',
        preview: {
          eyebrow: 'Weekly portfolio update',
          title: 'Owner-ready summary prepared',
          detail: '16 properties · Week ending September 4',
          status: 'Ready to review',
          tone: 'emerald',
          items: [
            { label: 'Service records', value: '16 included', detail: 'Kept with each address' },
            { label: 'Open decisions', value: '2 recommendations', detail: 'Context and totals attached' },
            { label: 'Exceptions', value: '2 resolved', detail: 'Follow-through retained' },
          ],
          notice: 'Review the summary before sharing it with owners or stakeholders.',
        },
      },
    ],
  },
  company: {
    eyebrow: 'Your operation, end to end',
    title: 'Follow one workday from plan to completed revenue.',
    description: 'Explore the connected operating workflow for owners, managers, dispatchers, field teams, and billing staff.',
    steps: [
      {
        id: 'plan',
        label: '01 · Plan',
        title: 'Shape a day the whole team can understand.',
        description: 'Build the route, see workload risk, and publish the right property context before crews roll.',
        outcome: 'Balance routes, crews, commitments, and operational risk.',
      },
      {
        id: 'care',
        label: '02 · Care',
        title: 'Keep field execution aligned with the plan.',
        description: 'Crew-ready stops, service details, progress, and offline capture reduce office back-and-forth.',
        outcome: 'Keep field execution aligned even when connectivity drops.',
        preview: {
          eyebrow: 'Stop 3 of 8',
          title: 'Desert Willow Commons',
          detail: 'Weekly landscape service · Gate code ready',
          status: 'In progress',
          tone: 'amber',
          items: [
            { label: 'Completed', value: 'Mow + edge', detail: 'Progress synced' },
            { label: 'Current task', value: 'Irrigation check', detail: 'Service details available' },
            { label: 'Required next', value: 'Completion photos', detail: 'Queued safely offline' },
          ],
          notice: 'Offline changes are queued safely until the device reconnects.',
        },
      },
      {
        id: 'prove',
        label: '03 · Prove',
        title: 'Turn completed work into customer confidence.',
        description: 'Review photos and notes, create completion reports, and keep recommendations moving toward approval.',
        outcome: 'Move verified work toward customer communication, approval, and billing.',
        preview: {
          eyebrow: 'Completion review',
          title: 'Service story ready',
          detail: 'Desert Willow Commons · Visit complete',
          status: 'Evidence complete',
          tone: 'emerald',
          items: [
            { label: 'Arrival condition', value: '2 photos', detail: 'Linked to the visit' },
            { label: 'Completed result', value: '3 photos', detail: 'Checklist verified' },
            { label: 'Revenue handoff', value: 'Ready', detail: 'Recommendation captured' },
          ],
          notice: 'The customer update and billing handoff share the verified service record.',
        },
      },
    ],
  },
  crew: {
    eyebrow: 'Your field day, clearly ordered',
    title: 'Move from the first route stop to one clean handoff.',
    description: 'See only the route, property context, work, and proof needed to complete the day safely and clearly.',
    steps: [
      {
        id: 'plan',
        label: '01 · Route',
        title: 'Start with an ordered, field-ready route.',
        description: 'Stops, service expectations, access details, and offline readiness are available before leaving the yard.',
        outcome: 'You start with a route and property details that make sense.',
        preview: {
          eyebrow: 'North crew · Today',
          title: '8 ordered stops',
          detail: 'First stop at 7:30 AM · 42 planned miles',
          status: 'Offline ready',
          tone: 'sky',
          items: [
            { label: 'Next stop', value: 'Oak Street yard', detail: '12 minutes away' },
            { label: 'Service details', value: '8 downloaded', detail: 'Access notes included' },
            { label: 'Required proof', value: 'Clear', detail: 'Photo needs by stop' },
          ],
          notice: 'The route and property details remain available when coverage drops.',
        },
      },
      {
        id: 'care',
        label: '02 · Work',
        title: 'Know what done looks like at each stop.',
        description: 'A focused stop view keeps tasks, property notes, progress, photos, and the exception path close to the work.',
        outcome: 'You can capture progress, photos, and exceptions directly from the job.',
        preview: {
          eyebrow: 'Stop 3 of 8',
          title: 'Oak Street yard',
          detail: 'Weekly care · Side gate access',
          status: 'In progress',
          tone: 'amber',
          items: [
            { label: 'Complete', value: '4 of 6 tasks', detail: 'Saved on this device' },
            { label: 'Current task', value: 'Irrigation check', detail: 'Zone notes available' },
            { label: 'Still needed', value: '2 photos', detail: 'Required before closeout' },
          ],
          notice: 'Report an exception here if the planned work cannot be completed safely.',
        },
      },
      {
        id: 'prove',
        label: '03 · Handoff',
        title: 'Finish once and send a complete handoff.',
        description: 'Completed tasks, photos, notes, and exceptions return to the office together instead of through separate messages.',
        outcome: 'You hand off clean work without rebuilding the story at the end of the day.',
        preview: {
          eyebrow: 'Route closeout',
          title: '8 stops ready to hand off',
          detail: 'North crew · Final sync complete',
          status: 'Complete',
          tone: 'emerald',
          items: [
            { label: 'Tasks', value: '47 completed', detail: 'All stops accounted for' },
            { label: 'Evidence', value: '22 photos', detail: 'Matched to each property' },
            { label: 'Exceptions', value: '1 submitted', detail: 'Office follow-up requested' },
          ],
          notice: 'The office receives one complete route record with no duplicate entry.',
        },
      },
    ],
  },
};

export function MarketingProductTour({ persona }: { persona: MarketingPersonaId }) {
  const [activeStepId, setActiveStepId] = useState<TourStepId>('plan');
  const content = tourContentByPersona[persona];
  const activeIndex = content.steps.findIndex((step) => step.id === activeStepId);
  const activeStep = content.steps[activeIndex];
  const analyticsPersona = marketingPersonaForTour(persona);

  return (
    <section className="bg-slate-950 px-4 py-20 text-white sm:px-6 lg:px-8" id="tour">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-300">{content.eyebrow}</p>
          <h2 className="mt-4 font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl">{content.title}</h2>
          <p className="mt-5 text-lg leading-8 text-slate-300">{content.description}</p>
        </div>

        <div className="mt-10 grid overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 lg:grid-cols-[0.72fr_1.28fr]">
          <div className="border-b border-white/10 p-4 lg:border-b-0 lg:border-r sm:p-6">
            <div aria-label="Product tour steps" className="grid gap-2" role="tablist">
              {content.steps.map((step) => (
                <button
                  aria-selected={step.id === activeStepId}
                  className={`rounded-2xl p-4 text-left transition sm:p-5 ${step.id === activeStepId ? 'bg-emerald-400 text-emerald-950' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}
                  key={step.id}
                  onClick={() => {
                    setActiveStepId(step.id);
                    trackMarketingEvent('tour_step_selected', analyticsPersona, step.id);
                  }}
                  role="tab"
                  type="button"
                >
                  <span className="text-xs font-black uppercase tracking-[0.16em]">{step.label}</span>
                  <span className="mt-2 block text-lg font-black leading-tight">{step.title}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="p-5 sm:p-8 lg:p-10" role="tabpanel">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">{content.eyebrow}</p>
                <h3 className="mt-2 text-2xl font-black">{activeStep.title}</h3>
              </div>
              <span className="whitespace-nowrap rounded-full border border-white/15 px-3 py-1 text-xs font-black text-slate-300">
                {activeIndex + 1} / {content.steps.length}
              </span>
            </div>

            <div className="mt-7" data-testid={`product-tour-${persona}-${activeStepId}-preview`}>
              {persona === 'company' && activeStepId === 'plan' ? (
                <MarketingOperationsPlanner placement="tour" />
              ) : activeStep.preview ? (
                <PersonaTourPreview content={activeStep.preview} />
              ) : null}
            </div>

            <p className="mt-6 text-base leading-7 text-slate-300">{activeStep.description}</p>
            <div className="mt-5 rounded-2xl border border-emerald-400/25 bg-emerald-400/10 p-4">
              <p className="text-xs font-black uppercase tracking-[0.15em] text-emerald-300">What this means for you</p>
              <p className="mt-2 font-bold leading-6 text-emerald-50">{activeStep.outcome}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PersonaTourPreview({ content }: { content: TourPreviewContent }) {
  const statusTone = content.tone === 'amber'
    ? 'bg-amber-100 text-amber-900'
    : content.tone === 'sky'
      ? 'bg-sky-100 text-sky-900'
      : 'bg-emerald-100 text-emerald-900';

  return (
    <article className="rounded-2xl bg-bone p-4 text-slate-950 shadow-grover-md sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">{content.eyebrow}</p>
          <h4 className="mt-2 text-xl font-black sm:text-2xl">{content.title}</h4>
          <p className="mt-1 text-sm leading-6 text-slate-600">{content.detail}</p>
        </div>
        <span className={`rounded-full px-3 py-1.5 text-xs font-black ${statusTone}`}>{content.status}</span>
      </div>
      <dl className="mt-5 grid gap-2 sm:grid-cols-3">
        {content.items.map((item) => (
          <div className="rounded-xl border border-slate-200 bg-white p-3" key={item.label}>
            <dt className="text-[0.65rem] font-black uppercase tracking-[0.12em] text-slate-500">{item.label}</dt>
            <dd className="mt-2 text-sm font-black text-slate-950">{item.value}</dd>
            <dd className="mt-1 text-xs leading-4 text-slate-600">{item.detail}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 rounded-xl bg-emerald-950 px-4 py-3 text-sm font-bold leading-5 text-emerald-50">{content.notice}</p>
    </article>
  );
}

function marketingPersonaForTour(persona: MarketingPersonaId): MarketingPersona {
  if (persona === 'owner') return 'yard_owner';
  if (persona === 'property-manager') return 'property_manager';
  if (persona === 'crew') return 'crew_lead';
  return 'landscaping_company';
}
