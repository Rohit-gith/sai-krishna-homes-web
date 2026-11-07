import { ArrowRight } from 'lucide-react';
import SectionHeading from '@/components/ui/SectionHeading';
import Button from '@/components/ui/Button';
import Reveal from '@/components/common/Reveal';
import { PRODUCT_GROUPS } from '@/data/products';
import { ROUTES } from '@/constants/routes';

export default function ProductsPreview() {
  return (
    <section className="section bg-gradient-to-b from-white to-primary-50/50">
      <div className="container">
        <SectionHeading
          eyebrow="Our products"
          title="Quality products, made with care"
          subtitle="From organic farm inputs to fresh dairy and industrial supplies."
        />
        <div className="grid gap-6 md:grid-cols-3">
          {PRODUCT_GROUPS.map(({ key, label, icon: Icon, description, color, items }, i) => (
            <Reveal key={key} delay={i * 0.1} className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white">
              <div className={`bg-gradient-to-br ${color} p-7 text-white`}>
                <Icon className="h-9 w-9" />
                <h3 className="mt-4 text-2xl font-bold text-white">{label}</h3>
                <p className="mt-1 text-sm text-white/85">{description}</p>
              </div>
              <ul className="flex flex-wrap gap-2 p-7">
                {items.map((item) => (
                  <li key={item.name} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-navy-900">
                    {item.name}
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>
        <div className="mt-12 text-center">
          <Button to={ROUTES.PRODUCTS} variant="outline" size="lg">
            Explore products <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
