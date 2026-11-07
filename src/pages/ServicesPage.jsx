import { useMemo, useState } from 'react';
import { SearchX } from 'lucide-react';
import PageHero from '@/components/common/PageHero';
import CtaSection from '@/components/common/CtaSection';
import Reveal from '@/components/common/Reveal';
import ServiceCard from '@/features/services/components/ServiceCard';
import ServiceFilter from '@/features/services/components/ServiceFilter';
import { SERVICES } from '@/data/services';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export default function ServicesPage() {
  useDocumentTitle('Our Services');
  const [category, setCategory] = useState('all');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SERVICES.filter((s) => {
      const matchCat = category === 'all' || s.category === category;
      const matchQuery = !q || s.title.toLowerCase().includes(q) || s.short.toLowerCase().includes(q);
      return matchCat && matchQuery;
    });
  }, [category, query]);

  return (
    <>
      <PageHero
        title="Our Services"
        subtitle="17+ professional services across agriculture, energy, engineering, legal, trade and education."
      />
      <section className="section">
        <div className="container">
          <ServiceFilter category={category} onCategoryChange={setCategory} query={query} onQueryChange={setQuery} />
          {filtered.length ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((service, i) => (
                <Reveal key={service.slug} delay={(i % 6) * 0.05}>
                  <ServiceCard service={service} />
                </Reveal>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-20 text-center">
              <SearchX className="h-12 w-12 text-slate-300" />
              <p className="mt-4 font-semibold text-navy-950">No services found</p>
              <p className="text-sm text-slate-500">Try another keyword or category.</p>
            </div>
          )}
        </div>
      </section>
      <CtaSection />
    </>
  );
}
