"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { fibonacciSphere } from "./particles";

/* ------------------------------------------------------------------ *
 * GlobeCanvas — a slowly auto-rotating sphere of ~3500 sky-blue points.
 * Client-only: holds the actual R3F <Canvas>, which touches `window`
 * and must never render on the server (parents import it via dynamic
 * import with { ssr: false }).
 * ------------------------------------------------------------------ */

function GlobePoints({ color, opacity }: { color: string; opacity: number }) {
  const group = useRef<THREE.Group>(null);

  // Build the position buffer once.
  const positions = useMemo(() => fibonacciSphere(3500, 1.6), []);

  useFrame((_, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 0.08;
    }
  });

  return (
    <group ref={group} rotation={[0.35, 0, 0]}>
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
            count={positions.length / 3}
            array={positions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          color={color}
          size={0.02}
          sizeAttenuation
          transparent
          opacity={opacity}
          depthWrite={false}
        />
      </points>
    </group>
  );
}

export function GlobeCanvas({
  color = "#B5D6FF",
  opacity = 0.9,
}: {
  color?: string;
  opacity?: number;
} = {}) {
  return (
    <Canvas
      camera={{ position: [0, 0, 4], fov: 50 }}
      dpr={[1, 2]}
      gl={{ alpha: true, antialias: true }}
      style={{ background: "transparent" }}
    >
      <GlobePoints color={color} opacity={opacity} />
    </Canvas>
  );
}
