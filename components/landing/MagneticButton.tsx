'use client'

import { useRef, useState } from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'

interface MagneticButtonProps extends HTMLMotionProps<"button"> {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'ghost'
  className?: string
  magneticStrength?: number
}

export default function MagneticButton({
  children,
  variant = 'primary',
  className = '',
  magneticStrength = 20,
  ...props
}: MagneticButtonProps) {
  const ref = useRef<HTMLButtonElement>(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })

  const handleMouse = (e: React.MouseEvent<HTMLButtonElement>) => {
    const { clientX, clientY } = e
    const { height, width, left, top } = ref.current!.getBoundingClientRect()
    const middleX = clientX - (left + width / 2)
    const middleY = clientY - (top + height / 2)
    
    setPosition({ x: middleX * (magneticStrength / 100), y: middleY * (magneticStrength / 100) })
  }

  const reset = () => {
    setPosition({ x: 0, y: 0 })
  }

  const baseStyles = "relative inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium transition-colors rounded-xl outline-none focus:ring-2 focus:ring-accent-blue/50"
  
  const variants = {
    primary: "bg-white text-black hover:bg-neutral-200 shadow-depth-1",
    secondary: "glass-card text-white hover:bg-surface-2 border-subtle-hover shadow-depth-1",
    ghost: "text-text-secondary hover:text-white hover:bg-surface-1"
  }

  return (
    <motion.button
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: 'spring', stiffness: 150, damping: 15, mass: 0.1 }}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  )
}
