import { useEffect, useRef, type RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { Vector3, type Group } from 'three'
import type { CelestialBody, POI } from '../types/celestial'
import { useAstra } from '../store/useAstra'
import { latLonToVec, poiRegistry } from '../lib/poiRegistry'

const _m = new Vector3()
const _c = new Vector3()
const _v = new Vector3()

/** Marcadores de POI: filhos do grupo que GIRA com o planeta → ficam presos à superfície. */
export function PoiMarkers({ body, center }: { body: CelestialBody; center: RefObject<Group | null> }) {
  const selectedId = useAstra((s) => s.selectedId)
  const poiId = useAstra((s) => s.selectedPoiId)
  const selectPoi = useAstra((s) => s.selectPoi)
  const active = selectedId === body.id

  return (
    <>
      {body.pois!.map((p) => (
        <Marker key={p.id} body={body} poi={p} center={center} active={active} selected={poiId === p.id} onPick={() => selectPoi(poiId === p.id ? null : p.id)} />
      ))}
    </>
  )
}

interface MarkerProps {
  body: CelestialBody
  poi: POI
  center: RefObject<Group | null>
  active: boolean
  selected: boolean
  onPick: () => void
}

function Marker({ body, poi, center, active, selected, onPick }: MarkerProps) {
  const g = useRef<Group>(null)
  const btn = useRef<HTMLButtonElement>(null)
  const key = `${body.id}:${poi.id}`
  const dir = latLonToVec(poi.lat, poi.lon)

  useEffect(() => {
    if (g.current) poiRegistry.set(key, g.current)
    return () => {
      poiRegistry.delete(key)
    }
  }, [key])

  // mostra só se estiver no hemisfério voltado para a câmera (sem raycast: barato)
  useFrame(({ camera }) => {
    const b = btn.current
    if (!b || !g.current || !center.current) return
    g.current.getWorldPosition(_m)
    center.current.getWorldPosition(_c)
    _v.copy(camera.position).sub(_m).normalize()
    const facing = _m.clone().sub(_c).normalize().dot(_v) > 0.12
    b.dataset.facing = facing ? '1' : '0'
  })

  const r = body.radius * 1.004
  return (
    <group ref={g} position={[dir.x * r, dir.y * r, dir.z * r]}>
      <Html center zIndexRange={[9, 0]} pointerEvents="none">
        <button
          ref={btn}
          type="button"
          className={`poi${active ? ' is-active' : ''}${selected ? ' is-selected' : ''}`}
          tabIndex={active ? 0 : -1}
          aria-hidden={!active}
          aria-pressed={selected}
          aria-label={`${poi.name} on ${body.name}`}
          onClick={onPick}
        >
          <i aria-hidden="true" />
          <span>{poi.name}</span>
        </button>
      </Html>
    </group>
  )
}
