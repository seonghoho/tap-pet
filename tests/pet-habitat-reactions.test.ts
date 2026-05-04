import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parse } from '@vue/compiler-sfc'
import { describe, expect, it } from 'vitest'

function readComponentTemplate(componentPath: string): string {
  const filename = resolve(componentPath)
  const source = readFileSync(filename, 'utf8')
  const descriptor = parse(source, { filename }).descriptor

  return descriptor.template?.content ?? ''
}

function readCss(cssPath: string): string {
  return readFileSync(resolve(cssPath), 'utf8')
}

describe('pet habitat action reactions', () => {
  it('renders dedicated action reaction layers from activeReaction', () => {
    const template = readComponentTemplate('components/PetHabitat.vue')

    expect(template).toContain("activeReaction === 'feed'")
    expect(template).toContain('pet-habitat__reaction--feed')
    expect(template).toContain("activeReaction === 'play' && species === 'dog'")
    expect(template).toContain('pet-habitat__reaction--play-dog')
    expect(template).toContain("activeReaction === 'play' && species === 'cat'")
    expect(template).toContain('pet-habitat__reaction--play-cat')
    expect(template).toContain("activeReaction === 'sleep'")
    expect(template).toContain('pet-habitat__reaction--sleep')
    expect(template).toContain("activeReaction === 'wash'")
    expect(template).toContain('pet-habitat__reaction--wash')
  })

  it('animates every action reaction in the habitat', () => {
    const css = readCss('assets/css/main.css')

    expect(css).toContain('.pet-habitat--reaction-feed .pet-habitat__pet')
    expect(css).toContain('@keyframes habitat-feed-nod')
    expect(css).toContain('.pet-habitat--reaction-play .pet-avatar')
    expect(css).toContain('@keyframes habitat-play-hop')
    expect(css).toContain('@keyframes habitat-play-roll')
    expect(css).toContain('@keyframes habitat-play-teaser')
    expect(css).toContain('@keyframes habitat-play-mouse')
    expect(css).toContain('.pet-habitat--reaction-sleep .pet-avatar')
    expect(css).toContain('@keyframes habitat-sleep-breathe')
    expect(css).toContain('.pet-habitat--reaction-wash .pet-avatar')
    expect(css).toContain('@keyframes habitat-wash-shake')
    expect(css).toContain('@keyframes habitat-wash-bubble')
  })

  it('keeps dog play ball low enough to read as rolling on the floor', () => {
    const css = readCss('assets/css/main.css')

    expect(css).toContain('animation: habitat-play-roll 1260ms linear infinite')
    expect(css).toContain('top: 53%')
    expect(css).toContain('translate: 154px 30px')
    expect(css).not.toContain('translate: 72px 8px')
  })

  it('moves the cat teaser and mouse together from one shared pivot', () => {
    const template = readComponentTemplate('components/PetHabitat.vue')
    const css = readCss('assets/css/main.css')

    expect(template).toContain('<span class="pet-habitat__play-string">')
    expect(css).toContain('.pet-habitat__play-string .pet-habitat__play-mouse')
    expect(css).not.toContain('translate: -18px 0')
    expect(css).not.toContain('translate: 22px 4px')
  })
})
