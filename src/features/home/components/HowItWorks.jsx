import { ClipboardList, UploadCloud, BadgeCheck, Rocket } from 'lucide-react';
import SectionHeading from '@/components/ui/SectionHeading';
import Reveal from '@/components/common/Reveal';

const STEPS = [
  { icon: ClipboardList, title: 'Register online', text: 'Choose your service and fill a simple 4-step form.' },
  { icon: UploadCloud, title: 'Upload documents', text: 'Securely upload ID and address proof from any device.' },
  { icon: BadgeCheck, title: 'Get verified', text: 'Our team verifies details and assigns an expert.' },
  { icon: Rocket, title: 'Service delivered', text: 'Track progress live until your work is completed.' },
];

export default function HowItWorks() {
  return (
    <section className="section relative overflow-hidden bg-navy-950">
      <div className="absolute inset-0 bg-grid-pattern bg-[size:48px_48px] opacity-30 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
      <div className="container relative">
        <SectionHeading
          light
          eyebrow="How it works"
          title="Four simple steps to get things done"
          subtitle="No running between offices. Start online and track every stage in real time."
        />
        <div className="relative grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="absolute left-0 right-0 top-8 hidden h-px bg-gradient-to-r from-transparent via-primary-500/50 to-transparent lg:block" />
          {STEPS.map(({ icon: Icon, title, text }, i) => (
            <Reveal key={title} delay={i * 0.1} className="relative text-center">
              <span className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-primary-500/30 bg-navy-900 text-primary-400">
                <Icon className="h-7 w-7" />
                <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary-500 text-xs font-bold text-white">
                  {i + 1}
                </span>
              </span>
              <h3 className="mt-6 text-lg font-semibold text-white">{title}</h3>
              <p className="mx-auto mt-2 max-w-xs text-sm text-slate-400">{text}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
