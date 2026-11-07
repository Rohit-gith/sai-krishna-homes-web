import ChapterHeading from './ChapterHeading';
import Reveal from '@/components/common/Reveal';
import ParallaxImage from '@/components/common/ParallaxImage';
import { COMPANY } from '@/data/companyInfo';
import { PHOTOS, responsive } from '@/data/projects';

const PROMISES = [
  {
    title: `Building since ${COMPANY.established}`,
    text: 'Over a decade of delivering homes that families are proud to live in.',
  },
  {
    title: 'RERA & bank approved',
    text: 'RERA approval, bank approvals and all necessary clearances for a secure investment.',
  },
  {
    title: 'Prime addresses',
    text: 'Patia, and South Bhubaneswar close to the Cuttack–Bhubaneswar Bypass.',
  },
  {
    title: 'Township scale',
    text: '500+ homes across nearly 6 acres, planned around open greens.',
  },
  {
    title: 'Convenience inside the gates',
    text: 'Shopping, pharmacy, doctor’s chamber, ATM and groceries within the community.',
  },
  {
    title: 'Made for every age',
    text: 'Play areas for children, a sports arena for the active and a quiet garden for seniors.',
  },
];

const ROMAN = ['i', 'ii', 'iii', 'iv', 'v', 'vi'];

export default function WhyChooseUs({ numeral = 'IV' } = {}) {
  return (
    <section className="section bg-white">
      <div className="container">
        <ChapterHeading
          numeral={numeral}
          label="The promise"
          title="Trust, built brick by brick"
          intro="Spaces that add lasting value to people’s lives: well located, fully approved and planned around how families really live."
        />

        <div className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-24">
          {/* Sticky arch photo */}
          <Reveal className="lg:sticky lg:top-32 lg:self-start">
            <div className="rounded-t-full border border-primary-300 p-3">
              <ParallaxImage
                img={responsive(PHOTOS.pwNight, '(min-width: 1024px) 40vw, 100vw')}
                className="aspect-[4/5] rounded-t-full"
              />
            </div>
            <p className="mt-5 flex items-baseline justify-between border-t border-navy-900/10 pt-4">
              <span className="font-serif text-5xl font-semibold text-navy-950">500+</span>
              <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-500">
                homes across ~6 acres
              </span>
            </p>
          </Reveal>

          {/* Numbered promises */}
          <ol className="border-t border-navy-900/10">
            {PROMISES.map((p, i) => (
              <Reveal
                as="li"
                key={p.title}
                delay={i * 0.04}
                className="group grid grid-cols-[3.5rem_1fr] gap-4 border-b border-navy-900/10 py-8 sm:grid-cols-[5rem_1fr]"
              >
                <span className="font-serif text-2xl italic text-primary-500 transition-colors group-hover:text-primary-700">
                  {ROMAN[i]}.
                </span>
                <span>
                  <span className="block font-serif text-[1.65rem] font-semibold leading-tight text-navy-950">{p.title}</span>
                  <span className="mt-2 block max-w-lg text-[15.5px] leading-[1.8] text-slate-600">{p.text}</span>
                </span>
              </Reveal>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
