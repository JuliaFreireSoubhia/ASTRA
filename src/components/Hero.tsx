import { useAstra } from '../store/useAstra'
import { cv } from '../lib/cssVars'

export function Hero() {
  const phase = useAstra((s) => s.phase)
  const ready = useAstra((s) => s.sceneReady)
  const enter = useAstra((s) => s.enter)
  const visible = phase === 'intro'

  return (
    <section
      className={`hero${visible ? ' is-visible' : ''}${ready ? ' is-ready' : ''}`}
      aria-hidden={!visible}
      inert={!visible}
    >
      <h1 className="hero-title" data-reveal style={cv({ '--d': 0 })}>
        ASTRA
      </h1>

      <div className="hero-foot">
        <p className="hero-kicker" data-reveal style={cv({ '--d': 2 })}>
          Explore the universe
        </p>
        <p className="hero-line" data-reveal style={cv({ '--d': 3 })}>
          An interactive journey through space.
        </p>
        <button type="button" className="cta" data-reveal style={cv({ '--d': 4 })} onClick={enter}>
          Enter exploration
        </button>
      </div>
    </section>
  )
}
