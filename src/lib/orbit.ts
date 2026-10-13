import { MathUtils, Vector3 } from 'three'
import type { CelestialBody } from '../types/celestial'
import { getBody } from '../data'

const _parent = new Vector3()

/** Velocidade angular visual (rad/s). Compressão logarítmica: Terra ≈ 120 s por volta, Netuno ≈ 43 min. */
export function orbitAngularSpeed(b: CelestialBody): number {
  if (!b.orbit.radius) return 0
  const secs = 120 * Math.pow(b.orbit.periodDays / 365.25, 0.6)
  return (Math.PI * 2) / secs
}

/** Ângulo orbital atual (rad), medido de +X para +Z no plano XZ. */
export const orbitAngle = (b: CelestialBody, t: number) => b.orbit.phase + t * orbitAngularSpeed(b)

/** Posição no mundo. Luas (orbit.parentId) orbitam a posição do pai. */
export function bodyPosition(b: CelestialBody, t: number, out = new Vector3()): Vector3 {
  if (!b.orbit.radius) return out.set(0, 0, 0)
  const a = orbitAngle(b, t)
  out.set(Math.cos(a) * b.orbit.radius, 0, Math.sin(a) * b.orbit.radius)
  if (b.orbit.parentId) {
    const p = getBody(b.orbit.parentId)
    if (p) out.add(bodyPosition(p, t, _parent))
  }
  return out
}

/** Rotação visual (rad/s). Negativo = retrógrada. Corpos com `locked` têm a rotação definida de forma absoluta em Body.tsx. */
export function spinSpeed(b: CelestialBody): number {
  if (b.rotation.locked) return 0
  const h = b.rotation.periodHours
  const secs = 30 * Math.sqrt(Math.abs(h) / 24)
  return (Math.sign(h) * Math.PI * 2) / secs
}

export const visualRadius = (b: CelestialBody) => b.radius * (b.rings ? b.rings.outer : 1)

export function fitDistance(radius: number, aspect: number, fovDeg = 45, fillV = 0.55, fillH = 0.7): number {
  const t = Math.tan(MathUtils.degToRad(fovDeg) / 2)
  return Math.max(radius / (fillV * t), radius / (fillH * t * aspect))
}
