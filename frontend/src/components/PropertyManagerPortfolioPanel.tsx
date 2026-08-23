import { useMemo, useState } from 'react';
import type { PropertyCompletionReportSummary } from '../api/client';
import {
  customerVisitStatusLabel,
  type CustomerPortalVisitSummary,
} from '../domain/customerPortalVisits';
import {
  filterPropertiesForCustomerPortal,
  type CustomerAccountProfile,
  type CustomerPropertyProfile,
} from '../domain/jobs';
import {
  buildPropertyPortfolioDetails,
  portfolioTypeLabel,
  type PortfolioPropertyLink,
  type PropertyPortfolio,
} from '../domain/propertyPortfolios';
import { projectBidTotalCents, type ProjectBid } from '../domain/stopProgress';
import { WorkspaceIcon } from './WorkspaceIcon';
import { WorkspaceStatusBadge, WorkspaceStatusNotice } from './WorkspaceStatus';

type PortfolioDestination = 'overview' | 'properties' | 'proof' | 'approvals';

const destinations: Array<{ id: PortfolioDestination; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'properties', label: 'Properties' },
  { id: 'proof', label: 'Proof' },
  { id: 'approvals', label: 'Approvals' },
];

function dateLabel(value: string): string {
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function deliveredDateLabel(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function currencyLabel(cents: number): string {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(cents / 100);
}

function isVisitException(visit: CustomerPortalVisitSummary | undefined): boolean {
  return visit?.status === 'weather_delay' || visit?.status === 'rescheduled';
}

function serviceFrequencyLabel(value: CustomerPropertyProfile['serviceFrequency']): string {
  return value.replace('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function PropertyManagerPortfolioPanel({
  customer,
  portfolios,
  properties,
  links,
  visits,
  completionReportsByProperty,
  isLoadingReportHistory,
  hasReportHistoryError,
  projectBids,
  isLoadingProjectBids,
  hasProjectBidHistoryError,
  providerDisplayName,
}: {
  customer: CustomerAccountProfile;
  portfolios: PropertyPortfolio[];
  properties: CustomerPropertyProfile[];
  links: PortfolioPropertyLink[];
  visits: CustomerPortalVisitSummary[];
  completionReportsByProperty: Record<string, PropertyCompletionReportSummary[]>;
  isLoadingReportHistory: boolean;
  hasReportHistoryError: boolean;
  projectBids: ProjectBid[];
  isLoadingProjectBids: boolean;
  hasProjectBidHistoryError: boolean;
  providerDisplayName: string;
}) {
  const [destination, setDestination] = useState<PortfolioDestination>('overview');
  const [portfolioId, setPortfolioId] = useState('all');
  const [search, setSearch] = useState('');
  const customerProperties = filterPropertiesForCustomerPortal(properties, customer);
  const portfolioDetails = buildPropertyPortfolioDetails(portfolios, properties, links, customer);
  const selectedPortfolio = portfolioDetails.find((portfolio) => portfolio.portfolioId === portfolioId);
  const visibleProperties = selectedPortfolio?.properties ?? customerProperties;
  const visiblePropertyIds = useMemo(
    () => new Set(visibleProperties.map((property) => property.id)),
    [visibleProperties],
  );
  const visibleVisits = visits.filter((visit) => (
    visit.customerId === customer.id
    && visit.organizationId === customer.organizationId
    && visiblePropertyIds.has(visit.propertyId)
  ));
  const nextVisitByProperty = new Map<string, CustomerPortalVisitSummary>();
  [...visibleVisits]
    .sort((left, right) => left.scheduledDate.localeCompare(right.scheduledDate))
    .forEach((visit) => {
      if (!nextVisitByProperty.has(visit.propertyId)) nextVisitByProperty.set(visit.propertyId, visit);
    });
  const exceptionProperties = visibleProperties.filter((property) => isVisitException(nextVisitByProperty.get(property.id)));
  const scheduledPropertyCount = visibleProperties.filter((property) => nextVisitByProperty.has(property.id)).length;
  const readyPropertyCount = scheduledPropertyCount - exceptionProperties.length;
  const visibleReports = visibleProperties.flatMap(
    (property) => completionReportsByProperty[property.id] ?? [],
  ).sort((left, right) => right.deliveredAt.localeCompare(left.deliveredAt));
  const pendingBids = projectBids.filter((bid) => bid.status === 'sent');
  const filteredProperties = visibleProperties.filter((property) => (
    `${property.displayName} ${property.address}`.toLowerCase().includes(search.trim().toLowerCase())
  ));
  const hasPartialData = hasReportHistoryError || hasProjectBidHistoryError;

  if (customerProperties.length === 0) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-paper p-6 shadow-grover-md" data-property-manager-portfolio>
        <p className="grover-eyebrow">Property portfolio</p>
        <h1 className="mt-2 font-display text-4xl font-black text-forest">Welcome, {customer.displayName}</h1>
        <WorkspaceStatusNotice
          className="mt-6"
          detail="An authorized account manager can connect the first property without changing its service ownership or crew assignment."
          title="No active property is connected yet."
          tone="neutral"
        />
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-paper shadow-grover-md" data-property-manager-portfolio>
      <header className="bg-forest p-5 text-white sm:p-7">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-sand">Property portfolio</p>
            <h1 className="mt-2 font-display text-3xl font-black">Service confidence across every location.</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-200">
              Customer-safe readiness, delivered proof, and decisions for {customer.displayName}.
            </p>
          </div>
          <label className="text-xs font-black uppercase tracking-wide text-slate-200">
            Portfolio
            <select
              aria-label="Choose property portfolio"
              className="mt-2 min-h-12 w-full rounded-xl border border-white/30 bg-paper px-3 text-base font-bold normal-case tracking-normal text-forest"
              onChange={(event) => {
                setPortfolioId(event.target.value);
                setDestination('overview');
              }}
              value={portfolioId}
            >
              <option value="all">All account properties · {customerProperties.length}</option>
              {portfolioDetails.map((portfolio) => (
                <option key={portfolio.portfolioId} value={portfolio.portfolioId}>
                  {portfolio.displayName} · {portfolio.propertyCount}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>

      <nav aria-label="Property portfolio" className="grid grid-cols-4 border-b border-slate-200 bg-slate-50 p-2">
        {destinations.map((item) => (
          <button
            aria-current={destination === item.id ? 'page' : undefined}
            className={`min-h-12 rounded-xl px-2 text-xs font-black sm:text-sm ${destination === item.id ? 'bg-emerald-800 text-white shadow-grover-sm' : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-900'}`}
            key={item.id}
            onClick={() => setDestination(item.id)}
            type="button"
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-5 sm:p-7">
        <WorkspaceStatusNotice
          className="mb-5"
          compact
          detail="Next-service summaries below use the explicit local-review fixture. Delivered proof and recommendations use protected API history when available."
          title="Local review data boundary"
          tone="info"
        />
        {hasPartialData ? (
          <WorkspaceStatusNotice
            className="mb-5"
            detail={`The ${[hasReportHistoryError ? 'proof' : '', hasProjectBidHistoryError ? 'recommendation' : ''].filter(Boolean).join(' and ')} source could not be refreshed. Available portfolio records remain visible; missing values are not treated as zero.`}
            title="Some portfolio updates are unavailable."
            tone="warning"
          />
        ) : null}

        {destination === 'overview' ? (
          <div>
            <p className="grover-eyebrow">Portfolio overview</p>
            <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h1 className="font-display text-4xl font-black text-forest">Start with what needs attention.</h1>
                <p className="mt-2 text-sm text-slate-600">Readiness, exceptions, proof, and decisions stay connected to their properties.</p>
              </div>
              {selectedPortfolio ? <WorkspaceStatusBadge tone="neutral">{portfolioTypeLabel(selectedPortfolio.portfolioType)}</WorkspaceStatusBadge> : null}
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Portfolio summary">
              <article className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="grover-eyebrow">Properties</p><p className="mt-2 text-3xl font-black text-forest">{visibleProperties.length}</p><p className="mt-1 text-xs text-slate-500">Connected locations</p>
              </article>
              <article className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="grover-eyebrow">Service ready</p><p className="mt-2 text-3xl font-black text-emerald-950">{readyPropertyCount} of {visibleProperties.length}</p><p className="mt-1 text-xs text-emerald-800">Local-review schedule</p>
              </article>
              <article className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="grover-eyebrow">Open exceptions</p><p className="mt-2 text-3xl font-black text-amber-950">{exceptionProperties.length}</p><p className="mt-1 text-xs text-amber-800">Weather or reschedule</p>
              </article>
              <article className="rounded-2xl border border-clay/30 bg-clay/10 p-4">
                <p className="grover-eyebrow">Waiting on you</p><p className="mt-2 text-3xl font-black text-forest">{hasProjectBidHistoryError ? '—' : pendingBids.length}</p><p className="mt-1 text-xs text-slate-600">Recommendation decisions</p>
              </article>
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
              <section className="rounded-2xl border border-slate-200 bg-white p-5" aria-labelledby="portfolio-priority-heading">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div><p className="grover-eyebrow">Priority queue</p><h2 className="mt-1 text-xl font-black text-forest" id="portfolio-priority-heading">What needs attention</h2></div>
                  <button className="min-h-11 text-sm font-black text-emerald-800" onClick={() => setDestination('properties')} type="button">All properties →</button>
                </div>
                {exceptionProperties.length === 0 && pendingBids.length === 0 ? (
                  <WorkspaceStatusNotice className="mt-4" detail="No service exception or customer decision is waiting in the available records." title="No portfolio actions need attention." tone="success" />
                ) : (
                  <div className="mt-3 divide-y divide-slate-200">
                    {exceptionProperties.map((property) => {
                      const visit = nextVisitByProperty.get(property.id);
                      return (
                        <article className="py-4" key={property.id}>
                          <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-black text-forest">{property.displayName}</h3><p className="mt-1 text-sm text-slate-600">{visit?.nextUpdateMessage}</p></div><WorkspaceStatusBadge tone="warning">{visit ? customerVisitStatusLabel(visit.status) : 'Review'}</WorkspaceStatusBadge></div>
                        </article>
                      );
                    })}
                    {pendingBids.map((bid) => (
                      <article className="py-4" key={bid.id}>
                        <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-black text-forest">Recommendation decision</h3><p className="mt-1 text-sm text-slate-600">{currencyLabel(projectBidTotalCents(bid))} · {bid.lineItems.length} scope item{bid.lineItems.length === 1 ? '' : 's'}</p></div>{bid.shareUrl ? <a className="grover-button-secondary" href={bid.shareUrl}>Review</a> : <WorkspaceStatusBadge tone="warning">Decision needed</WorkspaceStatusBadge>}</div>
                      </article>
                    ))}
                  </div>
                )}
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-5" aria-labelledby="portfolio-coverage-heading">
                <p className="grover-eyebrow">Coverage</p><h2 className="mt-1 text-xl font-black text-forest" id="portfolio-coverage-heading">Next service window</h2>
                <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-200" aria-label={`${readyPropertyCount} ready of ${visibleProperties.length} properties`} role="img"><div className="h-full bg-emerald-700" style={{ width: `${visibleProperties.length ? (readyPropertyCount / visibleProperties.length) * 100 : 0}%` }} /></div>
                <p className="mt-3 text-sm text-slate-600">{scheduledPropertyCount} with an illustrative next visit · {visibleProperties.length - scheduledPropertyCount} awaiting schedule data</p>
                <button className="grover-button-secondary mt-5 w-full" onClick={() => setDestination('properties')} type="button">Review property coverage</button>
              </section>
            </div>
          </div>
        ) : null}

        {destination === 'properties' ? (
          <div>
            <p className="grover-eyebrow">Portfolio coverage</p>
            <h1 className="mt-2 font-display text-4xl font-black text-forest">Every property, one accountable view.</h1>
            <p className="mt-2 text-sm text-slate-600">Provider status is customer-safe; crew, route, and production details stay private.</p>
            <label className="mt-5 block max-w-md text-xs font-black uppercase tracking-wide text-slate-600">Search properties<input aria-label="Search portfolio properties" className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-base font-medium normal-case tracking-normal" onChange={(event) => setSearch(event.target.value)} placeholder="Name or address" type="search" value={search} /></label>
            <div className="mt-5 grid gap-3">
              {filteredProperties.map((property) => {
                const visit = nextVisitByProperty.get(property.id);
                const portfolio = portfolioDetails.find((detail) => detail.properties.some((candidate) => candidate.id === property.id));
                return (
                  <article className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-[minmax(0,1.3fr)_minmax(0,.8fr)_minmax(0,.8fr)_auto] md:items-center" key={property.id}>
                    <div><h2 className="font-black text-forest">{property.displayName}</h2><p className="mt-1 text-sm text-slate-600">{property.address}</p><p className="mt-1 text-xs text-slate-500">{portfolio?.displayName ?? 'Not grouped'}</p></div>
                    <div><p className="text-xs font-black uppercase tracking-wide text-slate-500">Provider</p><p className="mt-1 text-sm font-bold text-slate-700">{providerDisplayName}</p></div>
                    <div><p className="text-xs font-black uppercase tracking-wide text-slate-500">Cadence</p><p className="mt-1 text-sm font-bold text-slate-700">{serviceFrequencyLabel(property.serviceFrequency)}</p>{visit ? <p className="mt-1 text-xs text-slate-500">{dateLabel(visit.scheduledDate)} · {visit.arrivalWindow}</p> : null}</div>
                    <WorkspaceStatusBadge tone={isVisitException(visit) ? 'warning' : visit ? 'success' : 'neutral'}>{visit ? customerVisitStatusLabel(visit.status) : 'Schedule pending'}</WorkspaceStatusBadge>
                  </article>
                );
              })}
              {filteredProperties.length === 0 ? <WorkspaceStatusNotice detail="Clear or change the search to review other connected properties." title="No properties match that search." tone="neutral" /> : null}
            </div>
          </div>
        ) : null}

        {destination === 'proof' ? (
          <div>
            <p className="grover-eyebrow">Delivered evidence</p>
            <h1 className="mt-2 font-display text-4xl font-black text-forest">Proof ready for review.</h1>
            <p className="mt-2 text-sm text-slate-600">Customer-safe completion records across the selected portfolio.</p>
            {isLoadingReportHistory ? <p className="mt-5 text-sm font-bold text-slate-600" role="status">Loading delivered proof…</p> : null}
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {visibleReports.map((report) => {
                const property = visibleProperties.find((candidate) => candidate.id === report.propertyId);
                return <a className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-emerald-500" href={report.shareUrl} key={report.reportId}><p className="grover-eyebrow">Delivered {deliveredDateLabel(report.deliveredAt)}</p><h2 className="mt-2 text-xl font-black text-forest">{property?.displayName ?? report.propertyAddress}</h2><p className="mt-2 text-sm text-slate-600">Open the customer-safe completion record.</p></a>;
              })}
              {!isLoadingReportHistory && visibleReports.length === 0 && !hasReportHistoryError ? <WorkspaceStatusNotice detail="Proof appears here after a provider delivers a completion report for a connected property." title="No delivered proof yet." tone="neutral" /> : null}
            </div>
          </div>
        ) : null}

        {destination === 'approvals' ? (
          <div>
            <p className="grover-eyebrow">Approval center</p>
            <h1 className="mt-2 font-display text-4xl font-black text-forest">Recommendations and recorded decisions.</h1>
            <p className="mt-2 text-sm text-slate-600">Review customer-safe scope and total before responding.</p>
            {isLoadingProjectBids ? <p className="mt-5 text-sm font-bold text-slate-600" role="status">Loading recommendations…</p> : null}
            <div className="mt-5 space-y-3">
              {projectBids.map((bid) => (
                <article className="rounded-2xl border border-slate-200 bg-white p-5" key={bid.id}>
                  <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="grover-eyebrow">Account recommendation</p><h2 className="mt-2 text-xl font-black text-forest">{bid.lineItems[0]?.service.name ?? 'Additional service'}</h2><p className="mt-2 text-sm text-slate-600">{bid.lineItems.length} scope item{bid.lineItems.length === 1 ? '' : 's'} · {currencyLabel(projectBidTotalCents(bid))}</p></div><WorkspaceStatusBadge tone={bid.status === 'sent' ? 'warning' : bid.status === 'approved' || bid.status === 'converted' ? 'success' : 'neutral'}>{bid.status === 'sent' ? 'Decision needed' : bid.status.replace('_', ' ')}</WorkspaceStatusBadge></div>
                  {bid.shareUrl ? <a className="grover-button-secondary mt-4" href={bid.shareUrl}>Open recommendation</a> : null}
                </article>
              ))}
              {!isLoadingProjectBids && projectBids.length === 0 && !hasProjectBidHistoryError ? <WorkspaceStatusNotice detail="Customer-safe recommendations will appear here when a provider shares one with this account." title="No recommendations are waiting." tone="success" /> : null}
            </div>
          </div>
        ) : null}

        <footer className="mt-7 flex items-start gap-3 border-t border-slate-200 pt-5 text-xs leading-5 text-slate-500"><WorkspaceIcon className="mt-0.5 size-4 shrink-0 text-emerald-700" name="info" /><p><strong className="text-slate-700">Customer-safe view.</strong> Provider routes, crew notes, cost basis, margins, and internal identifiers are not included.</p></footer>
      </div>
    </section>
  );
}
