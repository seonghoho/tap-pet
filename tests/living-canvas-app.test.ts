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

describe('Living Canvas application shell', () => {
  it('composes the ready experience around canvas, needs, and care only', () => {
    const { template } = readComponent('app.vue')

    expect(template).toContain('class="living-stage"')
    expect(template).toContain('<PetCanvas')
    expect(template).toContain('<PetNeeds')
    expect(template).toContain('<PetCareDock')
    expect(template).not.toContain('<PetSidePanel')
    expect(template).not.toContain('<GuidePanel')
    expect(template).not.toContain('<AdSenseDisplay')
    expect(template).not.toContain('<PetActions')
  })

  it('opens a focused settings drawer and supports Escape dismissal', () => {
    const { script, template } = readComponent('app.vue')

    expect(script).toContain('const isSettingsOpen = ref(false)')
    expect(script).toContain("event.key === 'Escape'")
    expect(template).toContain('class="settings-drawer"')
    expect(template).toContain('v-if="isSettingsOpen && currentPet"')
    expect(template).toContain('<PetSettingsPanel')
    expect(template).toContain('@click="closeSettings"')
  })

  it('keeps language selection available inside the mobile settings path', () => {
    const { template } = readComponent('app.vue')
    const localeSwitcherCount = template.match(/<LocaleSwitcher/g)?.length ?? 0

    expect(localeSwitcherCount).toBe(2)
    expect(template).toContain('class="settings-drawer__locale"')
  })

  it('removes display-ad runtime wiring from the primary app', () => {
    const { script } = readComponent('app.vue')

    expect(script).not.toContain('useRuntimeConfig')
    expect(script).not.toContain('adsenseClient')
    expect(script).not.toContain('grantRewardedAdActions')
  })
})

describe('quiet settings', () => {
  it('does not advertise locked premium packs inside pet settings', () => {
    const { script, template } = readComponent('components/PetSettingsPanel.vue')

    expect(script).not.toContain('PREMIUM_WORK_TITLE_PACKS')
    expect(script).not.toContain('getPremiumValue')
    expect(template).not.toContain('premium-tab-pack')
    expect(template).toContain('messages.settings.petName')
    expect(template).toContain('messages.settings.themeMode')
    expect(template).toContain('settings-danger-zone')
  })
})
