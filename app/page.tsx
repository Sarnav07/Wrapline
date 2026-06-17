import { Nav } from "@/components/landing/Nav";
import { Hero } from "@/components/landing/Hero";
import { TransparentPlatform } from "@/components/landing/TransparentPlatform";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { RegulatedExecution } from "@/components/landing/RegulatedExecution";
import { FeatureCards } from "@/components/landing/FeatureCards";
import { FullyUnderControl } from "@/components/landing/FullyUnderControl";
import { InfrastructureGlobe } from "@/components/landing/InfrastructureGlobe";
import { Faq } from "@/components/landing/Faq";
import { FinalCta } from "@/components/landing/FinalCta";
import { Footer } from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <>
      <Nav />
      <main className="bg-bg-dark">
        <Hero />
        <TransparentPlatform />
        <HowItWorks />
        <RegulatedExecution />
        <FeatureCards />
        <FullyUnderControl />
        <InfrastructureGlobe />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
