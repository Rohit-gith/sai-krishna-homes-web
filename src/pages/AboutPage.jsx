import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageCircle, Phone } from 'lucide-react';
import ChapterHeading from '@/features/home/components/ChapterHeading';
import Reveal from '@/components/common/Reveal';
import ParallaxImage from '@/components/common/ParallaxImage';
import CtaSection from '@/components/common/CtaSection';
import { COMPANY, LEADERSHIP } from '@/data/companyInfo';
import { PHOTOS, responsive } from '@/data/projects';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import LeaderCard from '@/components/common/LeaderCard';
import logoImg from '@/assets/logo/logo.png';
import { cn } from '@/utils/cn';

/* All copy below is taken verbatim from the client's existing website (About page). */

const MD_MESSAGE = [
  'At Sai Krishna Homes Pvt. Ltd., we believe every project is an opportunity to create lasting value. Our journey has been driven by an unwavering commitment to quality, health, safety, sustainability and excellence.',
  'We believe great achievements begin with great people. By fostering a culture built on trust, transparency, accountability, discipline and open communication, we empower our team to consistently deliver their best.',
  'As the real estate and construction landscape continues to evolve, we are strengthening our capabilities through experienced leadership, skilled professionals, advanced technology and state of the art equipment, preparing us to take on ambitious projects and emerging opportunities.',
  'We take pride in how far we have come, but our vision is always forward. With integrity as our foundation and excellence as our ambition, we remain committed to building better, creating lasting value and shaping a stronger future.',
];

const PILLARS = [
  {
    id: 'mission',
    label: 'Our Mission',
    intro:
      'Our mission is to create lasting value through smarter construction, innovative thinking and uncompromising quality. We continuously evolve with modern technologies, advanced materials and efficient building practices to deliver spaces that exceed expectations.',
    points: [
      ['Innovate & Evolve', 'Embrace next generation technologies, materials and construction methods to improve quality and efficiency.'],
      ['People Who Make A Difference', 'Empower a diverse, skilled and results driven team committed to excellence.'],
      ['Create Lasting Value', 'Transform every project into a benchmark of quality, functionality and customer satisfaction.'],
    ],
  },
  {
    id: 'vision',
    label: 'Our Vision',
    intro:
      'We envision becoming a trusted name in housing and construction, recognized nationally and globally for innovative design, advanced technology, uncompromising quality and exceptional craftsmanship.',
    points: [
      ['Lead With Excellence', 'Deliver world-class housing projects that go beyond national standards.'],
      ['Innovate For Tomorrow', 'Embrace modern technologies and progressive construction practices.'],
      ['Inspire Customer Trust', 'Create exceptional living spaces that turn quality, comfort and satisfaction into lasting relationships.'],
    ],
  },
  {
    id: 'values',
    label: 'Our Values',
    intro:
      'Our values shape everything we do from building lasting relationships through transparency and trust to creating safer more sustainable communities.',
    points: [
      ['Safety First', 'Foster a strong safety culture focused on minimizing risks and achieving zero accidents.'],
      ['Sustainability At Heart', 'Reduce our environmental impact and uphold the highest standards of responsible and sustainable construction.'],
      ['Integrity Always', 'Build with transparency, accountability and respect for our people and communities.'],
    ],
  },
];

function Pillars() {
  const [tab, setTab] = useState(0);
  const p = PILLARS[tab];
  return (
    <section className="section bg-ivory">
      <div className="container">
        <ChapterHeading numeral="III" label="What drives us" title="Mission, vision & values" />
        <div className="flex flex-wrap gap-x-8 gap-y-3 border-b border-navy-900/10" role="tablist" aria-label="Mission, vision and values">
          {PILLARS.map((x, i) => (
            <button
              key={x.id}
              type="button"
              role="tab"
              aria-selected={tab === i}
              onClick={() => setTab(i)}
              className={cn(
                '-mb-px border-b-2 py-3 font-serif text-xl transition-colors md:text-2xl',
                tab === i ? 'border-primary-500 text-navy-950' : 'border-transparent text-navy-900/45 hover:text-navy-950',
              )}
            >
              {x.label}
            </button>
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.35 }}
            className="grid gap-10 pt-10 lg:grid-cols-[1fr_1.3fr] lg:gap-16"
          >
            <p className="font-serif text-[1.45rem] leading-[1.5] text-navy-950 md:text-[1.7rem]">{p.intro}</p>
            <ol className="border-t border-navy-900/10">
              {p.points.map(([t, d], i) => (
                <li key={t} className="grid grid-cols-[3rem_1fr] gap-3 border-b border-navy-900/10 py-6">
                  <span className="font-serif text-xl italic text-primary-500">{['i', 'ii', 'iii'][i]}.</span>
                  <span>
                    <span className="block font-serif text-xl font-semibold text-navy-950">{t}</span>
                    <span className="mt-1.5 block text-[15.5px] leading-[1.8] text-slate-600">{d}</span>
                  </span>
                </li>
              ))}
            </ol>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

export default function AboutPage() {
  useDocumentTitle('About Us');
  const { md, contacts } = LEADERSHIP;

  return (
    <>
      {/* Header */}
      <section className="bg-ivory pt-16 md:pt-[5.75rem]">
        <div className="container grid gap-10 pb-16 pt-12 md:pb-20 md:pt-16 lg:grid-cols-[1.1fr_1fr] lg:items-end">
          <Reveal>
            <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-primary-700">
              <Link to="/" className="-my-3 py-3 hover:text-navy-950">Home</Link> <span className="px-1.5">/</span> About us
            </p>
            <h1 className="mt-6 text-[2.8rem] font-semibold leading-[1.04] text-navy-950 sm:text-[4rem] xl:text-[4.6rem]">
              Building spaces that add <em className="text-gold-rich font-medium">lasting value.</em>
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <ParallaxImage img={responsive(PHOTOS.pwDay, '(min-width: 1024px) 45vw, 100vw')} className="aspect-[16/10]" />
          </Reveal>
        </div>
      </section>

      {/* I. Who we are */}
      <section className="section bg-white">
        <div className="container">
          <ChapterHeading numeral="I" label="Who we are" title={COMPANY.name} />
          <div className="grid gap-12 lg:grid-cols-[1.3fr_1fr] lg:gap-20">
            <Reveal>
              <p className="font-serif text-[1.5rem] leading-[1.5] text-navy-950 md:text-[1.9rem]">
                Established in {COMPANY.established} to provide elite services in real estate and building development.
              </p>
              <p className="mt-6 text-[16px] leading-[1.85] text-slate-600">
                Our vision and business are inextricably linked, focusing on infrastructure improvements that consistently
                exceed expectations. We are chosen for our innovative solutions, our commitment to reducing environmental
                impact, and our dedication to safe working practices. Our values and commitments set us remarkably apart.
              </p>
            </Reveal>
            <Reveal delay={0.1} className="grid grid-cols-2 gap-px self-start border border-navy-900/10 bg-navy-900/10">
              {[
                [COMPANY.established, 'Established'],
                ['500+', 'Homes in the township'],
                ['6 acres', 'Gated community'],
                ['2', 'Signature projects'],
              ].map(([v, l]) => (
                <div key={l} className="bg-white p-6">
                  <p className="font-serif text-4xl font-semibold text-navy-950">{v}</p>
                  <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">{l}</p>
                </div>
              ))}
            </Reveal>
          </div>
        </div>
      </section>

      {/* II. A letter from the Managing Director */}
      <section id="md-letter" className="section relative scroll-mt-28 overflow-hidden bg-ivory">
        <div aria-hidden className="bg-jaali pointer-events-none absolute -left-24 top-0 h-full w-[26rem] opacity-[0.07]" />
        <div className="container relative">
          <div className="grid gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
            {/* Portrait */}
            <Reveal className="relative mx-auto w-full max-w-md lg:sticky lg:top-28 lg:self-start">
              <div className="relative border border-primary-400/70 p-2.5">
                <div className="border border-primary-300/60 p-2">
                  <ParallaxImage
                    img={{ src: md.photo, alt: `${md.name}, ${md.role}, ${COMPANY.name}` }}
                    strength={5}
                    className="aspect-[4/5]"
                    imgClassName="object-[41%_center]"
                  />
                </div>
                {/* Name plate overlapping the frame */}
                <div className="absolute -bottom-7 left-6 right-6 bg-navy-950 px-6 py-4 text-center shadow-[0_24px_50px_-20px_rgba(8,38,32,0.7)]">
                  <span className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-primary-300 to-transparent" />
                  <p className="font-serif text-xl text-white">{md.name}</p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.35em] text-primary-300">{md.role}</p>
                </div>
              </div>
              <div className="absolute -right-3 top-10 hidden flex-col items-center bg-primary-500 px-4 py-5 text-navy-950 shadow-xl sm:flex lg:-right-8">
                <span className="font-serif text-3xl font-semibold leading-none">{new Date().getFullYear() - Number(COMPANY.established)}+</span>
                <span className="mt-1.5 text-[9.5px] font-bold uppercase leading-tight tracking-[0.2em]">Years of
                  <br />
                  building</span>
              </div>
            </Reveal>

            {/* Letter */}
            <Reveal delay={0.1} className="pt-6 lg:pt-0">
              <p className="flex items-center gap-4 text-[11px] font-bold uppercase tracking-[0.35em] text-primary-700">
                <span className="text-outline-gold font-serif text-5xl normal-case tracking-normal">II</span>
                A letter from our Managing Director
              </p>
              <h2 className="mt-6 text-[2.2rem] font-medium italic leading-[1.15] text-navy-950 md:text-[3.1rem]">
                “Every project is an opportunity to create <span className="text-gold-rich not-italic font-semibold">lasting value.</span>”
              </h2>

              <div className="mt-10 border-t border-navy-900/10 pt-10 text-[16.5px] leading-[1.9] text-slate-600">
                <p className="first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:font-serif first-letter:text-[4.6rem] first-letter:leading-[0.8] first-letter:text-primary-600">
                  {MD_MESSAGE[0]}
                </p>
                <p className="mt-6">{MD_MESSAGE[1]}</p>

                <blockquote className="my-10 border-l-2 border-primary-500 bg-white px-7 py-6 shadow-[0_20px_50px_-30px_rgba(8,38,32,0.35)]">
                  <p className="font-serif text-[1.45rem] italic leading-[1.45] text-navy-950 md:text-[1.7rem]">
                    With integrity as our foundation and excellence as our ambition.
                  </p>
                </blockquote>

                <p>{MD_MESSAGE[2]}</p>
                <p className="mt-6">{MD_MESSAGE[3]}</p>
              </div>

              {/* Signature */}
              <div className="mt-12 flex items-end justify-between gap-6 border-t border-navy-900/10 pt-8">
                <div>
                  <p className="font-script text-[2.6rem] leading-none text-primary-600 md:text-5xl">{md.name}</p>
                  <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.3em] text-navy-900/60">
                    {md.role} · {COMPANY.name}
                  </p>
                </div>
                <span aria-hidden className="hidden h-16 w-14 shrink-0 overflow-hidden opacity-80 sm:block">
                  <img src={logoImg} alt="" className="h-auto w-full" />
                </span>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <Pillars />

      {/* IV. Leadership: one standard card size for every leader */}
      <section className="section bg-white">
        <div className="container">
          <ChapterHeading
            numeral="IV"
            label="Our leadership"
            title="The people behind your home"
            intro="Questions about a project, a site visit or pricing? Call or WhatsApp our leadership directly."
          />
          <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Reveal>
              <LeaderCard
                person={md}
                footer={
                  <a
                    href="#md-letter"
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById('md-letter')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="flex w-full items-center justify-center gap-2 bg-ivory px-3 py-3 text-[12px] font-bold uppercase tracking-[0.15em] text-navy-950 hover:bg-primary-100"
                  >
                    Read the MD&apos;s message
                  </a>
                }
              />
            </Reveal>
            {contacts.map((c, i) => (
              <Reveal key={c.name} delay={(i + 1) * 0.08}>
                <LeaderCard person={c} actions />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <CtaSection />
    </>
  );
}
