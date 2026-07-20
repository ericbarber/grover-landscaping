export type CustomerHistoryView = 'properties' | 'bids';

export function customerHistoryItems(propertyCount: number, bidCount: number) {
  return [
    { id: 'properties' as const, label: 'Properties', count: propertyCount },
    { id: 'bids' as const, label: 'Bids', count: bidCount },
  ];
}

export function CustomerHistoryMenu({
  activeView,
  bidCount,
  onChange,
  propertyCount,
}: {
  activeView: CustomerHistoryView;
  bidCount: number;
  onChange: (view: CustomerHistoryView) => void;
  propertyCount: number;
}) {
  return (
    <nav aria-label="Customer history" className="mt-5 grid grid-cols-2 gap-2 lg:hidden">
      {customerHistoryItems(propertyCount, bidCount).map((item) => (
        <button
          aria-current={activeView === item.id ? 'page' : undefined}
          className={`min-h-14 rounded-xl border px-3 py-2 text-left ${
            activeView === item.id
              ? 'border-emerald-700 bg-emerald-800 text-white'
              : 'border-slate-200 bg-slate-50 text-slate-700'
          }`}
          key={item.id}
          onClick={() => onChange(item.id)}
          type="button"
        >
          <span className="block text-sm font-black">{item.label}</span>
          <span className={`text-xs ${
            activeView === item.id ? 'text-emerald-100' : 'text-slate-500'
          }`}>
            {item.count} {item.count === 1 ? 'item' : 'items'}
          </span>
        </button>
      ))}
    </nav>
  );
}
