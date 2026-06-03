'use client'

import { useEffect, useRef } from 'react'

export default function CursorSpotlight() {
  const spotlightRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (spotlightRef.current) {
        // Update CSS custom properties for cursor position
        spotlightRef.current.style.setProperty('--cursor-x', `${e.clientX}px`)
        spotlightRef.current.style.setProperty('--cursor-y', `${e.clientY}px`)
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <div
      ref={spotlightRef}
      className="pointer-events-none fixed inset-0 z-50 transition-opacity duration-300"
      style={{
        background: `radial-gradient(600px circle at var(--cursor-x, 50vw) var(--cursor-y, 50vh), rgba(255,255,255,0.03), transparent 40%)`
      }}
    />
  )
}
