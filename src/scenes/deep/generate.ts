import { Color } from 'three'
import { gauss, mulberry32 } from '../../lib/rng'
import type { DeepGalaxy, DeepNebula } from '../../types/celestial'

export interface PointData {
  positions: Float32Array
  sizes: Float32Array
  colors: Float32Array
  bright: Float32Array
  alphas?: Float32Array
}

/** Galáxia espiral: bojo esférico + disco exponencial com braços logarítmicos + regiões HII rosadas. */
export function genGalaxyStars(g: DeepGalaxy, n: number): PointData {
  const rnd = mulberry32(31337)
  const R = g.radius
  const positions = new Float32Array(n * 3)
  const sizes = new Float32Array(n)
  const colors = new Float32Array(n * 3)
  const bright = new Float32Array(n)
  const core = new Color(g.colors.core), inner = new Color(g.colors.inner), arm = new Color(g.colors.arm), hii = new Color(g.colors.hii)
  const c = new Color()

  for (let i = 0; i < n; i++) {
    let x: number, y: number, z: number
    if (rnd() < 0.2) {
      // bojo
      x = gauss(rnd) * 0.1 * R; y = gauss(rnd) * 0.07 * R; z = gauss(rnd) * 0.1 * R
      const t = Math.min(1, Math.hypot(x, y, z) / (0.2 * R))
      c.copy(core).lerp(inner, t)
      bright[i] = 0.55
    } else {
      const r = Math.min(R, -Math.log(1 - rnd() * 0.985) * 0.27 * R)
      const a = Math.floor(rnd() * g.arms) * ((Math.PI * 2) / g.arms) + (r / R) * g.twist
      const spread = (0.07 + 0.3 * (1 - r / R) * 0.5) * (0.35 + rnd())
      const ang = a + gauss(rnd) * spread
      x = Math.cos(ang) * r; z = Math.sin(ang) * r
      y = gauss(rnd) * 0.018 * R * (1 + 2.5 * Math.exp(-r / (0.2 * R)))
      const t = Math.min(1, r / (0.7 * R))
      c.copy(inner).lerp(arm, t)
      const onArm = Math.exp(-Math.abs(gauss(rnd)) * 0.8)
      if (rnd() < 0.045 * onArm && r > 0.2 * R) c.copy(hii)
      bright[i] = 0.35 + 0.35 * onArm
    }
    positions.set([x, y, z], i * 3)
    colors.set([c.r, c.g, c.b], i * 3)
    sizes[i] = 1 + Math.pow(rnd(), 6) * 4
  }
  return { positions, sizes, colors, bright }
}

/** Poeira escura ao longo da borda interna dos braços (escurece as estrelas por trás). */
export function genGalaxyDust(g: DeepGalaxy, n: number): PointData {
  const rnd = mulberry32(777)
  const R = g.radius
  const positions = new Float32Array(n * 3)
  const sizes = new Float32Array(n)
  const colors = new Float32Array(n * 3)
  const bright = new Float32Array(n).fill(1)
  const dust = new Color('#1a0e08')
  for (let i = 0; i < n; i++) {
    const r = R * (0.12 + 0.6 * Math.pow(rnd(), 0.8))
    const a = Math.floor(rnd() * g.arms) * ((Math.PI * 2) / g.arms) + (r / R) * g.twist - 0.22 + gauss(rnd) * 0.07
    positions.set([Math.cos(a) * r, gauss(rnd) * 0.012 * R, Math.sin(a) * r], i * 3)
    colors.set([dust.r, dust.g, dust.b], i * 3)
    sizes[i] = 5 + rnd() * 9
  }
  return { positions, sizes, colors, bright }
}

/** Nebulosa: nuvens gaussianas de gás (sprites grandes e translúcidos) distribuídas em lóbulos + noise de deformação. */
export function genNebula(o: DeepNebula, puffs: number, stars: number): { gas: PointData; stars: PointData } {
  const rnd = mulberry32(4242)
  const R = o.radius
  const pal = { core: new Color(o.palette.core), mid: new Color(o.palette.mid), outer: new Color(o.palette.outer), accent: new Color(o.palette.accent) }
  // [cx, cy, cz, sigma (frações de R), peso]
  const lobes: [number, number, number, number, number][] = [
    [0, 0, 0, 0.32, 0.38],
    [0.12, 0.14, 0.05, 0.2, 0.2],
    [-0.5, 0.1, -0.1, 0.28, 0.14],
    [0.5, -0.05, 0.12, 0.3, 0.16],
    [-0.1, -0.35, 0.2, 0.25, 0.12],
  ]
  const gas: PointData = {
    positions: new Float32Array(puffs * 3), sizes: new Float32Array(puffs), colors: new Float32Array(puffs * 3),
    bright: new Float32Array(puffs), alphas: new Float32Array(puffs),
  }
  const c = new Color()
  for (let i = 0; i < puffs; i++) {
    let k = rnd(), li = 0
    for (; li < lobes.length - 1; li++) { if (k < lobes[li][4]) break; k -= lobes[li][4] }
    const [cx, cy, cz, s] = lobes[li]
    let x = (cx + gauss(rnd) * s) * R
    let y = (cy + gauss(rnd) * s * 0.7) * R
    let z = (cz + gauss(rnd) * s * 0.8) * R
    // deformação suave (filamentos)
    x += Math.sin(y * 0.012 + z * 0.006) * 0.07 * R
    y += Math.sin(z * 0.01 + x * 0.007) * 0.06 * R
    gas.positions.set([x, y, z], i * 3)
    const d = Math.min(1, Math.hypot(x, y, z) / R)
    if (d < 0.35) c.copy(pal.core).lerp(pal.mid, d / 0.35)
    else c.copy(pal.mid).lerp(pal.outer, (d - 0.35) / 0.65)
    if (rnd() < 0.12) c.lerp(pal.accent, 0.7)
    gas.colors.set([c.r, c.g, c.b], i * 3)
    gas.sizes[i] = R * (0.07 + rnd() * 0.2)
    gas.alphas![i] = (0.035 + rnd() * 0.07) * (1.15 - d * 0.6)
  }
  const st: PointData = { positions: new Float32Array(stars * 3), sizes: new Float32Array(stars), colors: new Float32Array(stars * 3), bright: new Float32Array(stars).fill(1) }
  for (let i = 0; i < stars; i++) {
    const trap = i < 5 // Trapezium: poucas estrelas muito quentes no centro
    const s = trap ? 0.03 : 0.38
    st.positions.set([gauss(rnd) * s * R, gauss(rnd) * s * R * 0.8, gauss(rnd) * s * R], i * 3)
    c.set(rnd() < 0.7 ? '#cfe2ff' : '#ffe9c8')
    st.colors.set([c.r, c.g, c.b], i * 3)
    st.sizes[i] = trap ? R * 0.012 : R * (0.0035 + Math.pow(rnd(), 4) * 0.008)
  }
  return { gas, stars: st }
}
