import { CalendarCheck, MapPin, Phone } from 'lucide-react';
import Reveal from './Reveal';
import ParallaxImage from './ParallaxImage';
import { COMPANY } from '@/data/companyInfo';
import { PHOTOS, responsive } from '@/data/projects';

/** "Visit us" call-to-action band with a photo backdrop, shown above the footer. */
export default function CtaSection() {
  return (
    <section className="section">
      <div className="container">
        <Reveal className="relative isolate overflow-hidden px-6 py-16 text-center md:px-16 md:py-28">
          <ParallaxImage
            img={{ ...responsive(PHOTOS.pwNight), alt: '' }}
            reveal={false}
            strength={12}
            className="!absolute inset-0 -z-10"
          />
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-navy-950/80 via-navy-950/70 to-navy-950/85" />

          <div className="mx-auto max-w-2xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-primary-300">Visit us</p>
            <h2 className="mt-4 text-[2.2rem] font-semibold leading-tight text-white md:text-5xl">
              See your future home <em className="font-medium text-primary-300">in person.</em>
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-white/80">
              Walk through the homes, the amenities and the neighbourhood with our team. Site visits every day of the
              week.
            </p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <a
                href="#book-visit"
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-primary-500 to-primary-300 px-8 py-4 text-[12px] font-bold uppercase tracking-[0.18em] text-navy-950 shadow-gold transition hover:brightness-105"
              >
                <CalendarCheck className="h-5 w-5" /> Book a site visit
              </a>
              <a
                href={`tel:${COMPANY.phone}`}
                className="inline-flex items-center justify-center gap-2 border border-white/40 px-8 py-4 text-[12px] font-bold uppercase tracking-[0.18em] text-white transition-colors hover:bg-white/10"
              >
                <Phone className="h-4 w-4" /> {COMPANY.phoneDisplay}
              </a>
            </div>
            <a
              href={COMPANY.mapUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-8 inline-flex items-center gap-2 text-sm text-white/70 underline-offset-4 hover:text-white hover:underline"
            >
              <MapPin className="h-4 w-4 text-primary-300" /> {COMPANY.address}
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
