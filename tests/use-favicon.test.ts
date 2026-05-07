import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { useFavicon } from '~/composables/useFavicon'

type StubLink = {
  rel: string
  type: string
  href: string
  dataset: Record<string, string>
}

type StubDocument = {
  links: StubLink[]
  head: { appendChild: (link: StubLink) => StubLink }
  querySelector: (selector: string) => StubLink | null
  createElement: (tag: string) => StubLink
}

function createStubDocument(): StubDocument {
  const links: StubLink[] = []

  return {
    links,
    head: {
      appendChild(link: StubLink) {
        links.push(link)
        return link
      },
    },
    createElement() {
      return { rel: '', type: '', href: '', dataset: {} }
    },
    querySelector(selector: string) {
      if (selector === 'link[data-tab-pet-icon="true"]') {
        return links.find((link) => link.dataset.tabPetIcon === 'true') ?? null
      }

      if (selector === 'link[rel~="icon"]') {
        return links.find((link) => link.rel.split(' ').includes('icon')) ?? null
      }

      return null
    },
  }
}

describe('useFavicon', () => {
  let stubDocument: StubDocument

  beforeEach(() => {
    stubDocument = createStubDocument()
    vi.stubGlobal('document', stubDocument)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('creates a new favicon link when none exists', () => {
    const svg = ref('<svg id="initial" />')

    useFavicon(svg)

    expect(stubDocument.links).toHaveLength(1)
    expect(stubDocument.links[0].rel).toBe('icon')
    expect(stubDocument.links[0].type).toBe('image/svg+xml')
    expect(stubDocument.links[0].dataset.tabPetIcon).toBe('true')
    expect(stubDocument.links[0].href).toContain('data:image/svg+xml,')
    expect(stubDocument.links[0].href).toContain(encodeURIComponent('initial'))
  })

  it('reuses an existing tab-pet icon link instead of creating a new one', () => {
    stubDocument.head.appendChild({
      rel: 'icon',
      type: 'image/svg+xml',
      href: '',
      dataset: { tabPetIcon: 'true' },
    })

    useFavicon(ref('<svg id="reuse" />'))

    expect(stubDocument.links).toHaveLength(1)
    expect(stubDocument.links[0].href).toContain(encodeURIComponent('reuse'))
  })

  it('marks an existing rel="icon" link as the tab-pet icon when adopting it', () => {
    const existing: StubLink = { rel: 'icon', type: '', href: '', dataset: {} }
    stubDocument.head.appendChild(existing)

    useFavicon(ref('<svg id="adopt" />'))

    expect(stubDocument.links).toHaveLength(1)
    expect(existing.dataset.tabPetIcon).toBe('true')
    expect(existing.type).toBe('image/svg+xml')
    expect(existing.href).toContain(encodeURIComponent('adopt'))
  })

  it('updates the favicon when the svg ref changes', async () => {
    const svg = ref('<svg id="first" />')

    useFavicon(svg)

    expect(stubDocument.links[0].href).toContain(encodeURIComponent('first'))

    svg.value = '<svg id="second" />'

    await nextTick()

    expect(stubDocument.links[0].href).toContain(encodeURIComponent('second'))
  })

  it('skips application when the svg payload is empty', () => {
    useFavicon(ref(''))

    expect(stubDocument.links).toHaveLength(0)
  })
})
