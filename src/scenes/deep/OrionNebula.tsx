import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, type Group } from 'three'
import type { DeepNebula } from '../../types/celestial'
import { useAstra } from '../../store/useAstra'
import { QUALITY } from '../../lib/quality'
import { deepPosition } from '../../lib/scale'
import { galaxyFragment, galaxyVertex, puffFragment, puffVertex } from '../../shaders/deep'
import { genNebula } from './generate'
import { GlowSprite } from './GlowSprite'
import { DeepLabel } from './DeepLabel'

/** Nebulosa volumétrica: centenas de nuvens translúcidas em 3D + estrelas jovens + brilho do Trapezium. */
export function OrionNebula({ obj }: { obj: DeepNebula }) {
  const q = QUALITY[useAstra((s) => s.quality)]
  const spin = useRef<Group>(null)
  const data = useMemo(() => genNebula(obj, q.nebulaPuffs, q.nebulaStars), [obj, q.nebulaPuffs, q.nebulaStars])
  const puffU = useMemo(() => ({ uPx: { value: 1 }, uRef: { value: obj.radius * 1.5 }, uMax: { value: q.puffMaxPx } }), [obj.radius, q.puffMaxPx])
  const starU = useMemo(() => ({ uPx: { value: 1 }, uRef: { value: obj.radius * 1.5 } }), [obj.radius])

  useFrame((state, dt) => {
    puffU.uPx.value = starU.uPx.value = state.viewport.dpr
    if (spin.current && !useAstra.getState().reducedMotion) spin.current.rotation.y += dt * 0.01
  })

  return (
    <group position={deepPosition(obj)}>
      <group ref={spin}>
        <points frustumCulled={false}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[data.gas.positions, 3]} />
            <bufferAttribute attach="attributes-aSize" args={[data.gas.sizes, 1]} />
            <bufferAttribute attach="attributes-aColor" args={[data.gas.colors, 3]} />
            <bufferAttribute attach="attributes-aAlpha" args={[data.gas.alphas!, 1]} />
          </bufferGeometry>
          <shaderMaterial uniforms={puffU} vertexShader={puffVertex} fragmentShader={puffFragment} transparent depthWrite={false} blending={AdditiveBlending} />
        </points>
        <points frustumCulled={false}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[data.stars.positions, 3]} />
            <bufferAttribute attach="attributes-aSize" args={[data.stars.sizes, 1]} />
            <bufferAttribute attach="attributes-aColor" args={[data.stars.colors, 3]} />
            <bufferAttribute attach="attributes-aBright" args={[data.stars.bright, 1]} />
          </bufferGeometry>
          <shaderMaterial uniforms={starU} vertexShader={galaxyVertex} fragmentShader={galaxyFragment} transparent depthWrite={false} blending={AdditiveBlending} />
        </points>
      </group>
      <GlowSprite size={obj.radius * 0.35} color={obj.palette.core} intensity={0.9} />
      <DeepLabel id={obj.id} name={obj.name} y={obj.radius * 0.6} />
    </group>
  )
}
