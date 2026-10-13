import { forwardRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group, ShaderMaterial } from 'three'
import { useRef } from 'react'
import { cloudsFragment, planetVertex } from '../shaders/planet'
import { sim } from '../lib/sim'
import { SUN_POS } from './sunPosition'

interface Props {
  radius: number
  segments: number
  octaves: number
}

export const Clouds = forwardRef<Group, Props>(function Clouds({ radius, segments, octaves }, ref) {
  const mat = useRef<ShaderMaterial>(null)
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uSunPos: { value: SUN_POS } }), [])
  useFrame(() => {
    if (mat.current) mat.current.uniforms.uTime.value = sim.t
  })
  return (
    <group ref={ref}>
      <mesh raycast={() => null}>
        <sphereGeometry args={[radius * 1.012, segments, Math.round(segments / 2)]} />
        <shaderMaterial
          ref={mat}
          key={octaves}
          uniforms={uniforms}
          vertexShader={planetVertex}
          fragmentShader={cloudsFragment}
          defines={{ OCTAVES: Math.min(octaves, 4) }}
          transparent
          depthWrite={false}
        />
      </mesh>
    </group>
  )
})
