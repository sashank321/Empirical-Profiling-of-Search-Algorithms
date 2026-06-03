import Link from 'next/link'

export default function FooterSection() {
  return (
    <footer className="bg-surface-0 border-t border-subtle pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-16">
          <div>
            <div className="text-xl font-medium tracking-tight text-white mb-2">
              <span className="tracking-[0.2em] uppercase">CORTEX</span>{' '}
              <span className="text-text-secondary font-light">AI</span>
            </div>
            <p className="text-sm text-text-tertiary">
              Interactive Search & Reasoning Intelligence Platform
            </p>
          </div>
          
          <div className="flex flex-wrap gap-6 text-sm font-medium">
            <Link href="/search" className="text-text-secondary hover:text-white transition-colors">Search Lab</Link>
            <Link href="/constraints" className="text-text-secondary hover:text-white transition-colors">Constraints Lab</Link>
            <Link href="/decisions" className="text-text-secondary hover:text-white transition-colors">Decisions Lab</Link>
            <Link href="/uncertainty" className="text-text-secondary hover:text-white transition-colors">Uncertainty Lab</Link>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-subtle text-xs text-text-tertiary">
          <p>© 2026 Empirical Profiling of Search Algorithms.</p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <span>Next.js 14</span>
            <span>·</span>
            <span>TypeScript</span>
            <span>·</span>
            <span>Three.js</span>
          </div>
        </div>
        
      </div>
    </footer>
  )
}
