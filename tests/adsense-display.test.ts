import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { compileScript, parse } from '@vue/compiler-sfc'
import ts from 'typescript'
import { afterEach, describe, expect, it, vi } from 'vitest'

type SetupComponent<T> = {
  setup: (props: unknown, context: { emit: (...args: unknown[]) => void; expose: () => void }) => T
}

type AdSenseDisplaySetup = {
  adWasRequested: { value: boolean }
  canRequestAd: { value: boolean }
  pushAdRequest: () => void
}

const requireModule = createRequire(import.meta.url)

function loadScriptSetupComponent<T>(componentPath: string): SetupComponent<T> {
  const filename = resolve(componentPath)
  const source = readFileSync(filename, 'utf8')
  const descriptor = parse(source, { filename }).descriptor
  const compiled = compileScript(descriptor, { id: filename })
  const output = ts.transpileModule(compiled.content, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText
  const module = { exports: {} }
  const localRequire = (id: string): unknown => {
    if (id === 'vue') {
      const vueModule = requireModule('vue') as Record<string, unknown>

      return { ...vueModule, onMounted: () => undefined }
    }

    return requireModule(id)
  }

  new Function('require', 'exports', 'module', output)(localRequire, module.exports, module)

  return (module.exports as { default: SetupComponent<T> }).default
}

function readComponentTemplate(componentPath: string): string {
  const filename = resolve(componentPath)
  const source = readFileSync(filename, 'utf8')
  const descriptor = parse(source, { filename }).descriptor

  return descriptor.template?.content ?? ''
}

function readSource(sourcePath: string): string {
  return readFileSync(resolve(sourcePath), 'utf8')
}

describe('adsense display configuration', () => {
  it('keeps AdSense credentials in public runtime config with an explicit enable flag', () => {
    const nuxtConfig = readSource('nuxt.config.ts')

    expect(nuxtConfig).toContain('runtimeConfig')
    expect(nuxtConfig).toContain('NUXT_PUBLIC_ADSENSE_CLIENT')
    expect(nuxtConfig).toContain('ca-pub-6884620250599904')
    expect(nuxtConfig).toContain('NUXT_PUBLIC_ADSENSE_SIDEBAR_SLOT')
    expect(nuxtConfig).toContain('NUXT_PUBLIC_ADSENSE_ENABLED')
  })

  it('places the display ad in the side stack instead of the monetization mock', () => {
    const appTemplate = readComponentTemplate('app.vue')

    expect(appTemplate).not.toContain('<MonetizationMock')
    expect(appTemplate).toContain('<AdSenseDisplay')
    expect(appTemplate.indexOf('<GuidePanel')).toBeLessThan(appTemplate.indexOf('<AdSenseDisplay'))
    expect(appTemplate).toContain(':client="adsenseClient"')
    expect(appTemplate).toContain(':slot="adsenseSidebarSlot"')
    expect(appTemplate).toContain(':enabled="adsenseEnabled"')
  })
})

describe('AdSenseDisplay', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('pushes one ad request when enabled with a client and slot', () => {
    const adsbygoogle: unknown[] = []
    vi.stubGlobal('window', { adsbygoogle })
    const component = loadScriptSetupComponent<AdSenseDisplaySetup>('components/AdSenseDisplay.vue')
    const setup = component.setup(
      {
        client: 'ca-pub-6884620250599904',
        slot: '1234567890',
        enabled: true,
      },
      { emit: vi.fn(), expose: vi.fn() },
    )

    expect(setup.canRequestAd.value).toBe(true)

    setup.pushAdRequest()
    setup.pushAdRequest()

    expect(adsbygoogle).toHaveLength(1)
    expect(setup.adWasRequested.value).toBe(true)
  })

  it('does not push an ad request when the slot is missing', () => {
    const adsbygoogle: unknown[] = []
    vi.stubGlobal('window', { adsbygoogle })
    const component = loadScriptSetupComponent<AdSenseDisplaySetup>('components/AdSenseDisplay.vue')
    const setup = component.setup(
      {
        client: 'ca-pub-6884620250599904',
        slot: '',
        enabled: true,
      },
      { emit: vi.fn(), expose: vi.fn() },
    )

    expect(setup.canRequestAd.value).toBe(false)

    setup.pushAdRequest()

    expect(adsbygoogle).toHaveLength(0)
    expect(setup.adWasRequested.value).toBe(false)
  })
})
