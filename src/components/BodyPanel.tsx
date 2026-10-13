import { useRef, useState } from 'react'
import { useAstra } from '../store/useAstra'
import { getEntry, isDeep } from '../data'
import type { Entry } from '../types/celestial'
import { cv } from '../lib/cssVars'

export function BodyPanel() {
  const selectedId = useAstra((s) => s.selectedId)
  const poiId = useAstra((s) => s.selectedPoiId)
  const { step, deselect, selectPoi } = useAstra.getState()
  const [expanded, setExpanded] = useState(false)

  // Mantém o último objeto durante a animação de saída (senão o conteúdo some antes do painel)
  const last = useRef<Entry | null>(null)
  const current = selectedId ? (getEntry(selectedId) ?? null) : null
  if (current) last.current = current
  const body = current ?? last.current
  const open = current !== null
  const pois = body && !isDeep(body) ? body.pois : undefined
  const poi = pois?.find((p) => p.id === poiId)

  return (
    <aside className={`panel${open ? ' is-open' : ''}${expanded ? ' is-expanded' : ''}`} aria-hidden={!open} inert={!open}>
      {body && (
        <div className="panel-inner" key={body.id}>
          <header>
            <h2>{body.name}</h2>
            <p className="panel-tagline">{body.tagline}</p>
          </header>

          <p className="panel-desc">{body.description}</p>

          {/* ponto de interesse selecionado: substitui a descrição enquanto ativo */}
          <div className="poi-card" aria-live="polite">
            {poi && (
              <>
                <p className="poi-name">{poi.name}</p>
                <p className="poi-info">{poi.info}</p>
              </>
            )}
          </div>

          <dl className="facts">
            {body.facts.map((f, i) => (
              <div key={f.label} className="fact" style={cv({ '--i': i })}>
                <dt>{f.label}</dt>
                <dd>{f.value}</dd>
              </div>
            ))}
          </dl>

          {pois && (
            <div className="places">
              <p className="places-title">Places to explore</p>
              <ul>
                {pois.map((p) => (
                  <li key={p.id}>
                    <button type="button" aria-pressed={poiId === p.id} onClick={() => selectPoi(poiId === p.id ? null : p.id)}>
                      {p.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {body.note && <p className="panel-note">{body.note}</p>}

          <footer className="panel-actions">
            <button type="button" className="chip" onClick={() => setExpanded((v) => !v)} aria-pressed={expanded} data-mobile-only>
              {expanded ? 'Less' : 'More'}
            </button>
            <div className="panel-nav">
              <button type="button" className="chip" onClick={() => step(-1)} aria-label="Previous in category">
                Prev
              </button>
              <button type="button" className="chip" onClick={() => step(1)} aria-label="Next in category">
                Next
              </button>
            </div>
            <button type="button" className="chip chip-quiet" onClick={deselect}>
              {isDeep(body) ? 'Back to deep space' : 'Back to system'}
            </button>
          </footer>
        </div>
      )}
    </aside>
  )
}
