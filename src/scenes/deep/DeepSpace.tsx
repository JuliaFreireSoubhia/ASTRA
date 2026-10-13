import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import { DEEP_OBJECTS } from '../../data'
import { useAstra } from '../../store/useAstra'
import { lensState } from '../../lib/lens'
import { Galaxy } from './Galaxy'
import { OrionNebula } from './OrionNebula'
import { StarObject } from './StarObject'
import { BlackHole } from './BlackHole'
import { GlowSprite } from './GlowSprite'

/**
 * Todo o espaço profundo. Carregado sob demanda (React.lazy) e ESCONDIDO enquanto a câmera está
 * perto do Sistema Solar → zero custo de render ali. Para adicionar um tipo novo: crie o componente e
 * registre no switch abaixo.
 */
export default function DeepSpace() {
  const group = useRef<Group>(null)
  const realm = useAstra((s) => s.realm)

  useFrame(({ camera }) => {
    const g = group.current
    if (!g) return
    g.visible = realm === 'deep' || camera.position.lengthSq() > 350 * 350
    if (!g.visible) lensState.target = 0
  })

  return (
    <group ref={group} visible={false}>
      {/* o Sol visto de longe: vira uma estrela entre as outras */}
      <GlowSprite size={150} color="#ffd9a0" intensity={0.9} />
      {DEEP_OBJECTS.map((o) => {
        switch (o.kind) {
          case 'galaxy': return <Galaxy key={o.id} obj={o} />
          case 'nebula': return <OrionNebula key={o.id} obj={o} />
          case 'star': return <StarObject key={o.id} obj={o} />
          case 'blackhole': return <BlackHole key={o.id} obj={o} />
        }
      })}
    </group>
  )
}
