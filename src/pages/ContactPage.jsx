import PageHero from '@/components/common/PageHero';
import Reveal from '@/components/common/Reveal';
import ContactForm from '@/features/contact/components/ContactForm';
import ContactInfoCards from '@/features/contact/components/ContactInfoCards';
import FaqSection from '@/features/home/components/FaqSection';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export default function ContactPage() {
  useDocumentTitle('Contact Us');
  return (
    <>
      <PageHero title="Contact Us" subtitle="Have a question or need a service? We'd love to hear from you." />
      <section className="section">
        <div className="container grid gap-10 lg:grid-cols-[1.5fr_1fr]">
          <Reveal className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft md:p-10">
            <h2 className="text-2xl font-bold">Send us a message</h2>
            <p className="mb-8 mt-1 text-slate-500">We usually respond within one working day.</p>
            <ContactForm />
          </Reveal>
          <Reveal delay={0.1}>
            <ContactInfoCards />
          </Reveal>
        </div>
      </section>
      {/* TODO: add <MapEmbed /> here once the office address is finalised */}
      <FaqSection />
    </>
  );
}
