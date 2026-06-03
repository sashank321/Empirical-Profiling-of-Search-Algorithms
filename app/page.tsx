import CursorSpotlight from '@/components/landing/CursorSpotlight'
import SmoothScroll from '@/components/landing/SmoothScroll'
import HeroSection from '@/components/landing/HeroSection'
import ShowcaseSection from '@/components/landing/ShowcaseSection'
import ComparisonSection from '@/components/landing/ComparisonSection'
import ArchitectureSection from '@/components/landing/ArchitectureSection'
import FeaturesGrid from '@/components/landing/FeaturesGrid'
import FooterSection from '@/components/landing/FooterSection'

export default function HomePage() {
  return (
    <SmoothScroll>
      <div className="relative min-h-screen bg-surface-0 selection:bg-accent-blue/30 selection:text-white">
        <CursorSpotlight />
        
        <main className="flex flex-col">
          <HeroSection />
          <ShowcaseSection />
          <ComparisonSection />
          <ArchitectureSection />
          <FeaturesGrid />
        </main>
        
        <FooterSection />
      </div>
    </SmoothScroll>
  )
}
