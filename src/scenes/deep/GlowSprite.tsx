import { useMemo } from 'react'
import { AdditiveBlending, Color } from 'three'
import { Billboard } from '@react-three/drei'
import { glowFragment, glowVertex } from '../../shaders/deep'

/** Brilho radial que sempre encara a câmera (plano com shader; sem textura). */
export function GlowSprite({ size, color, intensity = 1 }: { size: number; color: string; intensity?: number }) {
  const uniforms = useMemo(() => ({ uColor: { value: new Color(color) }, uI: { value: intensity } }), [color, intensity])
  return (
    <Billboard>
      <mesh raycast={() => null}>
        <planeGeometry args={[size * 2, size * 2]} />
        <shaderMaterial uniforms={uniforms} vertexShader={glowVertex} fragmentShader={glowFragment} transparent depthWrite={false} blending={AdditiveBlending} />
      </mesh>
    </Billboard>
  )
}
