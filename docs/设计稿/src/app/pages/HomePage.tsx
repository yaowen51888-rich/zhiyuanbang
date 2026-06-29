import { Hero } from "../components/Hero";
import { StatsBanner } from "../components/StatsBanner";
import { FeatureShowcase } from "../components/FeatureShowcase";
import { HowItWorks } from "../components/HowItWorks";
import { PopularMajors } from "../components/PopularMajors";
import { UniversityPreview } from "../components/UniversityPreview";
import { Testimonials } from "../components/Testimonials";
import { CTASection } from "../components/CTASection";

export function HomePage() {
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
