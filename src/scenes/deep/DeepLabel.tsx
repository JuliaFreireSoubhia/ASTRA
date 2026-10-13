import { Html } from '@react-three/drei'
import { useAstra } from '../../store/useAstra'

/** Rótulo (botão real) de um objeto de Deep Space. */
export function DeepLabel({ id, name, y }: { id: string; name: string; y: number }) {
  const phase = useAstra((s) => s.phase)
  const realm = useAstra((s) => s.realm)
  const selectedId = useAstra((s) => s.selectedId)
  const select = useAstra((s) => s.select)
  const show = phase === 'explore' && realm === 'deep' && selectedId === null
  return (
    <Html position={[0, y, 0]} center zIndexRange={[10, 0]} pointerEvents="none">
      <button
        type="button"
        className={`scene-label${show ? ' is-visible' : ''}`}
        tabIndex={show ? 0 : -1}
        aria-hidden={!show}
        aria-label={`Travel to ${name}`}
        onClick={() => select(id)}
      >
        {name}
      </button>
    </Html>
  )
}
