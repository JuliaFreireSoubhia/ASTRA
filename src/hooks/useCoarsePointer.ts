import { useSyncExternalStore } from 'react'

const query = '(pointer: coarse)'
const subscribe = (cb: () => void) => {
  const mq = window.matchMedia(query)
  mq.addEventListener('change', cb)
  return () => mq.removeEventListener('change', cb)
}
export const useCoarsePointer = () =>
  useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => false)
