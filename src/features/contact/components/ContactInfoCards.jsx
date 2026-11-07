import { Phone, Mail, MessageCircle, Clock } from 'lucide-react';
import { COMPANY } from '@/data/companyInfo';

const CARDS = [
  { icon: Phone, title: 'Call us', value: COMPANY.phoneDisplay, href: `tel:${COMPANY.phone}` },
  { icon: MessageCircle, title: 'WhatsApp', value: 'Chat instantly', href: `https://wa.me/${COMPANY.whatsapp}` },
  { icon: Mail, title: 'Email us', value: COMPANY.email, href: `mailto:${COMPANY.email}` },
  { icon: Clock, title: 'Working hours', value: COMPANY.workingHours },
];

export default function ContactInfoCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
      {CARDS.map(({ icon: Icon, title, value, href }) => {
        const Tag = href ? 'a' : 'div';
        return (
          <Tag
            key={title}
            {...(href && { href, ...(href.startsWith('http') && { target: '_blank', rel: 'noreferrer' }) })}
            className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:border-primary-200 hover:shadow-soft"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600 transition-colors group-hover:bg-primary-600 group-hover:text-white">
              <Icon className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block text-xs text-slate-500">{title}</span>
              <span className="block break-all font-semibold text-navy-950">{value}</span>
            </span>
          </Tag>
        );
      })}
    </div>
  );
}
