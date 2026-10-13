import { useAstra } from '../store/useAstra'

export function Loader() {
  const ready = useAstra((s) => s.sceneReady)
  return (
    <div className={`loader${ready ? ' is-done' : ''}`} role="status" aria-live="polite">
      <span className="loader-ring" aria-hidden="true" />
      <span className="loader-text">{ready ? '' : 'Calibrating optics'}</span>
    </div>
  )
}
