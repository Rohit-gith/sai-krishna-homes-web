import { useState } from 'react';
import IntroCurtain from '@/components/common/IntroCurtain';
import TrailerIntro, { firstVisit } from '@/features/welcome/TrailerIntro';
import HomeFinder from '@/features/welcome/HomeFinder';
import { HookLine, JourneyRail, Reveal } from '@/features/welcome/ScrollStory';
import HeroSection from '@/features/home/components/HeroSection';
import BrandStatement from '@/features/home/components/BrandStatement';
import ProjectsShowcase from '@/features/home/components/ProjectsShowcase';
import DayNightSlider from '@/features/home/components/DayNightSlider';
import AmenitiesSection from '@/features/home/components/AmenitiesSection';
import MasterplanSection from '@/features/home/components/MasterplanSection';
import WhyChooseUs from '@/features/home/components/WhyChooseUs';
import TestimonialsSection from '@/features/home/components/TestimonialsSection';
import ComparisonSection from '@/features/home/components/ComparisonSection';
import ExploreStrip from '@/features/explore/ExploreStrip';
import CtaSection from '@/components/common/CtaSection';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

// stops of the scroll "journey" rail (ids of the sections below)
const STOPS = [
  { id: 'hp-welcome', label: 'Welcome' },
  { id: 'hp-find', label: 'Find your home' },
  { id: 'hp-homes', label: 'Our homes' },
  { id: 'hp-life', label: 'Life & amenities' },
  { id: 'hp-plan', label: 'Masterplan' },
  { id: 'hp-trust', label: 'Why us' },
  { id: 'hp-price', label: 'Price & places' },
  { id: 'hp-visit', label: 'Book a visit' },
];

/**
 * Home: a first-visit trailer (once per browser; returning visitors get the short logo curtain),
 * "find your home in 3 taps", and a scroll story that links the sections.
 * Deeper content lives in the Explore chapters (/explore/:slug).
 */
export default function HomePage() {
  useDocumentTitle('');
  // decided once on arrival, before the trailer marks itself as seen
  const [newVisitor] = useState(firstVisit);
  return (
    <>
      {newVisitor ? <TrailerIntro /> : <IntroCurtain />}
      <JourneyRail stops={STOPS} />

      <div id="hp-welcome">
        <HeroSection />
      </div>
      <div id="hp-find">
        <HomeFinder />
      </div>
      <HookLine emoji="🏡">Now meet the homes waiting for you.</HookLine>
      <Reveal>
        <BrandStatement />
      </Reveal>
      <Reveal id="hp-homes">
        <ProjectsShowcase />
      </Reveal>
      <HookLine emoji="🌙">Same home, by day and by night. Slide to see.</HookLine>
      <Reveal>
        <DayNightSlider />
      </Reveal>
      <Reveal id="hp-life">
        <AmenitiesSection />
      </Reveal>
      <HookLine emoji="🗺️">Where will your home be? Tap the plan.</HookLine>
      <Reveal id="hp-plan">
        <MasterplanSection numeral="III" />
      </Reveal>
      <Reveal id="hp-trust">
        <WhyChooseUs numeral="IV" />
      </Reveal>
      <Reveal>
        <TestimonialsSection numeral="V" />
      </Reveal>
      <HookLine emoji="💰">Now the big question: how much, and how close is everything?</HookLine>
      <Reveal id="hp-price">
        <ComparisonSection numeral="VI" />
      </Reveal>
      <Reveal>
        <ExploreStrip numeral="VII" />
      </Reveal>
      <HookLine emoji="🔑">Your keys could be one visit away.</HookLine>
      <div id="hp-visit">
        <CtaSection />
      </div>
    </>
  );
}
