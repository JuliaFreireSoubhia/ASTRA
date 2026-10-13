import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Color, DoubleSide, MathUtils, Vector3, type Mesh } from 'three'
import type { CelestialBody } from '../types/celestial'
import { ringsFragment, ringsVertex } from '../shaders/rings'
import { SUN_POS } from './sunPosition'

export function Rings({ body }: { body: CelestialBody }) {
  const ref = useRef<Mesh>(null)
  const rings = body.rings!
  const inner = body.radius * rings.inner
  const outer = body.radius * rings.outer
  const tilt = MathUtils.degToRad(body.rotation.axialTiltDeg)

  const uniforms = useMemo(
    () => ({
      uInner: { value: inner },
      uOuter: { value: outer },
      uPlanetR: { value: body.radius },
      uColor: { value: new Color(rings.color) },
      uSunPos: { value: SUN_POS },
      uPlanetPos: { value: new Vector3() },
      uAxis: { value: new Vector3(-Math.sin(tilt), Math.cos(tilt), 0) },
    }),
    [inner, outer, body.radius, rings.color, tilt],
  )

  // o anel está centrado no planeta: sua origem = centro do planeta (usado para a sombra do planeta sobre o anel)
  useFrame(() => {
    ref.current?.getWorldPosition(uniforms.uPlanetPos.value)
  })

  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
      <ringGeometry args={[inner, outer, 192, 1]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={ringsVertex}
        fragmentShader={ringsFragment}
        side={DoubleSide}
        transparent
        depthWrite={false}
      />
    </mesh>
  )
}
