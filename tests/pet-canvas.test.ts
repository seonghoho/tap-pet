import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parse } from '@vue/compiler-sfc'
import { describe, expect, it } from 'vitest'

function readComponent(componentPath: string) {
  const filename = resolve(componentPath)
  const source = readFileSync(filename, 'utf8')
  const descriptor = parse(source, { filename }).descriptor

  return {
    source,
    script: descriptor.scriptSetup?.content ?? '',
    template: descriptor.template?.content ?? '',
  }
}

describe('PetCanvas', () => {
  it('provides an accessible canvas-only visual layer', () => {
    const component = readComponent('components/PetCanvas.vue')

    expect(component.template).toContain('<canvas')
    expect(component.template).toContain(':aria-label="label"')
    expect(component.template).toContain('role="img"')
    expect(component.script).toContain('label: string')
  })

  it('owns a high-DPI responsive animation lifecycle', () => {
    const { script } = readComponent('components/PetCanvas.vue')

    expect(script).toContain('window.devicePixelRatio')
    expect(script).toContain('ResizeObserver')
    expect(script).toContain('requestAnimationFrame')
    expect(script).toContain('cancelAnimationFrame')
    expect(script).toContain("document.addEventListener('visibilitychange'")
    expect(script).toContain("window.matchMedia('(prefers-reduced-motion: reduce)')")
    expect(script).toContain('onBeforeUnmount')
  })

  it('separates room, pet, face, and reaction drawing layers', () => {
    const { script } = readComponent('components/PetCanvas.vue')

    expect(script).toContain('function drawRoom(')
    expect(script).toContain('function drawPet(')
    expect(script).toContain('function drawFace(')
    expect(script).toContain('function drawReaction(')
    expect(script).toContain("case 'hedgehog':")
    expect(script).toContain("case 'rabbit':")
    expect(script).toContain("case 'penguin':")
    expect(script).toContain("case 'hamster':")
  })
})
