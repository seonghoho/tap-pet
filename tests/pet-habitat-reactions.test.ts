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


function readSource(sourcePath: string): string {
  return readFileSync(resolve(sourcePath), 'utf8')
}

describe('pet habitat action reactions', () => {
  it('renders dedicated action reaction layers from activeReaction', () => {
    const template = readComponentTemplate('components/PetHabitat.vue')

    expect(template).toContain("activeReaction === 'feed'")
    expect(template).toContain('pet-habitat__reaction--feed')
    expect(template).toContain("activeReaction === 'play' && species !== 'cat'")
    expect(template).toContain('pet-habitat__reaction--play-dog')
    expect(template).toContain("activeReaction === 'play' && species === 'cat'")
    expect(template).toContain('pet-habitat__reaction--play-cat')
    expect(template).toContain("activeReaction === 'sleep'")
    expect(template).toContain('pet-habitat__reaction--sleep')
    expect(template).toContain("activeReaction === 'wash'")
    expect(template).toContain('pet-habitat__reaction--wash')
  })

  it('passes pet level into habitat so level rewards can affect reactions', () => {
    const appTemplate = readComponentTemplate('app.vue')
    const statusTemplate = readComponentTemplate('components/PetStatusPanel.vue')
    const statusSource = readSource('components/PetStatusPanel.vue')

    expect(appTemplate).toContain(':level="currentPet.growth.level"')
    expect(statusSource).toContain('level: number')
    expect(statusTemplate).toContain(':level="level"')
  })

  it('renders the level 4 habitat reaction spark layer from unlock state', () => {
    const template = readComponentTemplate('components/PetHabitat.vue')
    const source = readSource('components/PetHabitat.vue')

    expect(source).toContain('getAvailableLevelUnlocks(props.level)')
    expect(source).toContain("unlock.id === 'habitat-reaction-spark'")
    expect(template).toContain('pet-habitat--reaction-spark')
    expect(template).toContain('v-if="shouldShowReactionSpark"')
    expect(template).toContain('pet-habitat__reaction--spark')
  })
})
