import { useAstra } from '../store/useAstra'
import { useCoarsePointer } from '../hooks/useCoarsePointer'

/** Dicas visuais que somem na primeira interação real com a câmera. */
export function Hints() {
  const interacted = useAstra((s) => s.hasInteracted)
  const ready = useAstra((s) => s.sceneReady)
  const touch = useCoarsePointer()
  return (
    <div className={`hints${ready && !interacted ? ' is-visible' : ''}`} aria-hidden="true">
      <span>Drag to rotate</span>
      <span>{touch ? 'Pinch to zoom' : 'Scroll to zoom'}</span>
    </div>
  )
}
