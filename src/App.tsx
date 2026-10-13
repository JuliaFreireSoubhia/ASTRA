import { lazy, Suspense } from 'react'
import { useAstra } from './store/useAstra'
import { useReducedMotionSync } from './hooks/useReducedMotion'
import { useKeyboardNav } from './hooks/useKeyboardNav'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Loader } from './components/Loader'
import { TopBar } from './components/TopBar'
import { Hero } from './components/Hero'
import { BodyRail } from './components/BodyRail'
import { BodyPanel } from './components/BodyPanel'
import { ControlsHud } from './components/ControlsHud'
import { Hints } from './components/Hints'
import { AboutDialog } from './components/AboutDialog'

// Lazy: o HTML/CSS da interface pinta imediatamente; three + R3F (~1 MB) chegam em paralelo
const Universe = lazy(() => import('./scenes/Universe'))

export default function App() {
  useReducedMotionSync()
  useKeyboardNav()
  const phase = useAstra((s) => s.phase)
  const hasPanel = useAstra((s) => s.phase === 'explore' && s.selectedId !== null)

  return (
    <div className={`app is-${phase}${hasPanel ? ' has-panel' : ''}`}>
      <ErrorBoundary>
        <Suspense fallback={null}>
          <Universe />
        </Suspense>
      </ErrorBoundary>

      <main className="ui">
        <TopBar />
        <Hero />
        <BodyRail />
        <ControlsHud />
        <Hints />
        <BodyPanel />
      </main>

      <AboutDialog />
      <Loader />
    </div>
  )
}
