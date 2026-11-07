import { ArrowUpRight, Building2, MapPin, Phone, ShoppingBag } from 'lucide-react';
import ChapterHeading from './ChapterHeading';
import Reveal from '@/components/common/Reveal';
import { COMPANY } from '@/data/companyInfo';

// Only facts confirmed by the client's site. The map shows the SITE OFFICE (the only exact address we have).
const POINTS = [
  {
    icon: MapPin,
    title: 'The projects',
    text: 'Panchawati Residency in Patia; Sai Krishna Residency in South Bhubaneswar, close to the Cuttack–Bhubaneswar Bypass.',
  },
  {
    icon: ShoppingBag,
    title: 'Inside the community',
    text: 'Shopping, pharmacy, doctor’s chamber, ATM and groceries within the gates.',
  },
  {
    icon: Building2,
    title: 'Site office',
    text: COMPANY.address,
  },
];

export default function LocationSection({ numeral = 'VII' } = {}) {
  return (
    <section id="location" className="section scroll-mt-24 bg-white">
      <div className="container">
        <ChapterHeading
          numeral={numeral}
          label="The location"
          title="Well connected, wonderfully calm"
          intro="A quieter corner of Bhubaneswar with the city's arteries close at hand. Visit our site office and we will take you to the homes."
        />

        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
          <Reveal className="crop-marks mx-3.5">
            <div className="relative aspect-[4/3] overflow-hidden bg-navy-50 md:aspect-[16/10]">
              <iframe
                title="Map: Sai Krishna Homes site office"
                src={`https://maps.google.com/maps?q=${encodeURIComponent(COMPANY.plusCode)}&z=15&output=embed`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="absolute inset-0 h-full w-full border-0 grayscale-[35%] contrast-[1.05]"
              />
            </div>
            <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.25em] text-navy-900/60">
              Map · Sai Krishna Homes site office, Old Town
            </p>
          </Reveal>

          <Reveal delay={0.1} className="flex flex-col">
            <ul className="border-t border-navy-900/10">
              {POINTS.map(({ icon: Icon, title, text }) => (
                <li key={title} className="flex gap-5 border-b border-navy-900/10 py-6">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center bg-navy-900 text-primary-300">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-[11px] font-bold uppercase tracking-[0.25em] text-primary-700">{title}</span>
                    <span className="mt-1.5 block text-[15.5px] leading-[1.7] text-navy-950">{text}</span>
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row lg:mt-auto lg:pt-8">
              <a
                href={COMPANY.mapUrl}
                target="_blank"
                rel="noreferrer"
                className="group inline-flex flex-1 items-center justify-center gap-2 bg-navy-900 px-6 py-4 text-[12px] font-bold uppercase tracking-[0.18em] text-white transition-colors hover:bg-navy-800"
              >
                Get directions
                <ArrowUpRight className="h-4 w-4 text-primary-300 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </a>
              <a
                href={`tel:${COMPANY.phone}`}
                className="inline-flex flex-1 items-center justify-center gap-2 border border-navy-900/25 px-6 py-4 text-[12px] font-bold uppercase tracking-[0.18em] text-navy-950 transition-colors hover:border-primary-500"
              >
                <Phone className="h-4 w-4 text-primary-600" /> Call us
              </a>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
