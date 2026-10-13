export type QualityTier = 'low' | 'medium' | 'high'
export const TIERS: QualityTier[] = ['low', 'medium', 'high']

export interface QualitySettings {
  dpr: [number, number]
  stars: number
  dust: number
  segments: number
  octaves: number
  bloom: boolean
  msaa: number
  clouds: boolean
  galaxyStars: number
  galaxyDust: number
  nebulaPuffs: number
  nebulaStars: number
  bhParticles: number
  puffMaxPx: number
}

export const QUALITY: Record<QualityTier, QualitySettings> = {
  low: { dpr: [1, 1.25], stars: 3000, dust: 500, segments: 48, octaves: 3, bloom: false, msaa: 0, clouds: false,
    galaxyStars: 14000, galaxyDust: 1200, nebulaPuffs: 900, nebulaStars: 150, bhParticles: 400, puffMaxPx: 60 },
  medium: { dpr: [1, 1.5], stars: 7000, dust: 1000, segments: 72, octaves: 4, bloom: true, msaa: 0, clouds: true,
    galaxyStars: 32000, galaxyDust: 3000, nebulaPuffs: 2200, nebulaStars: 320, bhParticles: 900, puffMaxPx: 85 },
  high: { dpr: [1, 2], stars: 14000, dust: 1800, segments: 128, octaves: 5, bloom: true, msaa: 4, clouds: true,
    galaxyStars: 60000, galaxyDust: 6000, nebulaPuffs: 3800, nebulaStars: 520, bhParticles: 1600, puffMaxPx: 110 },
}

/** Heurística inicial. O <PerformanceMonitor> ajusta em runtime se o FPS cair. */
export function detectQuality(): QualityTier {
  if (typeof navigator === 'undefined') return 'medium'
  const nav = navigator as Navigator & { deviceMemory?: number }
  const cores = nav.hardwareConcurrency ?? 4
  const mem = nav.deviceMemory ?? 4
  const coarse = window.matchMedia('(pointer: coarse)').matches
  if (mem <= 2 || cores <= 2) return 'low'
  if (coarse || cores <= 4 || mem <= 4 || window.innerWidth < 720) return 'medium'
  return 'high'
}
