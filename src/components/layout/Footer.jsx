import { Link } from 'react-router-dom';
import { ArrowUpRight, Clock, Facebook, Instagram, Linkedin, Mail, MapPin, MessageCircle, Phone, Twitter } from 'lucide-react';
import { FOOTER_LINKS, BOOK_VISIT } from '@/constants/navLinks';
import { COMPANY, LEADERSHIP } from '@/data/companyInfo';
import logoImg from '@/assets/logo/logo.png';

const SOCIALS = [
  { icon: Facebook, href: COMPANY.social.facebook, label: 'Facebook' },
  { icon: Instagram, href: COMPANY.social.instagram, label: 'Instagram' },
  { icon: Linkedin, href: COMPANY.social.linkedin, label: 'LinkedIn' },
  { icon: Twitter, href: COMPANY.social.twitter, label: 'Twitter' },
].filter((s) => s.href && s.href !== '#');

const heading = 'mb-5 text-[11px] font-bold uppercase tracking-[0.3em] text-primary-300';
const link = 'text-[15px] text-white/70 transition-colors hover:text-white';

/** One block of the "Get in touch" band: gold icon, small-caps label, content. */
function TouchBlock({ icon: Icon, label, children }) {
  return (
    <div className="flex gap-5">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-primary-300/40 text-primary-300">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-primary-300">{label}</p>
        <div className="mt-3">{children}</div>
      </div>
    </div>
  );
}

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden bg-navy-950 text-white/70">
      <div aria-hidden className="bg-jaali pointer-events-none absolute inset-0 opacity-[0.05]" />

      <div className="container relative">
        {/* Wordmark band */}
        <div className="flex flex-col gap-8 border-b border-white/10 py-14 md:flex-row md:items-end md:justify-between md:py-20">
          <div className="flex items-end gap-5">
            <span className="block h-[3.4rem] w-14 shrink-0 overflow-hidden md:h-[4.2rem] md:w-[4.3rem]">
              <img src={logoImg} alt="" className="h-auto w-full" />
            </span>
            <p className="font-serif text-[2.6rem] leading-[0.95] text-white md:text-[4.5rem]">
              Sai Krishna
              <span className="mt-2 block font-sans text-[11px] font-bold uppercase tracking-[0.6em] text-primary-300 md:text-xs">
                Homes · Since {COMPANY.established}
              </span>
            </p>
          </div>
          <Link
            to={BOOK_VISIT}
            className="group inline-flex items-center gap-3 self-start border border-primary-300/60 px-7 py-4 text-[12px] font-bold uppercase tracking-[0.2em] text-primary-200 transition-colors hover:bg-primary-300 hover:text-navy-950 md:self-auto"
          >
            Book a site visit
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* Get in touch */}
        <div className="border-b border-white/10 py-14">
          <h2 className="font-serif text-3xl text-white md:text-4xl">
            Get in <em className="font-medium text-primary-300">touch</em>
          </h2>
          <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_1.6fr_1fr] lg:gap-12">
            <TouchBlock icon={MapPin} label="Our location">
              <p className="max-w-xs text-[15px] leading-[1.8] text-white/80">{COMPANY.address}</p>
              <a
                href={COMPANY.mapUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-2 py-1 text-[12px] font-bold uppercase tracking-[0.18em] text-primary-300 hover:text-primary-200"
              >
                Get directions <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </TouchBlock>

            <TouchBlock icon={Phone} label="Call us">
              <ul className="grid gap-4 sm:grid-cols-2">
                {LEADERSHIP.contacts.map((c) => (
                  <li key={c.name} className="flex flex-col border border-white/10 bg-white/[0.03] p-4">
                    <div className="mb-4 flex items-start gap-3">
                      <img src={c.photo} alt="" loading="lazy" className="h-12 w-12 shrink-0 rounded-full border-2 border-primary-300 object-cover object-top" />
                      <span className="min-w-0">
                        <span className="block font-serif text-lg leading-snug text-white">{c.name}</span>
                        <span className="mt-0.5 block text-[13px] leading-snug text-white/60">{c.role}</span>
                      </span>
                    </div>
                    <div className="mt-auto flex items-center justify-between gap-2 border-t border-white/10 pt-3">
                      <a href={`tel:+${c.phone}`} className="py-1 text-[15px] font-semibold tracking-wide text-white hover:text-primary-200">
                        {c.phoneDisplay}
                      </a>
                      <a
                        href={`https://wa.me/${c.phone}`}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`WhatsApp ${c.name}`}
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white/80 hover:border-primary-300 hover:text-primary-200"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            </TouchBlock>

            <TouchBlock icon={Mail} label="Email us">
              <a href={`mailto:${COMPANY.email}`} className="break-all py-1 text-[15px] text-white/80 hover:text-white">
                {COMPANY.email}
              </a>
              <p className="mt-5 flex items-center gap-2 text-[13px] text-white/50">
                <Clock className="h-4 w-4 text-primary-300" /> {COMPANY.workingHours}
              </p>
            </TouchBlock>
          </div>
        </div>

        {/* Links */}
        <div className="grid gap-12 py-14 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1.3fr]">
          <div>
            <p className={heading}>Explore</p>
            <ul className="space-y-3">
              {FOOTER_LINKS.explore.map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className={link}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className={heading}>Company</p>
            <ul className="space-y-3">
              {FOOTER_LINKS.company.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className={link}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className={heading}>Follow us</p>
            <p className="max-w-xs text-[15px] leading-[1.8]">
              Premium residences in Bhubaneswar since {COMPANY.established}. We shape the essence of living.
            </p>
            {SOCIALS.length > 0 && (
              <div className="mt-6 flex gap-2">
                {SOCIALS.map(({ icon: Icon, href, label }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={label}
                    className="flex h-11 w-11 items-center justify-center border border-white/15 text-white/70 transition-colors hover:border-primary-300 hover:text-primary-200"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-white/10 py-7 text-xs text-white/45 md:flex-row md:justify-between">
          <p>
            © {year} {COMPANY.name} All rights reserved.
          </p>
          {COMPANY.cin && <p>CIN: {COMPANY.cin}</p>}
        </div>
      </div>
    </footer>
  );
}
