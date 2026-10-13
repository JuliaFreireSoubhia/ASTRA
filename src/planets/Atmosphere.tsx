import { useMemo } from 'react'
import { AdditiveBlending, BackSide, Color } from 'three'
import type { AtmosphereStyle } from '../types/celestial'
import { atmosphereFragment, atmosphereVertex } from '../shaders/atmosphere'
import { SUN_POS } from './sunPosition'

interface Props {
  radius: number
  style: AtmosphereStyle
  segments: number
  /** O Sol brilha por si só: halo sem dependência de iluminação */
  emissive?: boolean
}

export function Atmosphere({ radius, style, segments, emissive }: Props) {
  const scale = style.scale ?? 1.15
  const uniforms = useMemo(
    () => ({
      uColor: { value: new Color(style.color) },
      uSunPos: { value: SUN_POS },
      uIntensity: { value: style.intensity },
      uPower: { value: emissive ? 2.2 : 2.0 },
      uAmax: { value: Math.sqrt(1 - 1 / (scale * scale)) },
      uLit: { value: emissive ? 0 : 1 },
      uTwi: { value: style.twilight ?? 0.4 },
    }),
    [style, scale, emissive],
  )

  return (
    // raycast nulo: o halo nunca "rouba" cliques do planeta
    <mesh raycast={() => null}>
      <sphereGeometry args={[radius * scale, Math.max(32, Math.round(segments / 1.5)), 32]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={atmosphereVertex}
        fragmentShader={atmosphereFragment}
        side={BackSide}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </mesh>
  )
}
