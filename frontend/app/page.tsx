import { Hero } from "./sections/Hero";
import { StatsBanner } from "./sections/StatsBanner";
import { FeatureShowcase } from "./sections/FeatureShowcase";
import { HowItWorks } from "./sections/HowItWorks";
import { PopularMajors } from "./sections/PopularMajors";
import { UniversityPreview } from "./sections/UniversityPreview";
import { Testimonials } from "./sections/Testimonials";
import { CTASection } from "./sections/CTASection";

export default function Home() {
  return (
    <>
      <Hero />
      <StatsBanner />
      <FeatureShowcase />
      <HowItWorks />
      <PopularMajors />
      <UniversityPreview />
      <Testimonials />
      <CTASection />
    </>
  );
}
