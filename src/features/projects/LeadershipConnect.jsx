import { Link } from 'react-router-dom';
import { ArrowUpRight, Footprints, MessageCircle, Phone, Timer } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import LeaderCard from '@/components/common/LeaderCard';
import Reveal from '@/components/common/Reveal';

/** "Direct Leadership Connect": the standard leader card beside the message and call / WhatsApp actions. */
export default function LeadershipConnect({ project }) {
  const c = project.contact;
  const first = c.name.split(' ')[0];

  return (
    <Reveal className="grid gap-px bg-navy-900/10 shadow-[0_40px_90px_-45px_rgba(8,38,32,0.55)] sm:grid-cols-[17rem_1fr] xl:grid-cols-[18.5rem_1fr]">
      <LeaderCard person={c} fill className="h-full shadow-none" />

      <div className="flex flex-col bg-white p-6 sm:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-primary-700">Direct Leadership Connect</p>
        <p className="mt-3 font-serif text-[1.6rem] leading-snug text-navy-950">Speak directly with {first}</p>
        <p className="mt-3 text-[15px] leading-[1.75] text-slate-600">{project.connectText}</p>
        <ul className="mt-5 flex flex-wrap gap-2 text-[11.5px] font-bold uppercase tracking-[0.12em] text-navy-900">
          <li className="flex items-center gap-1.5 bg-ivory px-3 py-2"><Timer className="h-4 w-4 text-primary-600" /> Instant Response</li>
          <li className="flex items-center gap-1.5 bg-ivory px-3 py-2"><Footprints className="h-4 w-4 text-primary-600" /> Guided Site Visit</li>
        </ul>
        <div className="mt-auto grid gap-3 pt-7">
          {/* no personal numbers here: both lead to the Contact page */}
          <Link
            to={ROUTES.CONTACT}
            aria-label={`Contact ${first} through the Contact page`}
            className="group flex items-center gap-3 bg-navy-900 px-5 py-4 text-white hover:bg-navy-800"
          >
            <Phone className="h-5 w-5 text-primary-300" />
            <span className="flex-1">
              <span className="block text-[10px] font-bold uppercase tracking-[0.22em] text-white/60">Direct Call</span>
              <span className="block text-[15px] font-bold tracking-wide">Get in touch</span>
            </span>
            <ArrowUpRight className="h-5 w-5 text-primary-300 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
          <Link
            to={ROUTES.CONTACT}
            aria-label={`Message ${first} through the Contact page`}
            className="group flex items-center gap-3 border border-navy-900/15 px-5 py-4 hover:border-primary-400"
          >
            <MessageCircle className="h-5 w-5 text-[#1fa855]" />
            <span className="flex-1">
              <span className="block text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">Instant Chat</span>
              <span className="block text-[15px] font-bold text-navy-950">Message us</span>
            </span>
            <ArrowUpRight className="h-5 w-5 text-primary-600 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </Reveal>
  );
}
