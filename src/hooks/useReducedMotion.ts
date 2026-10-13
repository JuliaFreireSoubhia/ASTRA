import { useEffect } from 'react'
import { useAstra } from '../store/useAstra'

/** Sincroniza prefers-reduced-motion com a store (a cena lê via getState, sem re-render). */
export function useReducedMotionSync() {
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const apply = () => useAstra.getState().setReducedMotion(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])
}
