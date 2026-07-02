import type { CustomerAccountProfile, CustomerPropertyProfile } from '../domain/jobs';
import {
  filterCustomerPropertiesWithoutPortfolio,
  getCustomerPortfolioCoverageCounts,
} from '../domain/propertyPortfolioCoverage';
import {
  buildPropertyPortfolioDetails,
  portfolioPropertyCountLabel,
  portfolioTypeLabel,
  type PortfolioPropertyLink,
  type PropertyPortfolio,
} from '../domain/propertyPortfolios';

export function CustomerPortfolioSummaryPanel({
  customer,
  portfolios,
  properties,
  links,
}: {
  customer: CustomerAccountProfile;
  portfolios: PropertyPortfolio[];
  properties: CustomerPropertyProfile[];
  links: PortfolioPropertyLink[];
}) {
  const portfolioDetails = buildPropertyPortfolioDetails(portfolios, properties, links, customer);
  const ungroupedProperties = filterCustomerPropertiesWithoutPortfolio(properties, links, customer);
  const coverage = getCustomerPortfolioCoverageCounts(properties, links, customer);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Property groups</p>
        <h2 className="mt-1 text-2xl font-bold text-slate-950">{customer.displayName}</h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Group yards by owner portfolio, property management company, HOA, or commercial client.
        </p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-2xl font-bold text-slate-950">{coverage.totalPropertyCount}</p>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Customer yards</p>
        </div>
        <div className="rounded-xl bg-emerald-50 p-4">
          <p className="text-2xl font-bold text-emerald-950">{coverage.linkedPropertyCount}</p>
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">Grouped yards</p>
        </div>
        <div className="rounded-xl bg-amber-50 p-4">
          <p className="text-2xl font-bold text-amber-950">{coverage.unlinkedPropertyCount}</p>
          <p className="text-xs font-medium uppercase tracking-wide text-amber-700">Need a group</p>
        </div>
      </div>

      {portfolioDetails.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-600">
          <p className="font-semibold text-slate-800">No property groups are available yet.</p>
          <p className="mt-1">Create a group before assigning yards to customer portal sections.</p>
        </div>
      ) : (
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {portfolioDetails.map((detail) => (
            <article key={detail.portfolioId} className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-slate-950">{detail.displayName}</h3>
                  <p className="mt-1 text-sm text-slate-600">{portfolioTypeLabel(detail.portfolioType)}</p>
                </div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-800">
                  {portfolioPropertyCountLabel(detail.propertyCount)}
                </span>
              </div>

              {detail.properties.length > 0 && (
                <div className="mt-4 space-y-2">
                  {detail.properties.map((property) => (
                    <div key={property.id} className="rounded-lg bg-slate-50 px-3 py-2">
                      <p className="text-sm font-semibold text-slate-800">{property.displayName}</p>
                      <p className="text-xs text-slate-600">{property.address}</p>
                    </div>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {ungroupedProperties.length > 0 ? (
        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div>
            <h3 className="font-semibold text-amber-950">Yards that need a property group</h3>
            <p className="mt-1 text-sm text-amber-800">
              These yards remain visible to the customer while their portfolio grouping is completed.
            </p>
          </div>
          <div className="mt-3 space-y-2">
            {ungroupedProperties.map((property) => (
              <div key={property.id} className="rounded-lg border border-amber-100 bg-white px-3 py-2">
                <p className="text-sm font-semibold text-slate-800">{property.displayName}</p>
                <p className="text-xs text-slate-600">{property.address}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
