import { lazy, Suspense, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import { useAstra } from '../store/useAstra'
import { QUALITY } from '../lib/quality'
import { Dust, Nebula, Stars } from './Starfield'
import { SolarSystem } from './SolarSystem'
import { CameraRig, BASE_FOV } from './CameraRig'
import { Effects } from './Effects'

// Deep Space é um chunk separado: só baixa/monta quando necessário (ou no tempo ocioso)
const loadDeep = () => import('./deep/DeepSpace')
const DeepSpace = lazy(loadDeep)

/**
 * UM único <Canvas> para o site inteiro. Intro → Sistema Solar → Deep Space → galáxia são movimentos
 * de câmera dentro da mesma cena: é isso que cria a sensação de viagem contínua entre escalas.
 */
export default function Universe() {
  const quality = useAstra((s) => s.quality)
  const deepRequested = useAstra((s) => s.deepRequested)
  const ready = useAstra((s) => s.sceneReady)
  const q = QUALITY[quality]
  const { downgrade, upgrade, setSceneReady, requestDeep } = useAstra.getState()

  // Pré-carrega o chunk no tempo ocioso; em dispositivos fracos só monta sob demanda
  useEffect(() => {
    if (!ready) return
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void }
    const run = () => {
      void loadDeep()
      if (useAstra.getState().maxQuality !== 'low') requestDeep()
    }
    const id = w.requestIdleCallback ? w.requestIdleCallback(run, { timeout: 6000 }) : window.setTimeout(run, 4000)
    return () => (w.cancelIdleCallback ? w.cancelIdleCallback(id) : window.clearTimeout(id))
  }, [ready, requestDeep])

  return (
    <Canvas
      role="group"
      aria-label="Interactive 3D view of the Solar System and deep space. Use the object buttons or arrow keys to travel between bodies."
      style={{ position: 'absolute', inset: 0 }}
      dpr={q.dpr}
      flat
      gl={{ antialias: true, powerPreference: 'high-performance', alpha: false }}
      camera={{ fov: BASE_FOV, near: 0.1, far: 60000, position: [0, 4, 12] }}
      onCreated={() => setSceneReady()}
    >
      <PerformanceMonitor flipflops={3} onDecline={downgrade} onIncline={upgrade} />
      <Nebula />
      <Stars />
      <Dust />
      <SolarSystem />
      {deepRequested && (
        <Suspense fallback={null}>
          <DeepSpace />
        </Suspense>
      )}
      <CameraRig />
      <Effects />
    </Canvas>
  )
}
