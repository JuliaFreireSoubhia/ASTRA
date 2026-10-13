import { useAstra } from '../store/useAstra'

export function TopBar() {
  const phase = useAstra((s) => s.phase)
  const menuOpen = useAstra((s) => s.menuOpen)
  const realm = useAstra((s) => s.realm)
  const { setMenu, setAbout, goHome, enter, enterDeep } = useAstra.getState()

  return (
    <header className="topbar">
      <button type="button" className="brand" onClick={goHome} aria-label="ASTRA — back to start" tabIndex={phase === 'intro' ? -1 : 0}>
        ASTRA
      </button>

      <button
        type="button"
        className="menu-toggle"
        aria-expanded={menuOpen}
        aria-controls="main-menu"
        onClick={() => setMenu(!menuOpen)}
      >
        <span>{menuOpen ? 'Close' : 'Menu'}</span>
        <i aria-hidden="true" />
      </button>

      <nav id="main-menu" className={`menu${menuOpen ? ' is-open' : ''}`} aria-label="Main" inert={!menuOpen}>
        <ul>
          <li>
            <button type="button" onClick={goHome} aria-current={phase === 'intro' ? 'page' : undefined}>
              Start
            </button>
          </li>
          <li>
            <button type="button" onClick={enter} aria-current={phase === 'explore' && realm === 'solar' ? 'page' : undefined}>
              Solar System
            </button>
          </li>
          <li>
            <button type="button" onClick={enterDeep} aria-current={phase === 'explore' && realm === 'deep' ? 'page' : undefined}>
              Deep Space
            </button>
          </li>
          <li>
            <button type="button" onClick={() => setAbout(true)}>
              About
            </button>
          </li>
        </ul>
      </nav>
    </header>
  )
}
