import { CtaSection } from '@/components/sections/CtaSection'
import { FeaturesSection } from '@/components/sections/FeaturesSection'
import { HeroSection } from '@/components/sections/HeroSection'
import { HowItWorksSection } from '@/components/sections/HowItWorksSection'
import { ModulesSection } from '@/components/sections/ModulesSection'
import { RoleBenefitsSection } from '@/components/sections/RoleBenefitsSection'
import { SecuritySection } from '@/components/sections/SecuritySection'
import { ValueHighlightsStrip } from '@/components/sections/ValueHighlightsStrip'

export function LandingPage() {
  return (
    <>
      <HeroSection />
      <ValueHighlightsStrip />
      <FeaturesSection />
      <ModulesSection />
      <HowItWorksSection />
      <RoleBenefitsSection />
      <SecuritySection />
      <CtaSection />
    </>
  )
}
