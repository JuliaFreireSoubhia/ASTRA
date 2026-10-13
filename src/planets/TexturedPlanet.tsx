import { useTexture } from '@react-three/drei'
import { Color, SRGBColorSpace, type Texture } from 'three'
import type { Renderable } from './ProceduralPlanet'

/**
 * Usado quando `surface.textures` existe nos dados. Material PBR: map (cor), normalMap, roughnessMap,
 * emissiveMap (luzes noturnas) e bumpMap. Mapas de dados (normal/roughness/bump) ficam em espaço linear.
 */
export function TexturedPlanet({ body, segments }: { body: Renderable; segments: number }) {
  const t = body.surface.textures!
  const urls: Record<string, string> = { map: t.map }
  if (t.normal) urls.normalMap = t.normal
  if (t.roughness) urls.roughnessMap = t.roughness
  if (t.emissive) urls.emissiveMap = t.emissive
  if (t.bump) urls.bumpMap = t.bump
  const tex = useTexture(urls) as Record<string, Texture>
  if (tex.emissiveMap) tex.emissiveMap.colorSpace = SRGBColorSpace

  return (
    <mesh>
      <sphereGeometry args={[body.radius, segments, Math.round(segments / 2)]} />
      <meshStandardMaterial
        {...tex}
        roughness={tex.roughnessMap ? 1 : 0.85}
        metalness={0}
        bumpScale={0.6}
        emissive={tex.emissiveMap ? new Color('#ffffff') : new Color('#000000')}
        emissiveIntensity={1.2}
      />
    </mesh>
  )
}
