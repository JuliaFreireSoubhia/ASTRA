import { useFrame } from '@react-three/fiber'
import { SOLAR_BODIES } from '../data'
import { Body } from '../planets/Body'
import { OrbitPath } from '../planets/OrbitPath'
import { useAstra } from '../store/useAstra'
import { sim } from '../lib/sim'

/** Avança o relógio ANTES de qualquer outro useFrame (prioridade negativa) → posições consistentes no frame. */
function SimClock() {
  useFrame((_, dt) => {
    if (!useAstra.getState().reducedMotion) sim.t += Math.min(dt, 0.1)
  }, -100)
  return null
}

export function SolarSystem() {
  const quality = useAstra((s) => s.quality)
  return (
    // key = quality: ao trocar de nível, a subárvore remonta (R3F descarta geometrias/materiais antigos)
    <group key={quality}>
      <SimClock />
      <ambientLight intensity={0.03} />
      {/* Só afeta materiais "standard" (planetas com textura real); os shaders procedurais calculam a própria luz */}
      <pointLight position={[0, 0, 0]} intensity={4} decay={0} />
      {SOLAR_BODIES.map((b) => (
        <group key={b.id}>
          <Body body={b} />
          {b.orbit.radius > 0 && !b.orbit.parentId && <OrbitPath body={b} />}
        </group>
      ))}
    </group>
  )
}
