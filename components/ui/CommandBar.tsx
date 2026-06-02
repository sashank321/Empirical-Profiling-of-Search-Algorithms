'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface CommandBarProps {
  module: string
  subtitle?: string
  children?: React.ReactNode
}

export default function CommandBar({ module, subtitle, children }: CommandBarProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-surface-0/80 backdrop-blur-xl border-b border-subtle">
      <div className="flex items-center justify-between h-full px-6 max-w-screen-2xl mx-auto">
        {/* Left: Brand */}
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold tracking-[0.2em] text-white">
            CORTEX
          </span>
          <span className="text-sm font-light tracking-[0.2em] text-text-secondary">
            AI
          </span>
        </div>

        {/* Center: Module Name + Children */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3">
          <span className="text-xs font-medium tracking-wider uppercase text-text-secondary">
            {module} {subtitle && <span className="text-text-tertiary">/ {subtitle}</span>}
          </span>
          {children}
        </div>

        {/* Right: Back to Home */}
        <Link
          href="/"
          className="flex items-center gap-2 text-text-tertiary text-xs font-medium tracking-wider uppercase transition-all duration-200 ease hover:text-white"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Home</span>
        </Link>
      </div>
    </header>
  )
}
