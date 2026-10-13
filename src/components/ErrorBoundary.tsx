import { Component, type ReactNode } from 'react'

export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(error: unknown) {
    console.error('[ASTRA] scene failed', error)
  }
  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div className="fallback" role="alert">
        <h1>ASTRA</h1>
        <p>The 3D view couldn't start. ASTRA needs WebGL 2 — try a recent browser or enable hardware acceleration.</p>
      </div>
    )
  }
}
