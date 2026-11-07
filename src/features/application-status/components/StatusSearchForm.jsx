import { useState } from 'react';
import { Search } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useStatusStore } from '../store/useStatusStore';

export default function StatusSearchForm({ initialQuery = '' }) {
  const [value, setValue] = useState(initialQuery);
  const [error, setError] = useState('');
  const search = useStatusStore((s) => s.search);
  const loading = useStatusStore((s) => s.status === 'loading');

  const onSubmit = (e) => {
    e.preventDefault();
    if (value.trim().length < 6) {
      setError('Enter a valid registration number or mobile number');
      return;
    }
    setError('');
    search(value);
  };

  return (
    <form onSubmit={onSubmit} noValidate>
      <label htmlFor="status-query" className="text-sm font-medium text-navy-900">
        Registration Number or Mobile Number
      </label>
      <div className="mt-2 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            id="status-query"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="e.g. SKH2026-1001 or 9876543210"
            className="h-14 w-full rounded-full border border-slate-200 bg-white pl-12 pr-4 text-base focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-500/15"
          />
        </div>
        <Button type="submit" size="lg" loading={loading}>
          Track Status
        </Button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <p className="mt-3 text-xs text-slate-500">
        Demo: try <span className="font-mono font-semibold">SKH2026-1001</span> or{' '}
        <span className="font-mono font-semibold">SKH2026-1002</span>
      </p>
    </form>
  );
}
