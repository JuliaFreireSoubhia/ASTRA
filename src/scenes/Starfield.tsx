import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import {
  AdditiveBlending,
  BackSide,
  CubeCamera,
  HalfFloatType,
  LinearFilter,
  MathUtils,
  Mesh,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  WebGLCubeRenderTarget,
  type Group,
} from 'three'
import { useAstra } from '../store/useAstra'
import { QUALITY } from '../lib/quality'
import { nebulaFragment, nebulaVertex } from '../shaders/nebula'
import { starsFragment, starsVertex } from '../shaders/stars'

/* ---------- util ---------- */
function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/* ---------- Nebulosa: assada UMA vez em um cubemap e usada como scene.background ---------- */
export function Nebula() {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  const maxQuality = useAstra((s) => s.maxQuality)

  useEffect(() => {
    const size = maxQuality === 'high' ? 1024 : 512
    const rt = new WebGLCubeRenderTarget(size, {
      type: HalfFloatType, // evita banding em gradientes escuros
      generateMipmaps: false,
      minFilter: LinearFilter,
      magFilter: LinearFilter,
    })
    const bake = new Scene()
    const geo = new SphereGeometry(5, 64, 32)
    const mat = new ShaderMaterial({
      vertexShader: nebulaVertex,
      fragmentShader: nebulaFragment,
      side: BackSide,
      depthTest: false,
      depthWrite: false,
      defines: { OCTAVES: 5 },
    })
    bake.add(new Mesh(geo, mat))
    new CubeCamera(0.1, 10, rt).update(gl, bake)
    scene.background = rt.texture

    return () => {
      scene.background = null
      rt.dispose()
      geo.dispose()
      mat.dispose()
    }
  }, [gl, scene, maxQuality])

  return null
}

/* ---------- Estrelas: Points + shader, segue a câmera (parece estar no infinito) ---------- */
export function Stars() {
  const q = QUALITY[useAstra((s) => s.quality)]
  const group = useRef<Group>(null)

  const data = useMemo(() => {
    const rnd = mulberry32(1337)
    const n = q.stars
    const positions = new Float32Array(n * 3)
    const sizes = new Float32Array(n)
    const seeds = new Float32Array(n)
    const colors = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) {
      const u = rnd() * 2 - 1
      const th = rnd() * Math.PI * 2
      const s = Math.sqrt(1 - u * u)
      const r = 600 + rnd() * 300
      positions.set([s * Math.cos(th) * r, u * r, s * Math.sin(th) * r], i * 3)
      sizes[i] = 1.1 + Math.pow(rnd(), 7) * 3.2 // maioria pequena, poucas brilhantes
      seeds[i] = rnd()
      const k = rnd()
      const c = k < 0.18 ? [0.62, 0.74, 1.0] : k < 0.3 ? [1.0, 0.84, 0.66] : [0.92, 0.95, 1.0]
      colors.set(c, i * 3)
    }
    return { positions, sizes, seeds, colors }
  }, [q.stars])

  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uPx: { value: 1 } }), [])

  useFrame((state, dt) => {
    const g = group.current
    if (!g) return
    const reduced = useAstra.getState().reducedMotion
    g.position.copy(state.camera.position)
    uniforms.uPx.value = state.viewport.dpr
    if (reduced) return
    uniforms.uTime.value = state.clock.elapsedTime
    // paralaxe sutil com o mouse
    g.rotation.x = MathUtils.damp(g.rotation.x, -state.pointer.y * 0.02, 2, Math.min(dt, 0.1))
    g.rotation.y = MathUtils.damp(g.rotation.y, state.pointer.x * 0.03, 2, Math.min(dt, 0.1))
  })

  return (
    <group ref={group}>
      <points frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[data.positions, 3]} />
          <bufferAttribute attach="attributes-aSize" args={[data.sizes, 1]} />
          <bufferAttribute attach="attributes-aSeed" args={[data.seeds, 1]} />
          <bufferAttribute attach="attributes-aColor" args={[data.colors, 3]} />
        </bufferGeometry>
        <shaderMaterial
          uniforms={uniforms}
          vertexShader={starsVertex}
          fragmentShader={starsFragment}
          transparent
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </points>
    </group>
  )
}

/* ---------- Poeira cósmica: partículas REAIS no espaço → dão paralaxe durante as viagens ---------- */
export function Dust() {
  const q = QUALITY[useAstra((s) => s.quality)]
  const positions = useMemo(() => {
    const rnd = mulberry32(42)
    const arr = new Float32Array(q.dust * 3)
    for (let i = 0; i < q.dust; i++) {
      const r = 6 + Math.pow(rnd(), 0.7) * 130
      const a = rnd() * Math.PI * 2
      arr.set([Math.cos(a) * r, (rnd() - 0.5) * 36, Math.sin(a) * r], i * 3)
    }
    return arr
  }, [q.dust])

  return (
    <points frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.1} sizeAttenuation color="#a9bfff" transparent opacity={0.5} depthWrite={false} />
    </points>
  )
}
