"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { fibonacciDome } from "./particles";

/* ------------------------------------------------------------------ *
 * DomeCanvas — a hemisphere of points rising from the bottom of the
 * frame. Per-vertex colors blend electric-blue (#006BE4) at the base
 * into sky (#B5D6FF) toward the apex, with the apex fading out so the
 * dome reads as "rising". Client-only (imported via { ssr: false }).
 * ------------------------------------------------------------------ */

const RADIUS = 2.2;

function DomePoints() {
  const group = useRef<THREE.Group>(null);

  const { positions, colors } = useMemo(() => {
    const positions = fibonacciDome(3200, RADIUS);

    const base = new THREE.Color("#006BE4"); // equator / base
    const apex = new THREE.Color("#B5D6FF"); // top
    const tmp = new THREE.Color();

    const colors = new Float32Array(positions.length);
    for (let i = 0; i < positions.length; i += 3) {
      // Normalized height 0 (base) → 1 (apex).
      const h = THREE.MathUtils.clamp(positions[i + 1] / RADIUS, 0, 1);
      tmp.copy(base).lerp(apex, h);
      // Fade upward: dim the color the higher it goes.
      const fade = 1 - h * 0.55;
      colors[i] = tmp.r * fade;
      colors[i + 1] = tmp.g * fade;
      colors[i + 2] = tmp.b * fade;
    }
    return { positions, colors };
  }, []);

  useFrame((_, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 0.06;
    }
  });

  return (
    <group ref={group}>
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
            count={positions.length / 3}
            array={positions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[colors, 3]}
            count={colors.length / 3}
            array={colors}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          vertexColors
          size={0.025}
          sizeAttenuation
          transparent
          opacity={0.9}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

export function DomeCanvas() {
  return (
    <Canvas
      // Camera low and angled so the dome rises from the bottom edge.
      camera={{ position: [0, -1.1, 4.4], fov: 50 }}
      dpr={[1, 2]}
      gl={{ alpha: true, antialias: true }}
      style={{ background: "transparent" }}
      onCreated={({ camera }) => camera.lookAt(0, 0.4, 0)}
    >
      <DomePoints />
    </Canvas>
  );
}
