import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readSource(path: string): string {
  return readFileSync(resolve(path), 'utf8')
}

describe('Living Canvas visual system', () => {
  it('defines the immersive habitat and floating interface layers', () => {
    const css = readSource('assets/css/main.css')

    expect(css).toContain('/* Living Canvas visual system */')
    expect(css).toContain('.living-habitat {')
    expect(css).toContain('.pet-canvas {')
    expect(css).toContain('.living-identity {')
    expect(css).toContain('.living-needs-panel {')
    expect(css).toContain('.care-dock {')
    expect(css).toContain('.settings-drawer {')
    expect(css).toContain('.setup-stage__scene {')
  })

  it('supports mobile, dark, focus, and reduced-motion experiences', () => {
    const css = readSource('assets/css/main.css')

    expect(css).toContain('.app-shell--dark')
    expect(css).toContain('@media (max-width: 720px)')
    expect(css).toContain('@media (prefers-reduced-motion: reduce)')
    expect(css).toContain(':focus-visible')
    expect(css).toContain('min-height: 100svh')
  })

  it('uses product metadata instead of a disguised dashboard title', () => {
    const config = readSource('nuxt.config.ts')

    expect(config).toContain("title: 'Tab Pet — your quiet browser companion'")
    expect(config).toContain('A tiny local pet that lives in your browser tab')
    expect(config).not.toContain("title: 'Project Dashboard'")
  })
})
