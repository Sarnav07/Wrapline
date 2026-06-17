/* ------------------------------------------------------------------ *
 * particles.ts — pure point-cloud generators for the Three.js scenes.
 * No React, no THREE imports: just deterministic Fibonacci-lattice math
 * so the geometry is stable across renders and easy to test.
 * ------------------------------------------------------------------ */

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5)); // ≈ 2.39996 rad

/**
 * fibonacciSphere — `count` points spread evenly over a full sphere of
 * the given `radius`, returned flat as [x0,y0,z0, x1,y1,z1, …].
 * Uses the spherical Fibonacci lattice for near-uniform distribution.
 */
export function fibonacciSphere(count: number, radius: number): Float32Array {
  const out = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    // y goes from +1 (top) to -1 (bottom).
    const y = 1 - (i / (count - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = GOLDEN_ANGLE * i;
    const x = Math.cos(theta) * r;
    const z = Math.sin(theta) * r;
    const o = i * 3;
    out[o] = x * radius;
    out[o + 1] = y * radius;
    out[o + 2] = z * radius;
  }
  return out;
}

/**
 * fibonacciDome — same lattice but restricted to the upper hemisphere
 * (y >= 0), giving an evenly covered dome of the given `radius`.
 */
export function fibonacciDome(count: number, radius: number): Float32Array {
  const out = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    // Map i across the hemisphere: y from 1 (apex) down to 0 (equator).
    const y = 1 - i / count;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = GOLDEN_ANGLE * i;
    const x = Math.cos(theta) * r;
    const z = Math.sin(theta) * r;
    const o = i * 3;
    out[o] = x * radius;
    out[o + 1] = y * radius;
    out[o + 2] = z * radius;
  }
  return out;
}
