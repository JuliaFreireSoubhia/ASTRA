import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import type { DeepStar } from '../../types/celestial'
import { useAstra } from '../../store/useAstra'
import { QUALITY } from '../../lib/quality'
import { deepPosition } from '../../lib/scale'
import { ProceduralPlanet } from '../../planets/ProceduralPlanet'
import { Atmosphere } from '../../planets/Atmosphere'
import { GlowSprite } from './GlowSprite'
import { DeepLabel } from './DeepLabel'

/** Estrela = esfera emissiva (mesmo shader do Sol) + halo + brilho billboard. Polaris pulsa levemente (Cefeida). */
export function StarObject({ obj }: { obj: DeepStar }) {
  const q = QUALITY[useAstra((s) => s.quality)]
  const pulse = useRef<Group>(null)
  useFrame(({ clock }) => {
    if (!obj.pulse || !pulse.current || useAstra.getState().reducedMotion) return
    const s = 1 + obj.pulse * Math.sin(clock.elapsedTime * 1.6)
    pulse.current.scale.setScalar(s)
  })
  return (
    <group position={deepPosition(obj)}>
      <group ref={pulse}>
        <ProceduralPlanet body={obj} segments={Math.min(q.segments, 64)} octaves={q.octaves} />
        {obj.atmosphere && <Atmosphere radius={obj.radius} style={obj.atmosphere} segments={48} emissive />}
        <GlowSprite size={obj.glow.size} color={obj.glow.color} intensity={obj.glow.intensity} />
      </group>
      <DeepLabel id={obj.id} name={obj.name} y={obj.radius * 1.6 + 8} />
    </group>
  )
}
