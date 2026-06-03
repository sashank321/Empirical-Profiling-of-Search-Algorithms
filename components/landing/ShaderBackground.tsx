'use client'

import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = `
  uniform float u_time;
  varying vec2 vUv;
  
  // Basic noise function
  float rand(vec2 n) { 
    return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
  }
  
  float noise(vec2 p){
    vec2 ip = floor(p);
    vec2 u = fract(p);
    u = u*u*(3.0-2.0*u);
    
    float res = mix(
      mix(rand(ip), rand(ip+vec2(1.0,0.0)), u.x),
      mix(rand(ip+vec2(0.0,1.0)), rand(ip+vec2(1.0,1.0)), u.x), u.y);
    return res*res;
  }

  void main() {
    vec2 uv = vUv;
    
    // Animate coordinates
    vec2 movement = vec2(u_time * 0.05, u_time * 0.03);
    
    // Layered noise
    float n = noise(uv * 3.0 + movement);
    n += noise(uv * 6.0 - movement * 1.5) * 0.5;
    n += noise(uv * 12.0 + movement * 2.0) * 0.25;
    
    // Dark graphite base with subtle blue/purple hints
    vec3 color1 = vec3(0.04, 0.04, 0.05);
    vec3 color2 = vec3(0.08, 0.09, 0.12);
    
    vec3 finalColor = mix(color1, color2, n * 0.5);
    
    // Vignette
    float dist = distance(uv, vec2(0.5));
    finalColor *= smoothstep(0.8, 0.2, dist * 1.2);
    
    gl_FragColor = vec4(finalColor, 1.0);
  }
`

function ShaderPlane() {
  const materialRef = useRef<THREE.ShaderMaterial>(null)

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.u_time.value = state.clock.elapsedTime
    }
  })

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{
          u_time: { value: 0 }
        }}
        depthWrite={false}
      />
    </mesh>
  )
}

export default function ShaderBackground() {
  return (
    <div className="absolute inset-0 z-[-1] overflow-hidden pointer-events-none">
      <Canvas orthographic camera={{ position: [0, 0, 1], zoom: 1 }}>
        <ShaderPlane />
      </Canvas>
    </div>
  )
}
