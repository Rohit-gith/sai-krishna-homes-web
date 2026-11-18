import { lazy, Suspense } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { CHAPTERS, ROMAN, chapterPath } from '@/features/explore/chapters';
import ChapterVisual from '@/features/explore/ChapterVisual';
import CtaSection from '@/components/common/CtaSection';
import PageLoader from '@/components/common/PageLoader';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

const SECTIONS = {
  homes: lazy(() => import('@/features/home/components/HomeTypes')),
  'virtual-tour': lazy(() => import('@/features/explore/VirtualTourSection')),
  gallery: lazy(() => import('@/features/home/components/GallerySection')),
  'a-day-at-panchawati': lazy(() => import('@/features/home/components/DayStory')),
  'emi-calculator': lazy(() => import('@/features/home/components/EmiCalculator')),
  location: lazy(() => import('@/features/home/components/LocationSection')),
};

function ChapterNav({ index }) {
  const prev = CHAPTERS[(index - 1 + CHAPTERS.length) % CHAPTERS.length];
  const next = CHAPTERS[(index + 1) % CHAPTERS.length];
  return (
    <nav aria-label="Chapters" className="bg-white">
      <div className="container grid border-t border-navy-900/10 sm:grid-cols-2">
        {[
          [prev, 'Previous', ArrowLeft],
          [next, 'Next', ArrowRight],
        ].map(([c, label, Icon], i) => (
          <Link
            key={label}
            to={chapterPath(c.slug)}
            className={`group flex items-center gap-5 py-8 md:py-10 ${i ? 'justify-end text-right sm:border-l sm:border-navy-900/10 sm:pl-8' : 'sm:pr-8'}`}
          >
            {!i && <Icon className="h-5 w-5 shrink-0 text-primary-600 transition-transform group-hover:-translate-x-1" />}
            <ChapterVisual chapter={c} className={`hidden h-16 w-24 md:block ${i ? 'order-2' : ''}`} />
            <span className={i ? 'order-1' : ''}>
              <span className="block text-[10px] font-bold uppercase tracking-[0.3em] text-primary-700">{label} chapter</span>
              <span className="mt-1 block font-serif text-2xl text-navy-950 md:text-3xl">{c.title}</span>
            </span>
            {i ? <Icon className="order-3 h-5 w-5 shrink-0 text-primary-600 transition-transform group-hover:translate-x-1" /> : null}
          </Link>
        ))}
      </div>
    </nav>
  );
}

export default function ExplorePage() {
  const { slug } = useParams();
  const index = CHAPTERS.findIndex((c) => c.slug === slug);
  const chapter = CHAPTERS[index];
  useDocumentTitle(chapter?.title || 'Explore', chapter && `${chapter.blurb}. Explore Sai Krishna Homes, Bhubaneswar.`);
  // The masterplan moved back to the home page.
  if (slug === 'masterplan') return <Navigate to="/#masterplan" replace />;
  if (!chapter) return <Navigate to="/" replace />;

  const Section = SECTIONS[slug];

  return (
    <>
      {/* Spacer for the fixed header + a slim chapter bar */}
      <div className="bg-ivory pt-16 md:pt-[5.75rem]">
        <div className="container flex items-center justify-between gap-4 border-b border-navy-900/10 py-4 text-[11px] font-bold uppercase tracking-[0.25em]">
          <p className="text-navy-900/60">
            <Link to="/" className="-my-3.5 inline-block py-3.5 pr-1 hover:text-navy-950">Home</Link> <span className="px-1.5">/</span> Explore
          </p>
          <p className="text-primary-700">
            Chapter {String(index + 1).padStart(2, '0')} / {String(CHAPTERS.length).padStart(2, '0')}
          </p>
        </div>
      </div>
      <h1 className="sr-only">{chapter.title} · Sai Krishna Homes</h1>

      <Suspense fallback={<PageLoader />}>
        <Section numeral={ROMAN[index]} />
      </Suspense>

      <ChapterNav index={index} />
      <CtaSection />
    </>
  );
}
