import { GroverBrand } from './GroverBrand';
import { PROVIDER_INVITATION_PATH } from '../domain/providerInvitationRoute';
import { providerWorkspaceHref } from '../domain/providerEntryRoute';

const readinessSteps = [
  { title: 'Confirm your account', detail: 'Use a verified business email so invitations and access stay tied to the right person.' },
  { title: 'Create or join the provider', detail: 'Owner-operators still create a provider organization of one. Team members join an existing organization by invitation.' },
  { title: 'Complete the business profile', detail: 'Add customer-facing identity, contact, service area, operating timezone, and daily capacity.' },
  { title: 'Prepare operations', detail: 'Configure a crew, the first property, a workable route, and least-privilege team access.' },
];

export function ProviderEntryPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-bone text-ink">
      <header className="border-b border-slate-200 bg-paper">
        <nav aria-label="Provider entry navigation" className="mx-auto flex min-h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <a aria-label="Grover home" className="text-emerald-800" href="/"><GroverBrand /></a>
          <a className="grover-button-secondary" href="/app">Existing provider sign in</a>
        </nav>
      </header>

      <section className="bg-forest px-4 py-16 text-white sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-sand">Provider entry</p>
          <h1 className="mt-5 max-w-4xl font-display text-5xl font-black leading-[1.02] sm:text-6xl">Start with the provider path that matches your role.</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-emerald-100">Grover creates provider organizations—not public “Yard Crew” marketplace accounts. Choose how you are entering, then sign in to complete only the setup you are authorized to manage.</p>
          <div className="mt-7 inline-flex max-w-3xl items-start gap-3 rounded-2xl border border-white/15 bg-white/10 p-4 text-sm leading-6 text-emerald-50" role="note">
            <span aria-hidden="true" className="font-black text-sand">i</span>
            <p><strong>No opportunity promise.</strong> Creating a provider profile does not publish your business, guarantee work, expose owner details, or make curated service opportunities available.</p>
          </div>
        </div>
      </section>

      <section aria-labelledby="choose-provider-path" className="px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl"><p className="grover-eyebrow">Choose your path</p><h2 className="mt-3 font-display text-4xl font-black text-forest" id="choose-provider-path">One provider identity, different responsibilities.</h2><p className="mt-4 text-lg leading-8 text-slate-600">A worker invitation never creates another company, and an owner invitation never grants broader marketplace access.</p></div>
          <div className="mt-9 grid gap-4 lg:grid-cols-2">
            <article className="flex flex-col rounded-3xl border border-emerald-200 bg-paper p-6 shadow-grover-sm sm:p-8">
              <p className="grover-eyebrow">I own and perform the work</p><h3 className="mt-3 text-2xl font-black text-forest">Owner-operator</h3><p className="mt-3 flex-1 leading-7 text-slate-600">Create a provider organization of one. You can hold business-owner and field responsibilities without bypassing organization-scoped access.</p><ul className="mt-5 space-y-2 text-sm font-bold text-slate-700"><li>Provider organization, even for one person</li><li>Owner-managed profile and readiness</li><li>Field access stays role-scoped</li></ul><a className="grover-button-primary mt-6" href={providerWorkspaceHref('owner-operator')}>Start owner-operator setup <span className="ml-2" aria-hidden="true">→</span></a>
            </article>
            <article className="flex flex-col rounded-3xl border border-slate-200 bg-paper p-6 shadow-grover-sm sm:p-8">
              <p className="grover-eyebrow">I manage a service business</p><h3 className="mt-3 text-2xl font-black text-forest">Company owner</h3><p className="mt-3 flex-1 leading-7 text-slate-600">Create or continue a landscaping provider organization, then configure the company profile, crews, service area, capacity, and invitations.</p><ul className="mt-5 space-y-2 text-sm font-bold text-slate-700"><li>Organization owner authority</li><li>Company profile and operating readiness</li><li>Team access by invitation</li></ul><a className="grover-button-primary mt-6" href={providerWorkspaceHref('company-owner')}>Start company setup <span className="ml-2" aria-hidden="true">→</span></a>
            </article>
            <article className="flex flex-col rounded-3xl border border-slate-200 bg-paper p-6 sm:p-8">
              <p className="grover-eyebrow">My company invited me</p><h3 className="mt-3 text-2xl font-black text-forest">Crew lead or team member</h3><p className="mt-3 flex-1 leading-7 text-slate-600">Use the organization invitation you received. Review the provider, offered role, scope, and expiration before accepting; a generic signup cannot grant team access.</p><a className="grover-button-secondary mt-6" href="/app">Sign in with your invitation <span className="ml-2" aria-hidden="true">→</span></a>
            </article>
            <article className="flex flex-col rounded-3xl border border-sand bg-[#f5ead4] p-6 sm:p-8">
              <p className="grover-eyebrow">A yard owner invited my business</p><h3 className="mt-3 text-2xl font-black text-forest">Known-owner connection</h3><p className="mt-3 flex-1 leading-7 text-slate-700">Review your recipient-specific invitation progress. Owner-approved yard details remain withheld until the separate disclosure decision is complete.</p><a className="grover-button-secondary mt-6" href={PROVIDER_INVITATION_PATH}>Review an owner invitation <span className="ml-2" aria-hidden="true">→</span></a>
            </article>
          </div>
        </div>
      </section>

      <section className="bg-paper px-4 py-16 sm:px-6 lg:px-8" aria-labelledby="provider-readiness-heading">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-start">
          <div><p className="grover-eyebrow">Provider readiness</p><h2 className="mt-3 font-display text-4xl font-black text-forest" id="provider-readiness-heading">Setup is preparation—not publication.</h2><p className="mt-4 leading-7 text-slate-600">Grover keeps supplied identity, active access, operational readiness, and future eligibility separate. A single “verified” badge cannot stand in for those facts.</p></div>
          <ol className="grid gap-3 sm:grid-cols-2">
            {readinessSteps.map((step, index) => <li className="rounded-2xl border border-slate-200 bg-bone p-5" key={step.title}><span className="grid size-9 place-items-center rounded-full bg-emerald-800 text-sm font-black text-white">{index + 1}</span><h3 className="mt-4 font-black text-forest">{step.title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{step.detail}</p></li>)}
          </ol>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl rounded-3xl bg-slate-950 p-8 text-center text-white sm:p-12"><p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">Ready to begin?</p><h2 className="mt-4 font-display text-4xl font-black">Create the provider boundary first.</h2><p className="mx-auto mt-4 max-w-2xl leading-7 text-slate-300">Choose owner-operator or company-owner setup. If someone invited you, return to that exact invitation so Grover can preserve its role and data scope.</p><div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row"><a className="inline-flex min-h-12 items-center justify-center rounded-full bg-emerald-400 px-6 font-black text-emerald-950" href={providerWorkspaceHref('company-owner')}>Start provider setup</a><a className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/20 px-6 font-black text-white" href={PROVIDER_INVITATION_PATH}>Review owner invitation</a></div></div>
      </section>
    </main>
  );
}
