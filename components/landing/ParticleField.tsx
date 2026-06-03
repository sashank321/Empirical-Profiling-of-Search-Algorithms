'use client'

import { useRef, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

const PARTICLE_COUNT = 1500
const MAX_DISTANCE = 0.15

function Particles() {
  const points = useRef<THREE.Points>(null)
  const lines = useRef<THREE.LineSegments>(null)
  const { mouse, viewport } = useThree()

  // Generate initial particle positions and velocities
  const [positions, velocities] = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3)
    const vel = new Float32Array(PARTICLE_COUNT * 3)
    
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Spread particles across the viewport
      pos[i * 3] = (Math.random() - 0.5) * viewport.width * 1.2
      pos[i * 3 + 1] = (Math.random() - 0.5) * viewport.height * 1.2
      pos[i * 3 + 2] = (Math.random() - 0.5) * 2 // slight depth
      
      vel[i * 3] = (Math.random() - 0.5) * 0.01
      vel[i * 3 + 1] = (Math.random() - 0.5) * 0.01
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.01
    }
    return [pos, vel]
  }, [viewport])

  // Create geometry for lines (connections)
  const linesGeometry = useMemo(() => new THREE.BufferGeometry(), [])
  
  useFrame(() => {
    if (!points.current || !lines.current) return

    const positionsArray = points.current.geometry.attributes.position.array as Float32Array
    const linePositions: number[] = []
    const lineColors: number[] = []

    // Map normalized mouse coordinates (-1 to 1) to world coordinates
    const mouseX = (mouse.x * viewport.width) / 2
    const mouseY = (mouse.y * viewport.height) / 2

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3
      
      // Update positions with velocities
      positionsArray[i3] += velocities[i3]
      positionsArray[i3 + 1] += velocities[i3 + 1]
      
      // Bounce off edges
      const halfW = viewport.width * 0.6
      const halfH = viewport.height * 0.6
      
      if (Math.abs(positionsArray[i3]) > halfW) velocities[i3] *= -1
      if (Math.abs(positionsArray[i3 + 1]) > halfH) velocities[i3 + 1] *= -1

      // Mouse interaction (repel)
      const dx = mouseX - positionsArray[i3]
      const dy = mouseY - positionsArray[i3 + 1]
      const distToMouse = Math.sqrt(dx * dx + dy * dy)
      
      if (distToMouse < 2) {
        const force = (2 - distToMouse) * 0.02
        velocities[i3] -= (dx / distToMouse) * force
        velocities[i3 + 1] -= (dy / distToMouse) * force
      }

      // Add friction to settle back to normal speed
      velocities[i3] += (Math.sign(velocities[i3]) * 0.005 - velocities[i3]) * 0.05
      velocities[i3 + 1] += (Math.sign(velocities[i3 + 1]) * 0.005 - velocities[i3 + 1]) * 0.05

      // Check connections
      for (let j = i + 1; j < PARTICLE_COUNT; j++) {
        const j3 = j * 3
        const dx2 = positionsArray[i3] - positionsArray[j3]
        const dy2 = positionsArray[i3 + 1] - positionsArray[j3 + 1]
        const dist = Math.sqrt(dx2 * dx2 + dy2 * dy2)

        if (dist < MAX_DISTANCE * viewport.width) {
          linePositions.push(
            positionsArray[i3], positionsArray[i3 + 1], positionsArray[i3 + 2],
            positionsArray[j3], positionsArray[j3 + 1], positionsArray[j3 + 2]
          )
          
          // Alpha based on distance
          const alpha = 1.0 - (dist / (MAX_DISTANCE * viewport.width))
          lineColors.push(
            0.6, 0.6, 0.6, alpha * 0.3,
            0.6, 0.6, 0.6, alpha * 0.3
          )
        }
      }
    }

    points.current.geometry.attributes.position.needsUpdate = true
    
    linesGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3))
    linesGeometry.setAttribute('color', new THREE.Float32BufferAttribute(lineColors, 4))
  })

  return (
    <>
      <points ref={points}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={PARTICLE_COUNT}
            array={positions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial size={0.03} color="#888888" transparent opacity={0.6} sizeAttenuation />
      </points>
      <lineSegments ref={lines} geometry={linesGeometry}>
        <lineBasicMaterial vertexColors transparent depthWrite={false} />
      </lineSegments>
    </>
  )
}

export default function ParticleField() {
  return (
    <div className="absolute inset-0 z-0 bg-surface-0 overflow-hidden pointer-events-none">
      <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
        <Particles />
      </Canvas>
      {/* Fallback gradient overlay for blending */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-surface-0/50 to-surface-0 pointer-events-none" />
    </div>
  )
}
