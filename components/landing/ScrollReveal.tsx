'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

interface ScrollRevealProps {
  children: React.ReactNode
  direction?: 'up' | 'down' | 'left' | 'right' | 'fade'
  delay?: number
  duration?: number
  className?: string
  width?: 'fit-content' | '100%'
}

export default function ScrollReveal({
  children,
  direction = 'up',
  delay = 0,
  duration = 0.5,
  className = '',
  width = '100%'
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-50px" })

  const variants = {
    hidden: {
      opacity: 0,
      y: direction === 'up' ? 40 : direction === 'down' ? -40 : 0,
      x: direction === 'left' ? 40 : direction === 'right' ? -40 : 0,
    },
    visible: {
      opacity: 1,
      y: 0,
      x: 0,
    }
  }

  // Pure fade variant
  if (direction === 'fade') {
    variants.hidden = { opacity: 0, y: 0, x: 0 }
  }

  return (
    <div ref={ref} style={{ width }} className={className}>
      <motion.div
        variants={variants}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        transition={{
          duration,
          delay,
          ease: [0.19, 1, 0.22, 1] // easeOutExpo
        }}
      >
        {children}
      </motion.div>
    </div>
  )
}
