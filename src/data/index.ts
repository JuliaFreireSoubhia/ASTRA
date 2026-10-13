import { SOLAR_BODIES as RAW_SOLAR_BODIES } from './planets'
import { STARS as RAW_STARS } from './stars'
import { GALAXIES as RAW_GALAXIES } from './galaxies'
import { NEBULAE as RAW_NEBULAE } from './nebulae'
import { BLACK_HOLES as RAW_BLACK_HOLES } from './blackHoles'
import type { Category, CelestialBody, DeepObject, Entry, Realm } from '../types/celestial'

/**
 * Proteção: cada `id` só pode existir UMA vez em todo o app. Uma entrada repetida (ex.: sobra de merge/colagem
 * em data/*.ts) faria o mesmo corpo ser renderizado duas vezes. Duplicatas são ignoradas e avisadas no console.
 */
const seenIds = new Set<string>()
function uniqueById<T extends { id: string }>(list: T[], source: string): T[] {
  return list.filter((e) => {
    if (seenIds.has(e.id)) {
      console.warn(`[ASTRA] id duplicado ignorado: "${e.id}" em data/${source}. Remova a entrada repetida.`)
      return false
    }
    seenIds.add(e.id)
    return true
  })
}

export const SOLAR_BODIES = uniqueById(RAW_SOLAR_BODIES, 'planets.ts')
export const STARS = uniqueById(RAW_STARS, 'stars.ts')
export const GALAXIES = uniqueById(RAW_GALAXIES, 'galaxies.ts')
export const NEBULAE = uniqueById(RAW_NEBULAE, 'nebulae.ts')
export const BLACK_HOLES = uniqueById(RAW_BLACK_HOLES, 'blackHoles.ts')

/** Para adicionar uma nova categoria/objeto: exporte o array e inclua aqui. */
export const DEEP_OBJECTS: DeepObject[] = [...STARS, ...GALAXIES, ...NEBULAE, ...BLACK_HOLES]
export const ENTRIES: Entry[] = [...SOLAR_BODIES, ...DEEP_OBJECTS]

export const CATEGORIES: { id: Category; label: string; realm: Realm }[] = [
  { id: 'planets', label: 'Planets', realm: 'solar' },
  { id: 'stars', label: 'Stars', realm: 'deep' },
  { id: 'galaxies', label: 'Galaxies', realm: 'deep' },
  { id: 'nebulae', label: 'Nebulae', realm: 'deep' },
  { id: 'blackholes', label: 'Black holes', realm: 'deep' },
]

const BY_ID = new Map<string, Entry>(ENTRIES.map((e) => [e.id, e]))
export const getEntry = (id: string): Entry | undefined => BY_ID.get(id)
export const getBody = (id: string): CelestialBody | undefined => {
  const e = BY_ID.get(id)
  return e && !isDeep(e) ? e : undefined
}
export const getDeep = (id: string): DeepObject | undefined => {
  const e = BY_ID.get(id)
  return e && isDeep(e) ? e : undefined
}

export const isDeep = (e: Entry): e is DeepObject => 'lightYears' in e
export const categoryOf = (e: Entry): Category => (isDeep(e) ? e.category : 'planets')
export const realmOf = (e: Entry): Realm => (isDeep(e) ? 'deep' : 'solar')
export const entriesIn = (c: Category): Entry[] => ENTRIES.filter((e) => categoryOf(e) === c)
