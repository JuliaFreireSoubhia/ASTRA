import { useEffect, useRef } from 'react'
import { OrbitControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { MathUtils, Vector3, type PerspectiveCamera } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { getBody, getDeep, getEntry, isDeep } from '../data'
import type { CelestialBody } from '../types/celestial'
import { useAstra } from '../store/useAstra'
import { sim } from '../lib/sim'
import { cameraApi } from '../lib/cameraApi'
import { bodyPosition, fitDistance, visualRadius } from '../lib/orbit'
import { deepPosition } from '../lib/scale'
import { latLonToVec, poiRegistry } from '../lib/poiRegistry'

export const BASE_FOV = 45
const TAN = Math.tan(MathUtils.degToRad(BASE_FOV / 2))
const Y_AXIS = new Vector3(0, 1, 0)
const PANEL_W = 380 // deve casar com --panel-w no CSS
const DESKTOP_MIN = 900 // breakpoint em que o painel vira lateral

// Visão geral do Deep Space: câmera "saiu" do Sistema Solar e olha para o espaço profundo
const DEEP_TARGET = new Vector3(0, 0, -2600)
const DEEP_CAM = new Vector3(0, 800, 2300)

const easeInOutCubic = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)
const easeInOutQuart = (x: number) => (x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2)

interface PoiFocus { body: CelestialBody; id: string; dist: number }
interface Focus {
  body: CelestialBody | null // corpo em órbita (alvo móvel)
  fixed: Vector3 | null // alvo fixo (visão geral, Deep Space)
  offset: Vector3 // câmera = alvo + offset
  min: number
  max: number
  poi: PoiFocus | null // se definido, o offset é recalculado a partir da posição do ponto
}

interface Tween {
  t: number
  dur: number
  fromPos: Vector3
  fromTarget: Vector3
  arc: number
  fovPulse: number
  ease: (x: number) => number
  focus: Focus
}

const _tmp = new Vector3()
const _dir = new Vector3()

function poiDirection(f: PoiFocus, planetPos: Vector3, out: Vector3): Vector3 {
  const marker = poiRegistry.get(`${f.body.id}:${f.id}`)
  if (marker) {
    marker.getWorldPosition(out)
    out.sub(planetPos)
    if (out.lengthSq() > 1e-8) return out.normalize()
  }
  const d = f.body.pois?.find((p) => p.id === f.id)
  if (!d) return out.set(0, 0, 1)
  const v = latLonToVec(d.lat, d.lon)
  return out.set(v.x, v.y, v.z)
}

function computeFocus(key: string, aspect: number, hero: boolean): Focus {
  if (key === 'overview') {
    // Enquadra a órbita de Netuno; em retrato (celular) limita e deixa o usuário dar zoom out
    const d = MathUtils.clamp(84 / (0.9 * TAN * aspect), 105, 300)
    const el = MathUtils.degToRad(24)
    return { body: null, fixed: new Vector3(), offset: new Vector3(0, Math.sin(el) * d, Math.cos(el) * d), min: 14, max: 380, poi: null }
  }
  if (key === 'deep-overview') {
    return { body: null, fixed: DEEP_TARGET, offset: DEEP_CAM.clone().sub(DEEP_TARGET), min: 300, max: 40000, poi: null }
  }
  if (key.startsWith('deep:')) {
    const o = getDeep(key.slice(5))!
    const pos = deepPosition(o)
    // parte da linha de visão do Sistema Solar para o objeto, gira em azimute e eleva
    const base = pos.clone().negate().normalize().applyAxisAngle(Y_AXIS, MathUtils.degToRad(o.view.azimuthDeg))
    const el = MathUtils.degToRad(o.view.elevationDeg)
    const hz = new Vector3(base.x, 0, base.z).normalize().multiplyScalar(Math.cos(el))
    const offset = new Vector3(hz.x, Math.sin(el), hz.z).multiplyScalar(o.view.distance)
    return { body: null, fixed: pos, offset, min: o.view.distance * (o.view.minFactor ?? 0.3), max: o.view.distance * 6, poi: null }
  }

  const [bodyId, poiId] = key.split('#')
  const body = getBody(bodyId)!
  const p = bodyPosition(body, sim.t)
  const dist = fitDistance(visualRadius(body), aspect, BASE_FOV)
  // Câmera do lado iluminado, girada para revelar o terminador (sombra) → mais cinematográfico
  const sunDir = p.lengthSq() > 1e-6 ? p.clone().negate().normalize() : new Vector3(0, 0, 1)
  const dir = sunDir.applyAxisAngle(Y_AXIS, MathUtils.degToRad(hero ? 58 : 40))
  dir.y += hero ? 0.1 : 0.22
  dir.normalize()
  const f: Focus = {
    body, fixed: null, offset: dir.multiplyScalar(dist),
    min: body.radius * 1.25, max: Math.min(Math.max(dist * 5, 40), 140), poi: null,
  }
  if (poiId) {
    const def = body.pois?.find((x) => x.id === poiId)
    if (def) f.poi = { body, id: poiId, dist: Math.max(dist * (def.zoom ?? 0.6), body.radius * 1.6) }
  }
  return f
}

/**
 * Câmera cinematográfica.
 *  - Mudou o foco (intro / visão geral / planeta / POI / Deep Space) → tween com easing, arco e pulso de FOV.
 *  - Chegou → modo "follow" (corpos em órbita) e o OrbitControls assume o 360°.
 *  - Painel aberto → setViewOffset desloca o objeto para fora da área do painel.
 *  - Viagens > 300 unidades (Deep Space) são mais longas e usam easing mais dramático.
 */
export function CameraRig() {
  const controls = useRef<OrbitControlsImpl>(null)
  const camera = useThree((s) => s.camera) as PerspectiveCamera
  const size = useThree((s) => s.size)
  const get = useThree((s) => s.get)

  const phase = useAstra((s) => s.phase)
  const realm = useAstra((s) => s.realm)
  const selectedId = useAstra((s) => s.selectedId)
  const poiId = useAstra((s) => s.selectedPoiId)
  const resetNonce = useAstra((s) => s.resetNonce)

  const sel = selectedId ? getEntry(selectedId) : undefined
  let focusKey: string
  if (phase === 'intro') focusKey = 'earth'
  else if (sel) focusKey = isDeep(sel) ? `deep:${sel.id}` : poiId ? `${sel.id}#${poiId}` : sel.id
  else focusKey = realm === 'deep' ? 'deep-overview' : 'overview'

  const initialized = useRef(false)
  const tween = useRef<Tween | null>(null)
  const follow = useRef<{ body: CelestialBody; last: Vector3 } | null>(null)
  const shift = useRef({ x: 0, y: 0 })
  const tmpA = useRef(new Vector3()).current
  const tmpB = useRef(new Vector3()).current
  const tmpC = useRef(new Vector3()).current

  const applyLimits = (f: Focus) => {
    const c = controls.current
    if (!c) return
    c.minDistance = f.min
    c.maxDistance = f.max
  }
  const targetOf = (f: Focus, out: Vector3) => (f.body ? bodyPosition(f.body, sim.t, out) : out.copy(f.fixed ?? out.set(0, 0, 0)))
  const offsetOf = (f: Focus, target: Vector3, out: Vector3) =>
    f.poi ? out.copy(poiDirection(f.poi, target, _dir)).multiplyScalar(f.poi.dist) : out.copy(f.offset)

  /* ---- dispara viagem quando o foco muda ---- */
  useEffect(() => {
    const c = controls.current
    if (!c) return
    const { width, height } = get().size
    const f = computeFocus(focusKey, width / height, phase === 'intro')
    const target = targetOf(f, new Vector3())
    const endPos = target.clone().add(offsetOf(f, target, new Vector3()))
    const reduced = useAstra.getState().reducedMotion

    if (!initialized.current || reduced) {
      initialized.current = true
      tween.current = null
      camera.position.copy(endPos)
      camera.fov = BASE_FOV
      camera.updateProjectionMatrix()
      c.target.copy(target)
      c.enabled = true
      applyLimits(f)
      follow.current = f.body ? { body: f.body, last: target.clone() } : null
      c.update()
      return
    }

    const fromPos = camera.position.clone()
    const dist = fromPos.distanceTo(endPos)
    if (dist < 0.01 && c.target.distanceTo(target) < 0.01) return // já está lá (ex.: StrictMode em dev)
    const far = dist > 300
    tween.current = {
      t: 0,
      dur: far ? MathUtils.clamp(4 + Math.log10(dist) * 1.4, 6, 9) : MathUtils.clamp(1.6 + dist * 0.035, 1.8, 5.5),
      fromPos,
      fromTarget: c.target.clone(),
      arc: far ? Math.min(dist * 0.06, 500) : Math.min(dist * 0.12, 18),
      fovPulse: far ? 16 : MathUtils.clamp(dist / 60, 0, 1) * 9,
      ease: far || (focusKey === 'overview' && phase === 'explore' && dist > 60) ? easeInOutQuart : easeInOutCubic,
      focus: f,
    }
    follow.current = null
    c.enabled = false // sem arrastar durante a viagem
    c.minDistance = 0
    c.maxDistance = Infinity
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusKey, resetNonce, camera, get, phase])

  /* ---- zoom por botões (acessibilidade / mobile) ---- */
  useEffect(() => {
    cameraApi.zoom = (factor: number) => {
      const c = controls.current
      if (!c || tween.current) return
      const off = camera.position.clone().sub(c.target)
      off.setLength(MathUtils.clamp(off.length() * factor, c.minDistance, c.maxDistance))
      camera.position.copy(c.target).add(off)
    }
    return () => {
      cameraApi.zoom = () => {}
    }
  }, [camera])

  useFrame((_, rawDt) => {
    const c = controls.current
    if (!c) return
    const dt = Math.min(rawDt, 0.1)
    const tw = tween.current

    if (tw) {
      tw.t = Math.min(1, tw.t + dt / tw.dur)
      const e = tw.ease(tw.t)
      const f = tw.focus
      const endTarget = targetOf(f, tmpA)
      tmpB.copy(endTarget).add(offsetOf(f, endTarget, tmpC)) // o destino acompanha a órbita / a rotação do POI
      camera.position.lerpVectors(tw.fromPos, tmpB, e)
      camera.position.y += Math.sin(Math.PI * e) * tw.arc // arco: evita atravessar o Sol
      c.target.lerpVectors(tw.fromTarget, endTarget, e)
      camera.fov = BASE_FOV + Math.sin(Math.PI * e) * tw.fovPulse
      camera.updateProjectionMatrix()
      c.update()

      if (tw.t >= 1) {
        tween.current = null
        camera.fov = BASE_FOV
        camera.updateProjectionMatrix()
        c.enabled = true
        applyLimits(f)
        follow.current = f.body ? { body: f.body, last: endTarget.clone() } : null
      }
    } else if (follow.current) {
      const fl = follow.current
      bodyPosition(fl.body, sim.t, tmpA)
      tmpB.copy(tmpA).sub(fl.last)
      camera.position.add(tmpB)
      c.target.copy(tmpA)
      fl.last.copy(tmpA)
    }

    // desloca o enquadramento para a área livre ao lado/acima do painel
    const st = useAstra.getState()
    const panelOpen = st.phase === 'explore' && st.selectedId !== null
    const desktop = size.width >= DESKTOP_MIN
    const wantX = panelOpen && desktop ? PANEL_W / 2 : 0
    const wantY = panelOpen && !desktop ? size.height * 0.18 : 0
    shift.current.x = MathUtils.damp(shift.current.x, wantX, 4, dt)
    shift.current.y = MathUtils.damp(shift.current.y, wantY, 4, dt)
    if (Math.abs(shift.current.x) + Math.abs(shift.current.y) > 0.5) {
      camera.setViewOffset(size.width, size.height, shift.current.x, shift.current.y, size.width, size.height)
    } else if (camera.view?.enabled) {
      camera.clearViewOffset()
    }
  })

  return (
    <OrbitControls
      ref={controls}
      enableDamping
      dampingFactor={0.07}
      enablePan={false}
      rotateSpeed={0.55}
      zoomSpeed={0.8}
      onStart={() => useAstra.getState().markInteracted()}
    />
  )
}
