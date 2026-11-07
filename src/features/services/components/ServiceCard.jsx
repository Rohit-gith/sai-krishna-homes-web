import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { serviceDetailPath } from '@/constants/routes';

export default function ServiceCard({ service }) {
  const Icon = service.icon;
  return (
    <Link
      to={serviceDetailPath(service.slug)}
      className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:border-primary-200 hover:shadow-soft"
    >
      <span className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary-50 transition-transform duration-500 group-hover:scale-[2.2]" />
      <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-600 text-white shadow-lg shadow-primary-600/25 transition-transform duration-300 group-hover:rotate-6">
        <Icon className="h-6 w-6" />
      </span>
      <h3 className="relative mt-6 text-lg font-bold">{service.title}</h3>
      <p className="relative mt-2 flex-1 text-sm leading-relaxed text-slate-600">{service.short}</p>
      <span className="relative mt-6 inline-flex items-center gap-1 text-sm font-semibold text-primary-700">
        Learn more
        <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}
