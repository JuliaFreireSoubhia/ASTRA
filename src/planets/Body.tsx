import { Suspense, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { MathUtils, Vector3, type Group } from 'three'
import type { CelestialBody } from '../types/celestial'
import { useAstra } from '../store/useAstra'
import { QUALITY } from '../lib/quality'
import { sim } from '../lib/sim'
import { bodyPosition, orbitAngle, spinSpeed } from '../lib/orbit'
import { ProceduralPlanet } from './ProceduralPlanet'
import { TexturedPlanet } from './TexturedPlanet'
import { Atmosphere } from './Atmosphere'
import { Clouds } from './Clouds'
import { Rings } from './Rings'
import { PoiMarkers } from './PoiMarkers'

/**
 * Um corpo: posição orbital → inclinação axial → rotação → superfície/atmosfera/anéis/POIs.
 * Todo o movimento é imperativo dentro de useFrame (nada de setState por frame).
 */
export function Body({ body }: { body: CelestialBody }) {
  const orbitRef = useRef<Group>(null)
  const tiltRef = useRef<Group>(null)
  const spinRef = useRef<Group>(null)
  const cloudRef = useRef<Group>(null)
  const spinFactor = useRef(1)
  const pos = useMemo(() => new Vector3(), [])
  const spin = useMemo(() => spinSpeed(body), [body])
  const tilt = MathUtils.degToRad(body.rotation.axialTiltDeg)

  const q = QUALITY[useAstra((s) => s.quality)]
  const phase = useAstra((s) => s.phase)
  const realm = useAstra((s) => s.realm)
  const selectedId = useAstra((s) => s.selectedId)
  const select = useAstra((s) => s.select)
  const showLabel = phase === 'explore' && realm === 'solar' && selectedId === null
  const isSun = body.kind === 'star'

  useFrame((_, dt) => {
    if (!orbitRef.current) return
    orbitRef.current.position.copy(bodyPosition(body, sim.t, pos))
    // Rotação síncrona (Lua): a face +X (lon 0) aponta SEMPRE para o corpo-pai. O objeto gira em +θ em torno de Y
    // enquanto a órbita avança de +X para +Z, então o ângulo da face é −θ e precisa ser (órbita + π).
    if (body.rotation.locked) {
      if (spinRef.current) spinRef.current.rotation.y = -(orbitAngle(body, sim.t) + Math.PI)
      if (cloudRef.current) cloudRef.current.rotation.y = spinRef.current?.rotation.y ?? 0
      return
    }
    if (useAstra.getState().reducedMotion) return
    const step = Math.min(dt, 0.1)
    // ao inspecionar um POI, a rotação desacelera até parar (o ponto fica em frente à câmera)
    const s = useAstra.getState()
    const hold = s.selectedId === body.id && s.selectedPoiId !== null
    spinFactor.current = MathUtils.damp(spinFactor.current, hold ? 0 : 1, 3, step)
    if (spinRef.current) spinRef.current.rotation.y += spin * step * spinFactor.current
    if (cloudRef.current) cloudRef.current.rotation.y += spin * step * 1.08 * spinFactor.current
  })

  const canSelect = phase === 'explore' && selectedId !== body.id

  return (
    <group ref={orbitRef}>
      <group
        ref={tiltRef}
        rotation={[0, 0, tilt]}
        onClick={(e) => {
          if (e.delta > 6 || !canSelect) return // arrasto ≠ clique
          e.stopPropagation()
          select(body.id)
        }}
        onPointerOver={(e) => {
          if (!canSelect) return
          e.stopPropagation()
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          document.body.style.cursor = ''
        }}
      >
        <group ref={spinRef}>
          {body.surface.textures ? (
            <Suspense fallback={<ProceduralPlanet body={body} segments={q.segments} octaves={q.octaves} />}>
              <TexturedPlanet body={body} segments={q.segments} />
            </Suspense>
          ) : (
            <ProceduralPlanet body={body} segments={q.segments} octaves={q.octaves} />
          )}
          {body.pois && <PoiMarkers body={body} center={orbitRef} />}
        </group>
        {body.clouds && q.clouds && <Clouds ref={cloudRef} radius={body.radius} segments={q.segments} octaves={q.octaves} />}
        {body.atmosphere && <Atmosphere radius={body.radius} style={body.atmosphere} segments={q.segments} emissive={isSun} />}
        {body.rings && <Rings body={body} />}
      </group>

      {/* Rótulo = botão real: focável por teclado, lido por leitores de tela */}
      <Html
        position={[0, body.radius + (body.radius < 0.3 ? 0.45 : 0.9) + (body.rings ? body.radius * 0.5 : 0), 0]}
        center
        zIndexRange={[10, 0]}
        pointerEvents="none"
      >
        <button
          type="button"
          className={`scene-label${showLabel ? ' is-visible' : ''}`}
          tabIndex={showLabel ? 0 : -1}
          aria-hidden={!showLabel}
          aria-label={`Travel to ${body.name}`}
          onClick={() => select(body.id)}
        >
          {body.name}
        </button>
      </Html>
    </group>
  )
}
