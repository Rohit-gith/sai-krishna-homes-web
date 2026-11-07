import { Search } from 'lucide-react';
import { SERVICE_CATEGORIES } from '@/data/services';
import { cn } from '@/utils/cn';

export default function ServiceFilter({ category, onCategoryChange, query, onQueryChange }) {
  return (
    <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-wrap lg:px-0">
        {SERVICE_CATEGORIES.map((c) => (
          <button
            key={c.key}
            onClick={() => onCategoryChange(c.key)}
            className={cn(
              'shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors',
              category === c.key ? 'bg-navy-950 text-white' : 'bg-slate-100 text-navy-900 hover:bg-slate-200',
            )}
          >
            {c.label}
          </button>
        ))}
      </div>
      <label className="relative w-full lg:w-72">
        <span className="sr-only">Search services</span>
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search services…"
          className="w-full rounded-full border border-slate-200 bg-white py-2.5 pl-11 pr-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-500/15"
        />
      </label>
    </div>
  );
}
