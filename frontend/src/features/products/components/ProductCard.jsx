import { MessageCircle } from 'lucide-react';
import { COMPANY } from '@/data/companyInfo';

export default function ProductCard({ item, group }) {
  const Icon = group.icon;
  const enquiry = encodeURIComponent(`Hello Sai Krishna Homes, I would like to enquire about ${item.name}.`);

  return (
    <div className="group flex flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-soft">
      {/* Image placeholder: replace with a real product photo */}
      <div className={`relative flex h-44 items-center justify-center bg-gradient-to-br ${group.color}`}>
        <Icon className="h-16 w-16 text-white/80 transition-transform duration-500 group-hover:scale-110" />
        <span className="absolute left-4 top-4 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
          {group.label}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-lg font-bold">{item.name}</h3>
        <p className="mt-1.5 flex-1 text-sm text-slate-600">{item.note}</p>
        <a
          href={`https://wa.me/${COMPANY.whatsapp}?text=${enquiry}`}
          target="_blank"
          rel="noreferrer"
          className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary-700 hover:text-primary-800"
        >
          <MessageCircle className="h-4 w-4" /> Enquire on WhatsApp
        </a>
      </div>
    </div>
  );
}
