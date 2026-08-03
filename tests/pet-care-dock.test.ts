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

describe('PetCareDock', () => {
  it('keeps the primary care surface to four native action buttons', () => {
    const { script, template } = readComponent('components/PetCareDock.vue')

    expect(script).toContain("const actions: readonly PetAction[] = ['feed', 'play', 'sleep', 'wash']")
    expect(template).toContain('v-for="action in actions"')
    expect(template).toContain(':data-action="action"')
    expect(template).toContain('type="button"')
    expect(template).toContain("emit('action', action)")
  })

  it('expresses recommendation, active, and cooldown states without action-limit UI', () => {
    const { script, template } = readComponent('components/PetCareDock.vue')

    expect(script).toContain('recommendedCareAction?.action === action')
    expect(script).toContain('props.activeReaction === action')
    expect(script).toContain('props.cooldowns[action] > now.value')
    expect(template).toContain(':data-recommended="isRecommended(action)"')
    expect(template).toContain(':disabled="isDisabled(action)"')
    expect(template).not.toContain('reward-ad')
    expect(template).not.toContain('actionLimit')
  })

  it('renders concise visible feedback without progression details', () => {
    const { script, template } = readComponent('components/PetCareDock.vue')

    expect(script).toContain('feedbackSummary')
    expect(template).toContain('care-dock__feedback')
    expect(template).not.toContain('gainedExp')
    expect(template).not.toContain('personality')
    expect(template).not.toContain('levelUnlocks')
  })
})

describe('PetNeeds', () => {
  it('renders three localized semantic need indicators', () => {
    const { script, template } = readComponent('components/PetNeeds.vue')

    expect(script).toContain("id: 'fullness'")
    expect(script).toContain("id: 'energy'")
    expect(script).toContain("id: 'cleanliness'")
    expect(template).toContain('v-for="need in needs"')
    expect(template).toContain(':aria-valuenow="need.value"')
    expect(template).toContain(':style="{ width: `${need.value}%` }"')
  })
})
