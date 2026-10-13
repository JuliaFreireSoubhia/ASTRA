import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Color, DataTexture, MathUtils, Vector3, Vector4, type Mesh, type ShaderMaterial } from 'three'
import type { AtmosphereStyle, RingStyle, SurfaceStyle } from '../types/celestial'
import { KIND, planetFragment, planetVertex } from '../shaders/planet'
import { sim } from '../lib/sim'
import { acquireEarthMask, releaseEarthMask } from '../lib/earthMask'
import { SUN_POS } from './sunPosition'

/** O mínimo que o renderizador precisa: serve para planetas e estrelas de Deep Space. */
export interface Renderable {
  radius: number
  surface: SurfaceStyle
  atmosphere?: AtmosphereStyle
  rings?: RingStyle
  rotation?: { axialTiltDeg: number }
}

interface Props { body: Renderable; segments: number; octaves: number }

const FILL = { rings: 0, mare: 1, plains: 2, smooth: 3, dusk: 4 } as const
const rad = MathUtils.degToRad

// textura 1x1 usada quando não há máscara (evita sampler nulo). Estática: vive o app inteiro.
const DUMMY = new DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1)
DUMMY.needsUpdate = true

export function ProceduralPlanet({ body, segments, octaves }: Props) {
  const mat = useRef<ShaderMaterial>(null)
  const mesh = useRef<Mesh>(null)
  const { surface, atmosphere, rings } = body
  const tilt = MathUtils.degToRad(body.rotation?.axialTiltDeg ?? 0)

  const uniforms = useMemo(() => {
    const s = surface.spot
    return {
      uKind: { value: KIND[surface.kind] },
      uColA: { value: new Color(surface.colors[0]) },
      uColB: { value: new Color(surface.colors[1]) },
      uColC: { value: new Color(surface.colors[2]) },
      uScale: { value: surface.scale ?? 2 },
      uBands: { value: surface.bands ?? 6 },
      uWarp: { value: surface.warp ?? 0 },
      uSeed: { value: surface.seed ?? 0 },
      uTime: { value: 0 },
      uRelief: { value: surface.relief ?? 0 },
      uCraters: { value: surface.craters ?? 0 },
      uSpot: { value: s ? new Vector4(MathUtils.degToRad(s.lonDeg), MathUtils.degToRad(s.latDeg), MathUtils.degToRad(s.sizeDeg[0]), MathUtils.degToRad(s.sizeDeg[1])) : new Vector4(0, 0, 1, 1) },
      uSpotCol: { value: new Color(s?.color ?? '#000000') },
      uSpotK: { value: s?.strength ?? 0 },
      uSpotH: { value: s?.height ?? 0 },
      uSunPos: { value: SUN_POS },
      uAtmoColor: { value: new Color(atmosphere?.color ?? '#000000') },
      uAtmoK: { value: atmosphere?.rim ?? 0 },
      uTwilight: { value: atmosphere?.twilight ?? 0 },
      uMask: { value: DUMMY as import('three').Texture },
      // bacias nomeadas (Lua / Mercúrio): lon, lat, raio em radianos + tipo de preenchimento. Sempre 12 slots.
      uBasin: {
        value: Array.from({ length: 12 }, (_, i) => {
          const b = surface.basins?.[i]
          return b ? new Vector4(rad(b.lonDeg), rad(b.latDeg), rad(b.radiusDeg), FILL[b.fill]) : new Vector4(0, 0, 1, 0)
        }),
      },
      uBasinN: { value: Math.min(12, surface.basins?.length ?? 0) },
      uMare: { value: surface.mare ?? 0 },
      uPlains: { value: surface.plains ?? 0 },
      uScarps: { value: surface.scarps ?? 0 },
      uRingOn: { value: rings ? 1 : 0 },
      uRingIn: { value: rings ? body.radius * rings.inner : 0 },
      uRingOut: { value: rings ? body.radius * rings.outer : 1 },
      uRingAxis: { value: new Vector3(-Math.sin(tilt), Math.cos(tilt), 0) },
      uPlanetPos: { value: new Vector3() },
    }
  }, [surface, atmosphere, rings, body.radius, tilt])

  // máscara da Terra: criada sob demanda e liberada (dispose) quando o último planeta que a usa sai
  useLayoutEffect(() => {
    if (surface.kind !== 'earth') return
    uniforms.uMask.value = acquireEarthMask()
    return () => {
      uniforms.uMask.value = DUMMY
      releaseEarthMask()
    }
  }, [surface.kind, uniforms])

  useFrame(() => {
    if (mat.current) mat.current.uniforms.uTime.value = sim.t
    if (rings && mesh.current) mesh.current.getWorldPosition(uniforms.uPlanetPos.value)
  })

  return (
    <mesh ref={mesh}>
      <sphereGeometry args={[body.radius, segments, Math.round(segments / 2)]} />
      <shaderMaterial
        ref={mat}
        key={octaves}
        uniforms={uniforms}
        vertexShader={planetVertex}
        fragmentShader={planetFragment}
        defines={{ OCTAVES: octaves }}
      />
    </mesh>
  )
}
