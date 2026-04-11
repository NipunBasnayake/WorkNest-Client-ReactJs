import { HeroSection } from "@/components/sections/HeroSection";
import { ValueHighlights } from "@/components/sections/ValueHighlights";
import { FeaturesSection } from "@/components/sections/FeaturesSection";
import { HowItWorksSection } from "@/components/sections/HowItWorksSection";
import { RoleBenefitsSection } from "@/components/sections/RoleBenefitsSection";
import { SecuritySection } from "@/components/sections/SecuritySection";
import { CTASection } from "@/components/sections/CTASection";
import { usePageMeta } from "@/hooks/usePageMeta";

export function LandingPage() {
  usePageMeta({ title: "WorkNest" });

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
