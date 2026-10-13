import { useMemo, useRef } from 'react'
import { Line } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { MathUtils } from 'three'
import type { Line2, LineMaterial } from 'three-stdlib'
import type { CelestialBody } from '../types/celestial'
import { useAstra } from '../store/useAstra'

/** Órbita circular. Opacidade animada por damping: invisível na intro, destacada no corpo selecionado. */
export function OrbitPath({ body }: { body: CelestialBody }) {
  const ref = useRef<Line2>(null)
  const points = useMemo(() => {
    const pts: [number, number, number][] = []
    for (let i = 0; i <= 192; i++) {
      const a = (i / 192) * Math.PI * 2
      pts.push([Math.cos(a) * body.orbit.radius, 0, Math.sin(a) * body.orbit.radius])
    }
    return pts
  }, [body.orbit.radius])

  useFrame((_, dt) => {
    const m = ref.current?.material as LineMaterial | undefined
    if (!m) return
    const s = useAstra.getState()
    const target =
      s.phase !== 'explore' ? 0 : s.selectedId === body.id ? 0.5 : s.selectedId ? 0.05 : 0.16
    m.opacity = MathUtils.damp(m.opacity, target, 3, Math.min(dt, 0.1))
  })

  return <Line ref={ref} points={points} color="#9ec1ff" lineWidth={1} transparent opacity={0} depthWrite={false} />
}
