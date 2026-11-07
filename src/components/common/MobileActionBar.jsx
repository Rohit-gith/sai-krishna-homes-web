import { Link } from 'react-router-dom';
import { CalendarCheck, MessageCircle, Phone } from 'lucide-react';
import { COMPANY } from '@/data/companyInfo';
import { BOOK_VISIT } from '@/constants/navLinks';
import { whatsappLink } from '@/utils/whatsapp';

/** Always-visible Call · WhatsApp · Book visit bar on phones (replaces the floating WhatsApp bubble there). */
export default function MobileActionBar() {
  const item = 'flex flex-1 flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-bold uppercase tracking-[0.14em]';
  return (
    <>
      <nav
        aria-label="Quick actions"
        className="fixed inset-x-0 bottom-0 z-40 flex border-t border-primary-200 bg-ivory/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
      >
        <a href={`tel:${COMPANY.phone}`} className={`${item} text-navy-900`}>
          <Phone className="h-5 w-5 text-primary-600" /> Call
        </a>
        <a
          href={whatsappLink('Hello Sai Krishna Homes, I would like to know more about your projects.')}
          target="_blank"
          rel="noreferrer"
          className={`${item} border-x border-primary-200 text-navy-900`}
        >
          <MessageCircle className="h-5 w-5 text-[#1fa855]" /> WhatsApp
        </a>
        <Link to={BOOK_VISIT} className={`${item} bg-navy-900 text-white`}>
          <CalendarCheck className="h-5 w-5 text-primary-300" /> Book visit
        </Link>
      </nav>
      {/* Spacer so the bar never covers the end of the page */}
      <div aria-hidden className="h-16 lg:hidden" />
    </>
  );
}
