import { Navigate, useParams } from 'react-router-dom';
import { CheckCircle2, ArrowRight, Phone } from 'lucide-react';
import PageHero from '@/components/common/PageHero';
import Reveal from '@/components/common/Reveal';
import Button from '@/components/ui/Button';
import ServiceCard from '@/features/services/components/ServiceCard';
import { SERVICES, getServiceBySlug } from '@/data/services';
import { ROUTES } from '@/constants/routes';
import { COMPANY } from '@/data/companyInfo';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export default function ServiceDetailPage() {
  const { slug } = useParams();
  const service = getServiceBySlug(slug);
  useDocumentTitle(service?.title);

  if (!service) return <Navigate to={ROUTES.SERVICES} replace />;

  const Icon = service.icon;
  const related = SERVICES.filter((s) => s.category === service.category && s.slug !== service.slug).slice(0, 3);

  return (
    <>
      <PageHero title={service.title} subtitle={service.short} breadcrumb="Services" />

      <section className="section">
        <div className="container grid gap-10 lg:grid-cols-[1.6fr_1fr]">
          <Reveal>
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-600 text-white shadow-lg shadow-primary-600/25">
              <Icon className="h-8 w-8" />
            </span>
            <h2 className="mt-6 text-3xl font-bold">What's included</h2>
            <p className="mt-3 text-slate-600">
              Our team handles {service.title.toLowerCase()} end-to-end, from understanding your requirement
              to final delivery, with complete transparency at every step.
            </p>
            <ul className="mt-8 grid gap-4 sm:grid-cols-2">
              {service.points.map((p) => (
                <li key={p} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary-600" />
                  <span className="font-medium text-navy-950">{p}</span>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={0.1}>
            <aside className="sticky top-28 rounded-3xl bg-navy-950 p-8 text-white">
              <h3 className="text-xl font-bold text-white">Interested in this service?</h3>
              <p className="mt-2 text-sm text-slate-400">Register online and our expert will contact you within 24 hours.</p>
              <Button to={`${ROUTES.REGISTER}?service=${service.slug}`} className="mt-6 w-full">
                Apply Now <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                href={`tel:${COMPANY.phone}`}
                variant="outline"
                className="mt-3 w-full border-white/20 bg-transparent text-white hover:border-white hover:bg-white/10 hover:text-white"
              >
                <Phone className="h-4 w-4" /> Call {COMPANY.phoneDisplay}
              </Button>
            </aside>
          </Reveal>
        </div>
      </section>

      {related.length > 0 && (
        <section className="section bg-slate-50/70">
          <div className="container">
            <h2 className="mb-8 text-2xl font-bold">Related services</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((s) => (
                <ServiceCard key={s.slug} service={s} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
