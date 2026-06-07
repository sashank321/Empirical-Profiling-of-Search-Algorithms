'use client';

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

// Generate a random position inside a sphere
function inSphere(num: number, radius: number) {
  const positions = new Float32Array(num * 3);
  for (let i = 0; i < num; i++) {
    const u = Math.random();
    const v = Math.random();
    const theta = u * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * v - 1.0);
    const r = Math.cbrt(Math.random()) * radius;

    const sinPhi = Math.sin(phi);
    const cosPhi = Math.cos(phi);
    const sinTheta = Math.sin(theta);
    const cosTheta = Math.cos(theta);

    const x = r * sinPhi * cosTheta;
    const y = r * sinPhi * sinTheta;
    const z = r * cosPhi;

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
  }
  return positions;
}

function Starfield(props: any) {
  const ref = useRef<THREE.Points>(null);
  
  const sphere = useMemo(() => inSphere(3000, 1.5), []);

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.x -= delta / 10;
      ref.current.rotation.y -= delta / 15;
    }
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={sphere} stride={3} frustumCulled={false} {...props}>
        <PointMaterial
          transparent
          color="#3b82f6"
          size={0.005}
          sizeAttenuation={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </Points>
    </group>
  );
}

export default function HeroBackground() {
  return (
    <div className="absolute inset-0 -z-10 bg-[#020202]">
      <Canvas camera={{ position: [0, 0, 1] }}>
        <Starfield />
        <ambientLight intensity={0.5} />
      </Canvas>
      {/* Subtle OLED vignette gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#020202] via-transparent to-transparent z-0 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#020202] via-transparent to-transparent z-0 pointer-events-none" />
    </div>
  );
}
