import { useState } from 'react';
import type { MarketingPersonaId } from '../domain/marketingRoute';
import { trackMarketingEvent } from '../api/marketingAnalyticsClient';
import type { MarketingPersona } from '../api/marketingLeadsClient';

type TourStepId = 'plan' | 'care' | 'prove';

const tourSteps: Array<{
  id: TourStepId;
  label: string;
  title: string;
  description: string;
}> = [
  {
    id: 'plan',
    label: '01 · Plan',
    title: 'Shape a day the whole team can understand.',
    description: 'Build the route, see workload risk, and publish the right property context before crews roll.',
  },
  {
    id: 'care',
    label: '02 · Care',
    title: 'Put the next best action in the field.',
    description: 'Crew-ready stops, service details, progress, and offline capture reduce office back-and-forth.',
  },
  {
    id: 'prove',
    label: '03 · Prove',
    title: 'Turn completed work into customer confidence.',
    description: 'Review photos and notes, create completion reports, and keep recommendations moving toward approval.',
  },
];

const tourOutcomeByPersona: Record<MarketingPersonaId, Record<TourStepId, string>> = {
  owner: {
    plan: 'Know when care is coming and what the visit includes.',
    care: 'See service progress without chasing a status update.',
    prove: 'Receive a clear record of the work and what may need attention next.',
  },
  'property-manager': {
    plan: 'Coordinate service expectations across every property.',
    care: 'See portfolio progress and exceptions while work is underway.',
    prove: 'Review property-ready evidence and recommendations in one place.',
  },
  company: {
    plan: 'Balance routes, crews, commitments, and operational risk.',
    care: 'Keep field execution aligned even when connectivity drops.',
    prove: 'Move verified work toward customer communication, approval, and billing.',
  },
  crew: {
    plan: 'Start with a route and property details that make sense.',
    care: 'Capture progress, photos, and exceptions from the job.',
    prove: 'Hand off clean work without rebuilding the story at the end of the day.',
  },
};

export function MarketingProductTour({ persona }: { persona: MarketingPersonaId }) {
  const [activeStepId, setActiveStepId] = useState<TourStepId>('plan');
  const activeIndex = tourSteps.findIndex((step) => step.id === activeStepId);
  const activeStep = tourSteps[activeIndex];
  const analyticsPersona = marketingPersonaForTour(persona);

  return (
    <section className="bg-slate-950 px-4 py-20 text-white sm:px-6 lg:px-8" id="tour">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-300">Take the product tour</p>
          <h2 className="mt-4 text-4xl font-black leading-tight tracking-tight sm:text-5xl">
            Follow one day from promise to proof.
          </h2>
          <p className="mt-5 text-lg leading-8 text-slate-300">
            Explore the connected workflow Grover is already built to support. Choose a step to see what the system makes visible.
          </p>
        </div>

        <div className="mt-10 grid overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 lg:grid-cols-[0.72fr_1.28fr]">
          <div className="border-b border-white/10 p-4 lg:border-b-0 lg:border-r sm:p-6">
            <div aria-label="Product tour steps" className="grid gap-2" role="tablist">
              {tourSteps.map((step) => (
                <button
                  aria-selected={step.id === activeStepId}
                  className={`rounded-2xl p-4 text-left transition sm:p-5 ${
                    step.id === activeStepId
                      ? 'bg-emerald-400 text-emerald-950'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
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
                <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">
                  Live workflow preview
                </p>
                <h3 className="mt-2 text-2xl font-black">{activeStep.title}</h3>
              </div>
              <span className="rounded-full border border-white/15 px-3 py-1 text-xs font-black text-slate-300">
                {activeIndex + 1} / {tourSteps.length}
              </span>
            </div>

            <div className="mt-7 rounded-[1.5rem] bg-[#f6f7f2] p-4 text-slate-950 shadow-2xl sm:p-6">
              <TourPreview step={activeStepId} />
            </div>

            <p className="mt-6 text-base leading-7 text-slate-300">{activeStep.description}</p>
            <div className="mt-5 rounded-2xl border border-emerald-400/25 bg-emerald-400/10 p-4">
              <p className="text-xs font-black uppercase tracking-[0.15em] text-emerald-300">What this means for you</p>
              <p className="mt-2 font-bold leading-6 text-emerald-50">
                {tourOutcomeByPersona[persona][activeStepId]}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function marketingPersonaForTour(persona: MarketingPersonaId): MarketingPersona {
  if (persona === 'owner') return 'yard_owner';
  if (persona === 'property-manager') return 'property_manager';
  if (persona === 'crew') return 'crew_lead';
  return 'landscaping_company';
}

function TourPreview({ step }: { step: TourStepId }) {
  if (step === 'care') {
    return (
      <>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">Stop 3 of 8</p>
            <p className="mt-2 text-xl font-black">Desert Willow Commons</p>
            <p className="mt-1 text-sm text-slate-500">Weekly landscape service · Gate code ready</p>
          </div>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800">In progress</span>
        </div>
        <div className="mt-5 grid gap-2 sm:grid-cols-3">
          {['Mow + edge ✓', 'Irrigation check', 'Completion photos'].map((item, index) => (
            <div className={`rounded-xl p-3 text-sm font-bold ${index === 0 ? 'bg-emerald-100 text-emerald-900' : 'bg-white text-slate-700'}`} key={item}>
              {item}
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-900 p-4 text-white">
          <span className="text-sm font-bold">Offline changes are queued safely</span>
          <span className="text-emerald-300">●</span>
        </div>
      </>
    );
  }

  if (step === 'prove') {
    return (
      <>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">Completion review</p>
            <p className="mt-2 text-xl font-black">Service story ready</p>
          </div>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800">Evidence complete</span>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          {['Arrival condition', 'Completed result'].map((label, index) => (
            <div className={`flex aspect-[4/3] items-end rounded-xl p-3 ${index === 0 ? 'bg-amber-100' : 'bg-emerald-100'}`} key={label}>
              <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-black">{label}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <div className="rounded-xl bg-white p-3 text-sm font-bold">Customer report ready</div>
          <div className="rounded-xl bg-white p-3 text-sm font-bold">Recommendation captured</div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">Monday route</p>
          <p className="mt-2 text-xl font-black">North Phoenix · Crew A</p>
          <p className="mt-1 text-sm text-slate-500">8 properties · 6h 40m planned</p>
        </div>
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800">Ready to publish</span>
      </div>
      <div className="mt-5 space-y-2">
        {[
          ['01', 'Ocotillo Court', '7:30 AM'],
          ['02', 'Saguaro Ridge', '8:25 AM'],
          ['03', 'Desert Willow Commons', '9:40 AM'],
        ].map(([number, property, time]) => (
          <div className="flex items-center gap-3 rounded-xl bg-white p-3" key={number}>
            <span className="grid h-9 w-9 place-items-center rounded-full bg-slate-900 text-xs font-black text-white">{number}</span>
            <span className="min-w-0 flex-1 truncate font-black">{property}</span>
            <span className="text-sm font-bold text-slate-500">{time}</span>
          </div>
        ))}
      </div>
    </>
  );
}
