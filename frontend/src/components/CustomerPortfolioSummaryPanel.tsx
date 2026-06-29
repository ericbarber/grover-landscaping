import type { CustomerAccountProfile, CustomerPropertyProfile } from '../domain/jobs';
import {
  buildPropertyPortfolioSummaries,
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
  const summaries = buildPropertyPortfolioSummaries(portfolios, properties, links, customer);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Property groups</p>
        <h2 className="mt-1 text-2xl font-bold text-slate-950">{customer.displayName}</h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Group yards by owner portfolio, property management company, HOA, or commercial client without assigning ownership to a crew.
        </p>
      </div>

      {summaries.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-600">
          No property groups are available for this customer account yet.
        </div>
      ) : (
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {summaries.map((summary) => (
            <article key={summary.portfolioId} className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-slate-950">{summary.displayName}</h3>
                  <p className="mt-1 text-sm text-slate-600">{portfolioTypeLabel(summary.portfolioType)}</p>
                </div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-800">
                  {summary.propertyCount} yards
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
