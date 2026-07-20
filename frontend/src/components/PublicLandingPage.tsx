import { useState } from 'react';

type MarketingPersonaId = 'owner' | 'property-manager' | 'company' | 'crew';

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

const productSteps = [
  {
    number: '01',
    label: 'Plan',
    title: 'Give every day a clear shape.',
    description: 'Coordinate properties, crews, routes, service details, and customer expectations before work begins.',
  },
  {
    number: '02',
    label: 'Care',
    title: 'Keep the field focused.',
    description: 'Put the next stop, required work, property context, and offline-ready tools directly in the crew’s hands.',
  },
  {
    number: '03',
    label: 'Proof',
    title: 'Make excellent work visible.',
    description: 'Turn photos, checklists, notes, and recommendations into customer confidence and revenue-ready records.',
  },
];

export function PublicLandingPage() {
  const [activePersonaId, setActivePersonaId] = useState<MarketingPersonaId>('company');
  const activePersona = marketingPersonas.find((persona) => persona.id === activePersonaId)
    ?? marketingPersonas[0];

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f6f7f2] text-slate-950">
      <header className="fixed inset-x-0 top-0 z-30 border-b border-white/10 bg-slate-950/80 text-white backdrop-blur-xl">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8" aria-label="Main navigation">
          <a className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.25em]" href="/">
            <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_0_5px_rgba(52,211,153,0.16)]" />
            Grover
          </a>
          <div className="hidden items-center gap-7 text-sm font-bold text-slate-200 md:flex">
            <a className="transition hover:text-white" href="#how-it-works">How it works</a>
            <a className="transition hover:text-white" href="#who-its-for">Who it’s for</a>
            <a className="transition hover:text-white" href="#product">Product</a>
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
              Landscaping work, beautifully organized
            </p>
            <h1 className="mt-6 text-5xl font-black leading-[0.92] tracking-[-0.045em] sm:text-6xl lg:text-7xl xl:text-8xl">
              From the plan to the proof.
            </h1>
            <p className="mt-7 max-w-2xl text-lg font-medium leading-8 text-slate-200 sm:text-xl">
              Grover connects the people, properties, and promises behind exceptional landscape care—so every day runs clearer and every customer sees the difference.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a className="inline-flex min-h-12 items-center justify-center rounded-full bg-emerald-400 px-6 py-3 font-black text-emerald-950 transition hover:bg-emerald-300" href="/app">
                Explore the workspace <span className="ml-2" aria-hidden="true">→</span>
              </a>
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
                onClick={() => setActivePersonaId(persona.id)}
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

      <section className="bg-white px-4 py-20 sm:px-6 lg:px-8" id="how-it-works">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">The Grover difference</p>
            <h2 className="mt-4 text-4xl font-black leading-tight tracking-tight sm:text-5xl">Great care becomes a visible system.</h2>
          </div>
          <div className="mt-12 grid gap-4 lg:grid-cols-3">
            {productSteps.map((step) => (
              <article className="rounded-[1.75rem] border border-slate-200 bg-[#f6f7f2] p-7" key={step.label}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-700">{step.label}</p>
                  <span className="text-sm font-black text-slate-300">{step.number}</span>
                </div>
                <h3 className="mt-12 text-2xl font-black tracking-tight">{step.title}</h3>
                <p className="mt-3 leading-7 text-slate-600">{step.description}</p>
              </article>
            ))}
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
          <a className="mt-8 inline-flex min-h-12 items-center justify-center rounded-full bg-emerald-400 px-7 py-3 font-black text-emerald-950 transition hover:bg-emerald-300" href="/app">
            Open Grover <span className="ml-2" aria-hidden="true">→</span>
          </a>
        </div>
      </section>

      <footer className="border-t border-slate-800 bg-slate-950 px-4 py-8 text-slate-400 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="font-black uppercase tracking-[0.2em] text-white">Grover</p>
          <p>Plan the work. Care for the property. Prove the difference.</p>
        </div>
      </footer>
    </main>
  );
}
