import { HeroSection } from "@/components/sections/HeroSection";
import { ValueHighlights } from "@/components/sections/ValueHighlights";
import { FeaturesSection } from "@/components/sections/FeaturesSection";
import { HowItWorksSection } from "@/components/sections/HowItWorksSection";
import { RoleBenefitsSection } from "@/components/sections/RoleBenefitsSection";
import { SecuritySection } from "@/components/sections/SecuritySection";
import { CTASection } from "@/components/sections/CTASection";

export function LandingPage() {
  return (
    <>
      <HeroSection />
      <ValueHighlights />
      <FeaturesSection />
      <HowItWorksSection />
      <RoleBenefitsSection />
      <SecuritySection />
      <CTASection />
    </>
  );
}
