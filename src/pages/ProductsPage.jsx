import PageHero from '@/components/common/PageHero';
import CtaSection from '@/components/common/CtaSection';
import ProductTabs from '@/features/products/components/ProductTabs';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export default function ProductsPage() {
  useDocumentTitle('Our Products');
  return (
    <>
      <PageHero
        title="Our Products"
        subtitle="Organic agricultural inputs, fresh dairy products and reliable industrial supplies."
      />
      <section className="section">
        <div className="container">
          <ProductTabs />
        </div>
      </section>
      <CtaSection />
    </>
  );
}
