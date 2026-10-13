/**
 * Modelo de dados dos objetos astronômicos do ASTRA.
 * Corpos do Sistema Solar = CelestialBody. Objetos de Deep Space = DeepObject (union por `kind`).
 * Para adicionar um objeto: crie a entrada em data/<categoria>.ts. Nenhum componente muda.
 */
export type BodyKind = 'star' | 'planet'
export type SurfaceKind = 'rocky' | 'earth' | 'banded' | 'sun' | 'moon' | 'mercury'
export type Category = 'planets' | 'stars' | 'galaxies' | 'nebulae' | 'blackholes'
export type Realm = 'solar' | 'deep'

export interface Fact { label: string; value: string }

/** Ponto de interesse na superfície (lat/lon em graus, convenção equirretangular padrão). */
export interface POI {
  id: string
  name: string
  lat: number
  lon: number
  info: string
  /** Fração da distância de enquadramento do planeta (menor = mais perto). Padrão 0.6 */
  zoom?: number
}

/** Mancha elíptica na superfície (Grande Mancha Vermelha, Olympus Mons, Grande Mancha Escura). */
export interface SpotStyle {
  lonDeg: number
  latDeg: number
  /** semi-eixos (graus): [longitude, latitude] */
  sizeDeg: [number, number]
  color: string
  strength: number
  /** altura do relevo (só rochosos) */
  height?: number
}

/**
 * Bacia de impacto com posição real (kinds 'moon' e 'mercury').
 * fill: rings = só anéis/relevo · mare = preenchida por basalto escuro (Lua) · plains = planície lisa + anéis (Mercúrio)
 *       smooth = planície lisa sem anéis · dusk = terreno escurecido, sem mar (bacia Polo Sul–Aitken)
 */
export interface Basin {
  lonDeg: number
  latDeg: number
  radiusDeg: number
  fill: 'rings' | 'mare' | 'plains' | 'smooth' | 'dusk'
}

/** Texturas reais opcionais (substituem o shader). Veja public/textures/README.md */
export interface TextureSet { map: string; normal?: string; emissive?: string; roughness?: string; bump?: string }

export interface SurfaceStyle {
  kind: SurfaceKind
  /** 3 cores base (hex). O significado depende do `kind` (ver shaders/planet.ts) */
  colors: [string, string, string]
  scale?: number
  bands?: number
  warp?: number
  seed?: number
  /** intensidade do relevo (bump) */
  relief?: number
  /** quantidade de crateras 0..1 (rochosos) */
  craters?: number
  spot?: SpotStyle
  /** bacias nomeadas (máx. 12) — distribuição própria de cada corpo */
  basins?: Basin[]
  /** quantidade de mares procedurais extras (Lua), 0..1 */
  mare?: number
  /** quantidade de planícies lisas intercrateras (Mercúrio), 0..1 */
  plains?: number
  /** quantidade de escarpas/cristas tectônicas (Mercúrio), 0..1 */
  scarps?: number
  textures?: TextureSet
  /** futuro: glTF/GLB */
  model?: string
}

export interface AtmosphereStyle {
  color: string
  intensity: number
  scale?: number
  rim?: number
  /** tom avermelhado no terminador (espalhamento ao pôr do sol) 0..1 */
  twilight?: number
}

export interface RingStyle { inner: number; outer: number; color: string }

interface EntryBase {
  id: string
  name: string
  tagline: string
  description: string
  facts: Fact[]
  /** Nota científica / aviso de representação artística */
  note?: string
}

export interface CelestialBody extends EntryBase {
  kind: BodyKind
  radius: number
  orbit: { radius: number; periodDays: number; phase: number; parentId?: string }
  rotation: { periodHours: number; axialTiltDeg: number; locked?: boolean }
  surface: SurfaceStyle
  atmosphere?: AtmosphereStyle
  rings?: RingStyle
  clouds?: boolean
  pois?: POI[]
}

/* ---------------- Deep Space ---------------- */
interface DeepBase extends EntryBase {
  category: Exclude<Category, 'planets'>
  lightYears: number
  /** direção a partir do Sistema Solar (normalizada em runtime) */
  direction: [number, number, number]
  /** câmera ao selecionar: distância em unidades de cena, azimute/elevação relativos à linha de visão da Terra */
  view: { distance: number; azimuthDeg: number; elevationDeg: number; minFactor?: number }
}

export interface DeepStar extends DeepBase {
  kind: 'star'
  radius: number
  surface: SurfaceStyle
  atmosphere?: AtmosphereStyle
  glow: { color: string; size: number; intensity: number }
  pulse?: number
}
export interface DeepGalaxy extends DeepBase {
  kind: 'galaxy'
  radius: number
  arms: number
  twist: number
  /** inclinação do disco [x, z] em radianos */
  tilt: [number, number]
  colors: { core: string; inner: string; arm: string; hii: string }
}
export interface DeepNebula extends DeepBase {
  kind: 'nebula'
  radius: number
  palette: { core: string; mid: string; outer: string; accent: string }
}
export interface DeepBlackHole extends DeepBase {
  kind: 'blackhole'
  /** raio da sombra em unidades de cena */
  radius: number
}
export type DeepObject = DeepStar | DeepGalaxy | DeepNebula | DeepBlackHole
export type Entry = CelestialBody | DeepObject
