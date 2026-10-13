import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, NormalBlending, type Group } from 'three'
import type { DeepGalaxy } from '../../types/celestial'
import { useAstra } from '../../store/useAstra'
import { QUALITY } from '../../lib/quality'
import { deepPosition } from '../../lib/scale'
import { dustFragment, galaxyFragment, galaxyVertex } from '../../shaders/deep'
import { genGalaxyDust, genGalaxyStars } from './generate'
import { GlowSprite } from './GlowSprite'
import { DeepLabel } from './DeepLabel'

/** Galáxia em partículas (THREE.Points + shader: 1 draw call para dezenas de milhares de estrelas). */
export function Galaxy({ obj }: { obj: DeepGalaxy }) {
  const q = QUALITY[useAstra((s) => s.quality)]
  const spin = useRef<Group>(null)
  const pos = deepPosition(obj)
  const stars = useMemo(() => genGalaxyStars(obj, q.galaxyStars), [obj, q.galaxyStars])
  const dust = useMemo(() => genGalaxyDust(obj, q.galaxyDust), [obj, q.galaxyDust])
  const uniforms = useMemo(() => ({ uPx: { value: 1 }, uRef: { value: obj.radius * 1.4 } }), [obj.radius])

  useFrame((state, dt) => {
    uniforms.uPx.value = state.viewport.dpr
    if (spin.current && !useAstra.getState().reducedMotion) spin.current.rotation.y += dt * 0.012 // rotação muito lenta
  })

  return (
    <group position={pos}>
      <group rotation={[obj.tilt[0], 0, obj.tilt[1]]}>
        <group ref={spin}>
          <points frustumCulled={false}>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" args={[stars.positions, 3]} />
              <bufferAttribute attach="attributes-aSize" args={[stars.sizes, 1]} />
              <bufferAttribute attach="attributes-aColor" args={[stars.colors, 3]} />
              <bufferAttribute attach="attributes-aBright" args={[stars.bright, 1]} />
            </bufferGeometry>
            <shaderMaterial uniforms={uniforms} vertexShader={galaxyVertex} fragmentShader={galaxyFragment} transparent depthWrite={false} blending={AdditiveBlending} />
          </points>
          <points frustumCulled={false} renderOrder={2}>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" args={[dust.positions, 3]} />
              <bufferAttribute attach="attributes-aSize" args={[dust.sizes, 1]} />
              <bufferAttribute attach="attributes-aColor" args={[dust.colors, 3]} />
              <bufferAttribute attach="attributes-aBright" args={[dust.bright, 1]} />
            </bufferGeometry>
            <shaderMaterial uniforms={uniforms} vertexShader={galaxyVertex} fragmentShader={dustFragment} transparent depthWrite={false} blending={NormalBlending} />
          </points>
        </group>
      </group>
      {/* núcleo brilhante (HDR → bloom controlado) */}
      <GlowSprite size={obj.radius * 0.5} color={obj.colors.core} intensity={1.5} />
      <GlowSprite size={obj.radius * 0.12} color="#fff4de" intensity={2.2} />
      <DeepLabel id={obj.id} name={obj.name} y={obj.radius * 0.55} />
    </group>
  )
}
