'use client'

import { motion } from 'framer-motion'

interface ModeToggleProps {
  mode: 'academic' | 'industry'
  onModeChange: (mode: 'academic' | 'industry') => void
}

const modes = [
  { key: 'academic' as const, label: 'Academic' },
  { key: 'industry' as const, label: 'Industry' },
]

export default function ModeToggle({ mode, onModeChange }: ModeToggleProps) {
  return (
    <div className="flex items-center bg-surface-2 rounded-full p-0.5 border border-[rgba(255,255,255,0.06)]">
      {modes.map(({ key, label }) => {
        const isActive = mode === key
        return (
          <button
            key={key}
            onClick={() => onModeChange(key)}
            className="relative px-3 py-1 text-[11px] font-medium tracking-wider uppercase rounded-full transition-colors duration-200"
          >
            {isActive && (
              <motion.div
                layoutId="mode-indicator"
                className={`absolute inset-0 rounded-full ${
                  key === 'academic'
                    ? 'bg-accent-blue/15 shadow-[0_0_12px_rgba(59,130,246,0.15)]'
                    : 'bg-accent-green/15 shadow-[0_0_12px_rgba(34,197,94,0.15)]'
                }`}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span
              className={`relative z-10 ${
                isActive ? 'text-white' : 'text-text-tertiary'
              }`}
            >
              {label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
