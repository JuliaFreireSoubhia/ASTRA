import { useEffect } from 'react'
import { useAstra } from '../store/useAstra'

/** ← → trocam de corpo, Esc volta, R reseta a câmera. */
export function useKeyboardNav() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const t = e.target as HTMLElement | null
      if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return
      const s = useAstra.getState()

      if (e.key === 'Escape') {
        if (s.aboutOpen) s.setAbout(false)
        else if (s.menuOpen) s.setMenu(false)
        else if (s.selectedId) s.deselect()
        return
      }
      if (s.phase !== 'explore' || s.aboutOpen || s.menuOpen) return
      if (e.key === 'ArrowRight') s.step(1)
      else if (e.key === 'ArrowLeft') s.step(-1)
      else if (e.key.toLowerCase() === 'r') s.resetView()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}
