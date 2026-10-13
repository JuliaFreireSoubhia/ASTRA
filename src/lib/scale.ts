import { Vector3 } from 'three'
import type { DeepObject } from '../types/celestial'

/**
 * Escala visual LOGARÍTMICA: distâncias reais (8,6 a 2,5 milhões de anos-luz) cobrem 5 ordens
 * de grandeza; em escala linear tudo seria invisível. Cada ordem de grandeza = 900 unidades de cena.
 */
export const scaleDistance = (lightYears: number) => 900 * Math.log10(lightYears + 1)

const cache = new Map<string, Vector3>()
export function deepPosition(o: DeepObject): Vector3 {
  let p = cache.get(o.id)
  if (!p) {
    p = new Vector3(...o.direction).normalize().multiplyScalar(scaleDistance(o.lightYears))
    cache.set(o.id, p)
  }
  return p
}
