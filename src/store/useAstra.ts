import { create } from 'zustand'
import { CATEGORIES, categoryOf, entriesIn, getEntry, isDeep } from '../data'
import { TIERS, detectQuality, type QualityTier } from '../lib/quality'
import type { Category, Realm } from '../types/celestial'

export type Phase = 'intro' | 'explore'

interface AstraState {
  phase: Phase
  realm: Realm
  category: Category
  selectedId: string | null
  selectedPoiId: string | null
  menuOpen: boolean
  aboutOpen: boolean
  sceneReady: boolean
  hasInteracted: boolean
  reducedMotion: boolean
  deepRequested: boolean
  quality: QualityTier
  maxQuality: QualityTier
  resetNonce: number

  enter: () => void
  enterDeep: () => void
  goHome: () => void
  setCategory: (c: Category) => void
  select: (id: string) => void
  selectPoi: (id: string | null) => void
  deselect: () => void
  step: (dir: 1 | -1) => void
  resetView: () => void
  requestDeep: () => void
  setMenu: (open: boolean) => void
  setAbout: (open: boolean) => void
  setSceneReady: () => void
  markInteracted: () => void
  setReducedMotion: (v: boolean) => void
  downgrade: () => void
  upgrade: () => void
}

const initialQuality = detectQuality()

export const useAstra = create<AstraState>((set, get) => ({
  phase: 'intro',
  realm: 'solar',
  category: 'planets',
  selectedId: null,
  selectedPoiId: null,
  menuOpen: false,
  aboutOpen: false,
  sceneReady: false,
  hasInteracted: false,
  reducedMotion: false,
  deepRequested: false,
  quality: initialQuality,
  maxQuality: initialQuality,
  resetNonce: 0,

  // `resetNonce` força a câmera a re-viajar mesmo que o alvo lógico seja o mesmo
  enter: () => set((s) => ({ phase: 'explore', realm: 'solar', category: 'planets', selectedId: null, selectedPoiId: null, menuOpen: false, resetNonce: s.resetNonce + 1 })),
  enterDeep: () => set((s) => ({
    phase: 'explore', realm: 'deep', category: s.category === 'planets' ? 'galaxies' : s.category,
    selectedId: null, selectedPoiId: null, menuOpen: false, deepRequested: true, resetNonce: s.resetNonce + 1,
  })),
  goHome: () => set((s) => ({ phase: 'intro', realm: 'solar', category: 'planets', selectedId: null, selectedPoiId: null, menuOpen: false, resetNonce: s.resetNonce + 1 })),
  setCategory: (category) => set((s) => {
    const realm = CATEGORIES.find((c) => c.id === category)!.realm
    return { phase: 'explore', category, realm, selectedId: null, selectedPoiId: null, deepRequested: s.deepRequested || realm === 'deep', resetNonce: s.resetNonce + 1 }
  }),
  select: (id) => {
    const e = getEntry(id)
    if (!e) return
    set((s) => ({
      phase: 'explore', selectedId: id, selectedPoiId: null, menuOpen: false,
      realm: isDeep(e) ? 'deep' : 'solar', category: categoryOf(e), deepRequested: s.deepRequested || isDeep(e),
    }))
  },
  selectPoi: (selectedPoiId) => set({ selectedPoiId }),
  deselect: () => set({ selectedId: null, selectedPoiId: null }),
  step: (dir) => {
    const { selectedId, category } = get()
    const list = entriesIn(category)
    const i = list.findIndex((b) => b.id === selectedId)
    const n = list.length
    const next = i === -1 ? (dir > 0 ? 0 : n - 1) : (i + dir + n) % n
    get().select(list[next].id)
  },
  resetView: () => set((s) => ({ resetNonce: s.resetNonce + 1, selectedPoiId: null })),
  requestDeep: () => set({ deepRequested: true }),
  setMenu: (menuOpen) => set({ menuOpen }),
  setAbout: (aboutOpen) => set({ aboutOpen, menuOpen: false }),
  setSceneReady: () => set({ sceneReady: true }),
  markInteracted: () => set((s) => (s.hasInteracted ? s : { hasInteracted: true })),
  setReducedMotion: (reducedMotion) => set({ reducedMotion }),
  downgrade: () => {
    const i = TIERS.indexOf(get().quality)
    if (i > 0) set({ quality: TIERS[i - 1] })
  },
  upgrade: () => {
    const { quality, maxQuality } = get()
    const i = TIERS.indexOf(quality)
    if (i < TIERS.indexOf(maxQuality)) set({ quality: TIERS[i + 1] })
  },
}))
