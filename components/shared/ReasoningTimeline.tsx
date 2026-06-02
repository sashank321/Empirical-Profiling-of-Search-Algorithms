'use client'

import { useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface ReasoningStep {
  step: number
  node?: string
  action: string
  reason: string
  value?: number
}

interface ReasoningTimelineProps {
  steps: ReasoningStep[]
  currentStep?: number
  onStepClick?: (idx: number) => void
}

const stepVariants = {
  initial: { opacity: 0, x: 24, scale: 0.95 },
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] },
  },
  exit: {
    opacity: 0,
    x: -16,
    scale: 0.95,
    transition: { duration: 0.2 },
  },
}

export default function ReasoningTimeline({ steps, currentStep, onStepClick }: ReasoningTimelineProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        left: scrollRef.current.scrollWidth,
        behavior: 'smooth',
      })
    }
  }, [steps.length])

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-3 px-1">
        <div className="w-1.5 h-1.5 rounded-full bg-accent-blue animate-pulse-subtle" />
        <span className="text-xs font-medium tracking-wider uppercase text-text-secondary">
          Reasoning Trace
        </span>
        <span className="text-[10px] font-mono text-text-muted ml-auto">
          {steps.length} step{steps.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin"
        style={{ scrollbarWidth: 'thin' }}
      >
        <AnimatePresence mode="popLayout">
          {steps.map((step, idx) => (
            <motion.div
              key={`step-${step.step}`}
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              layout
              onClick={() => onStepClick?.(idx)}
              className={`flex-shrink-0 min-w-[240px] max-w-[280px] bg-surface-1 border-subtle rounded-xl p-4 transition-all duration-200 ${
                onStepClick ? 'cursor-pointer hover:bg-surface-2' : ''
              } ${
                currentStep === idx ? 'border-accent-blue shadow-lg shadow-accent-blue/5' : ''
              }`}
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-surface-3 text-xs font-mono text-text-secondary flex-shrink-0">
                  {step.step}
                </div>
                {step.node && (
                  <span className="text-[10px] font-mono text-accent-blue bg-accent-blue/10 px-2 py-0.5 rounded-full">
                    {step.node}
                  </span>
                )}
                {step.value !== undefined && (
                  <span className="text-[10px] font-mono text-accent-green ml-auto">
                    {typeof step.value === 'number' ? step.value.toFixed(1) : step.value}
                  </span>
                )}
              </div>

              <p className="text-white text-sm font-medium mb-1.5 leading-snug">
                {step.action}
              </p>
              <p className="text-text-tertiary text-xs leading-relaxed">
                {step.reason}
              </p>
            </motion.div>
          ))}
        </AnimatePresence>

        {steps.length === 0 && (
          <div className="flex items-center justify-center w-full min-h-[100px] text-text-muted text-xs tracking-wider uppercase">
            Waiting for execution…
          </div>
        )}
      </div>
    </div>
  )
}
