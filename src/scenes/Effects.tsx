import { useRef, type ReactElement, type RefObject } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Bloom, EffectComposer, wrapEffect } from '@react-three/postprocessing'
import { MathUtils, Vector3, type PerspectiveCamera } from 'three'
import { useAstra } from '../store/useAstra'
import { QUALITY } from '../lib/quality'
import { lensState } from '../lib/lens'
import { LensEffect } from './LensEffect'

const Lens = wrapEffect(LensEffect)
const _p = new Vector3()
const _q = new Vector3()
const _r = new Vector3()

/** Projeta o buraco negro na tela e alimenta o efeito de lente (centro, raio da sombra, intensidade). */
function LensDriver({ effect }: { effect: RefObject<LensEffect | null> }) {
  const camera = useThree((s) => s.camera) as PerspectiveCamera
  const size = useThree((s) => s.size)
  const strength = useRef(0)
  useFrame((_, dt) => {
    const e = effect.current
    if (!e) return
    strength.current = MathUtils.damp(strength.current, lensState.target, 3, Math.min(dt, 0.1))
    const u = e.uniforms
    u.get('uStrength')!.value = strength.current
    if (strength.current < 0.002) return
    _p.copy(lensState.pos).project(camera)
    // vetor "direita" da câmera para medir o raio em tela
    _r.setFromMatrixColumn(camera.matrixWorld, 0).multiplyScalar(lensState.radius)
    _q.copy(lensState.pos).add(_r).project(camera)
    const aspect = size.width / size.height
    const dx = (_q.x - _p.x) * 0.5 * aspect
    const dy = (_q.y - _p.y) * 0.5
    ;(u.get('uCenter')!.value as import('three').Vector2).set(_p.x * 0.5 + 0.5, _p.y * 0.5 + 0.5)
    u.get('uShadow')!.value = Math.hypot(dx, dy)
    u.get('uAspect')!.value = aspect
  })
  return null
}

/**
 * Bloom só onde a cor passa de 1.0 (Sol, estrelas, disco). Contido de propósito (intensidade 0.55).
 * Lente gravitacional: só montada depois que Deep Space foi carregado; custo ≈ 0 com strength = 0.
 */
export function Effects() {
  const q = QUALITY[useAstra((s) => s.quality)]
  const deep = useAstra((s) => s.deepRequested)
  const lens = useRef<LensEffect>(null)
  if (!q.bloom && !deep) return null
  // a lente vem ANTES do bloom: o bloom é calculado sobre a imagem já defletida
  const fx: ReactElement[] = []
  if (deep) fx.push(<Lens key="lens" ref={lens} />)
  if (q.bloom) fx.push(<Bloom key="bloom" intensity={0.55} luminanceThreshold={1} luminanceSmoothing={0.2} mipmapBlur radius={0.65} />)
  return (
    <>
      <EffectComposer multisampling={q.msaa} enableNormalPass={false}>
        {fx}
      </EffectComposer>
      {deep && <LensDriver effect={lens} />}
    </>
  )
}
