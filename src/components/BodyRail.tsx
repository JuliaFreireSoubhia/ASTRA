import { CATEGORIES, entriesIn } from '../data'
import { cv } from '../lib/cssVars'
import { useAstra } from '../store/useAstra'
import type { Entry } from '../types/celestial'

/** Cor-guia de cada entrada (swatch). */
const swatch = (e: Entry): string => {
  if ('surface' in e) return e.surface.colors[1]
  if (e.kind === 'galaxy') return e.colors.arm
  if (e.kind === 'nebula') return e.palette.mid
  return '#ffb347'
}

/**
 * Navegação por categoria: lista tipográfica (não uma grade de cards). Só a categoria ativa
 * expande seus objetos. Desktop: coluna à esquerda. Celular: duas faixas roláveis na base.
 */
export function BodyRail() {
  const phase = useAstra((s) => s.phase)
  const category = useAstra((s) => s.category)
  const selectedId = useAstra((s) => s.selectedId)
  const select = useAstra((s) => s.select)
  const setCategory = useAstra((s) => s.setCategory)

  return (
    <nav className={`rail${phase === 'explore' ? ' is-visible' : ''}`} aria-label="Explore by category" inert={phase !== 'explore'}>
      <ul className="rail-cats">
        {CATEGORIES.map((c) => {
          const open = c.id === category
          return (
            <li key={c.id} className={open ? 'is-open' : undefined}>
              <button type="button" className="rail-cat" aria-expanded={open} onClick={() => setCategory(c.id)}>
                {c.label}
              </button>
              {open && (
                <ul className="rail-items">
                  {entriesIn(c.id).map((e) => (
                    <li key={e.id}>
                      <button
                        type="button"
                        onClick={() => select(e.id)}
                        aria-current={selectedId === e.id ? 'true' : undefined}
                        style={cv({ '--c': swatch(e) })}
                      >
                        <i aria-hidden="true" />
                        <span>{e.name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
