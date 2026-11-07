import { Phone, Mail, Clock } from 'lucide-react';
import { COMPANY } from '@/data/companyInfo';

/** Thin strip above the navbar with contact info (hidden on mobile). */
export default function TopBar() {
  return (
    <div className="hidden bg-navy-950 text-xs text-slate-300 md:block">
      <div className="container flex h-10 items-center justify-between">
        <div className="flex items-center gap-6">
          <a href={`tel:${COMPANY.phone}`} className="flex items-center gap-1.5 hover:text-white">
            <Phone className="h-3.5 w-3.5 text-primary-400" /> {COMPANY.phoneDisplay}
          </a>
          <a href={`mailto:${COMPANY.email}`} className="flex items-center gap-1.5 hover:text-white">
            <Mail className="h-3.5 w-3.5 text-primary-400" /> {COMPANY.email}
          </a>
        </div>
        <span className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-primary-400" /> {COMPANY.workingHours}
        </span>
      </div>
    </div>
  );
}
