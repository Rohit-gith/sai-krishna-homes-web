import IntroCurtain from '@/components/common/IntroCurtain';
import HeroSection from '@/features/home/components/HeroSection';
import BrandStatement from '@/features/home/components/BrandStatement';
import ProjectsShowcase from '@/features/home/components/ProjectsShowcase';
import DayNightSlider from '@/features/home/components/DayNightSlider';
import AmenitiesSection from '@/features/home/components/AmenitiesSection';
import MasterplanSection from '@/features/home/components/MasterplanSection';
import WhyChooseUs from '@/features/home/components/WhyChooseUs';
import TestimonialsSection from '@/features/home/components/TestimonialsSection';
import EmiCalculator from '@/features/home/components/EmiCalculator';
import ExploreStrip from '@/features/explore/ExploreStrip';
import CtaSection from '@/components/common/CtaSection';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

/** Kept short on purpose: deeper content lives in the Explore chapters (/explore/:slug). */
export default function HomePage() {
  useDocumentTitle('');
  return (
    <>
      <IntroCurtain />
      <HeroSection />
      <BrandStatement />
      <ProjectsShowcase />
      <DayNightSlider />
      <AmenitiesSection />
      <MasterplanSection numeral="III" />
      <WhyChooseUs numeral="IV" />
      <TestimonialsSection numeral="V" />
      <EmiCalculator numeral="VI" />
      <ExploreStrip numeral="VII" />
      <CtaSection />
    </>
  );
}
