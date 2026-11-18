import { ArrowRight } from 'lucide-react';
import SectionHeading from '@/components/ui/SectionHeading';
import Button from '@/components/ui/Button';
import Reveal from '@/components/common/Reveal';
import ServiceCard from '@/features/services/components/ServiceCard';
import { FEATURED_SERVICES } from '@/data/services';
import { ROUTES } from '@/constants/routes';

export default function ServicesPreview() {
  return (
    <section className="section">
      <div className="container">
        <SectionHeading
          eyebrow="What we do"
          title="Expert services for every stage of your journey"
          subtitle="From farm to factory, rooftop to courtroom, our specialists handle it end-to-end so you can focus on growing."
        />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURED_SERVICES.map((service, i) => (
            <Reveal key={service.slug} delay={i * 0.06}>
              <ServiceCard service={service} />
            </Reveal>
          ))}
        </div>
        <div className="mt-12 text-center">
          <Button to={ROUTES.SERVICES} variant="secondary" size="lg">
            View all services <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
