import { useAstra } from '../store/useAstra'
import { cameraApi } from '../lib/cameraApi'

const Icon = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" aria-hidden="true">
    <path d={d} />
  </svg>
)

export function ControlsHud() {
  const resetView = useAstra((s) => s.resetView)
  return (
    <div className="hud" role="group" aria-label="Camera controls">
      <button type="button" onClick={() => cameraApi.zoom(0.8)} aria-label="Zoom in">
        <Icon d="M12 5v14M5 12h14" />
      </button>
      <button type="button" onClick={() => cameraApi.zoom(1.25)} aria-label="Zoom out">
        <Icon d="M5 12h14" />
      </button>
      <button type="button" onClick={resetView} aria-label="Reset view (R)">
        <Icon d="M4 12a8 8 0 1 0 2.5-5.8M4 4v4h4" />
      </button>
    </div>
  )
}
