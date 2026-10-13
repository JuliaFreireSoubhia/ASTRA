import { useEffect, useRef } from 'react'
import { useAstra } from '../store/useAstra'

export function AboutDialog() {
  const open = useAstra((s) => s.aboutOpen)
  const setAbout = useAstra((s) => s.setAbout)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (open) closeRef.current?.focus()
  }, [open])

  return (
    <div className={`about${open ? ' is-open' : ''}`} role="dialog" aria-modal="true" aria-labelledby="about-title" aria-hidden={!open} inert={!open}>
      <div className="about-card">
        <h2 id="about-title">About ASTRA</h2>
        <p>
          ASTRA is an interactive exploration of space, built with React, Three.js and custom GLSL shaders.
          Every planet surface you see is generated procedurally in real time.
        </p>
        <p>
          Everything here is an artistic representation. Sizes and distances are compressed to fit the screen —
          the numbers in each panel are the real ones.
        </p>
        <button ref={closeRef} type="button" className="chip" onClick={() => setAbout(false)}>
          Close
        </button>
      </div>
    </div>
  )
}
