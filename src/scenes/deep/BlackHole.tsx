import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, Color, DoubleSide, MathUtils, Vector3, type Group } from 'three'
import { Billboard } from '@react-three/drei'
import type { DeepBlackHole } from '../../types/celestial'
import { useAstra } from '../../store/useAstra'
import { QUALITY } from '../../lib/quality'
import { sim } from '../../lib/sim'
import { lensState } from '../../lib/lens'
import { deepPosition } from '../../lib/scale'
import { mulberry32 } from '../../lib/rng'
import { bhPartFragment, bhPartVertex, diskFragment, diskVertex, haloFragment, glowVertex } from '../../shaders/deep'
import { DeepLabel } from './DeepLabel'

const INNER = 1.9 // raio interno do disco (em raios da sombra)
const OUTER = 7.5

const _w = new Vector3()

/**
 * Buraco negro (representação artística), composto por:
 *  1. esfera preta (sombra / horizonte)  2. disco de acreção em shader (turbulência, rotação diferencial, Doppler)
 *  3. halo de luz curvada (billboard)    4. partículas orbitando    5. lente gravitacional em pós-processamento (Effects)
 */
export function BlackHole({ obj }: { obj: DeepBlackHole }) {
  const q = QUALITY[useAstra((s) => s.quality)]
  const group = useRef<Group>(null)
  const R = obj.radius
  const pos = deepPosition(obj)

  const diskU = useMemo(() => ({ uTime: { value: 0 }, uR: { value: R }, uInner: { value: INNER }, uOuter: { value: OUTER }, uBH: { value: new Vector3() } }), [R])
  const haloU = useMemo(() => ({ uTime: { value: 0 }, uPlane: { value: 4.5 } }), [])
  const partU = useMemo(() => ({ uTime: { value: 0 }, uR: { value: R }, uPx: { value: 1 } }), [R])

  const parts = useMemo(() => {
    const rnd = mulberry32(99)
    const n = q.bhParticles
    const position = new Float32Array(n * 3) // exigido pelo Points (não usado: posição vem de aR/aPhase)
    const aR = new Float32Array(n), aPhase = new Float32Array(n), aY = new Float32Array(n), aSize = new Float32Array(n)
    for (let i = 0; i < n; i++) {
      aR[i] = INNER + Math.pow(rnd(), 1.4) * (OUTER - INNER - 0.5)
      aPhase[i] = rnd() * Math.PI * 2
      aY[i] = (rnd() - 0.5) * 0.35 * (0.4 + aR[i] * 0.12)
      aSize[i] = 0.8 + rnd() * 1.8
    }
    return { position, aR, aPhase, aY, aSize }
  }, [q.bhParticles])

  useFrame((state) => {
    const g = group.current
    if (!g) return
    const reduced = useAstra.getState().reducedMotion
    const t = reduced ? 0 : sim.t
    diskU.uTime.value = haloU.uTime.value = partU.uTime.value = t
    partU.uPx.value = state.viewport.dpr
    g.getWorldPosition(diskU.uBH.value)

    // intensidade da lente: cresce quando a câmera se aproxima (a lente só existe perto do buraco negro)
    const dist = state.camera.position.distanceTo(g.getWorldPosition(_w))
    const visible = g.parent?.visible !== false
    lensState.pos.copy(_w)
    lensState.radius = R
    lensState.target = visible ? 1 - MathUtils.smoothstep(dist, 16 * R, 46 * R) : 0
  })

  return (
    <group ref={group} position={pos}>
      <group rotation={[0, 0, 0.06]}>
        {/* 1. sombra */}
        <mesh>
          <sphereGeometry args={[R, 48, 32]} />
          <meshBasicMaterial color="#000000" />
        </mesh>
        {/* 2. disco */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
          <ringGeometry args={[R * INNER, R * OUTER, 256, 1]} />
          <shaderMaterial
            key={q.octaves}
            uniforms={diskU}
            vertexShader={diskVertex}
            fragmentShader={diskFragment}
            defines={{ OCTAVES: Math.min(q.octaves, 4) }}
            side={DoubleSide}
            transparent
            depthWrite={false}
            blending={AdditiveBlending}
          />
        </mesh>
        {/* 4. partículas */}
        <points frustumCulled={false}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[parts.position, 3]} />
            <bufferAttribute attach="attributes-aR" args={[parts.aR, 1]} />
            <bufferAttribute attach="attributes-aPhase" args={[parts.aPhase, 1]} />
            <bufferAttribute attach="attributes-aY" args={[parts.aY, 1]} />
            <bufferAttribute attach="attributes-aSize" args={[parts.aSize, 1]} />
          </bufferGeometry>
          <shaderMaterial uniforms={partU} vertexShader={bhPartVertex} fragmentShader={bhPartFragment} transparent depthWrite={false} blending={AdditiveBlending} />
        </points>
      </group>
      {/* 3. halo de luz curvada: sempre encara a câmera */}
      <Billboard>
        <mesh raycast={() => null}>
          <planeGeometry args={[R * 9, R * 9]} />
          <shaderMaterial
            key={q.octaves}
            uniforms={haloU}
            vertexShader={glowVertex}
            fragmentShader={haloFragment}
            defines={{ OCTAVES: 3 }}
            transparent
            depthWrite={false}
            blending={AdditiveBlending}
          />
        </mesh>
      </Billboard>
      <DeepLabel id={obj.id} name={obj.name} y={R * 3} />
    </group>
  )
}
