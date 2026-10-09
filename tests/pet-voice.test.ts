import { describe, expect, it } from 'vitest'
import { I18N_MESSAGES } from '~/constants/i18n'
import { pickVoiceLine } from '~/utils/petVoice'

const pools = I18N_MESSAGES.ko.voice

describe('pet voice lines', () => {
  it('greets by time of day only while the pet is calm', () => {
    expect(pools.morning).toContain(pickVoiceLine({ pools, status: 'happy', hour: 8, seed: 0 }))
    expect(pools.night).toContain(pickVoiceLine({ pools, status: 'fine', hour: 23, seed: 1 }))
    expect(pools.happy).toContain(pickVoiceLine({ pools, status: 'happy', hour: 14, seed: 2 }))
  })

  it('always talks about a need, whatever the hour', () => {
    expect(pools.hungry).toContain(pickVoiceLine({ pools, status: 'hungry', hour: 8, seed: 3 }))
    expect(pools.sleepy).toContain(pickVoiceLine({ pools, status: 'sleepy', hour: 23, seed: 4 }))
  })

  it('cycles through a pool as the seed changes', () => {
    const lines = new Set(Array.from({ length: pools.bored.length }, (_, seed) =>
      pickVoiceLine({ pools, status: 'bored', hour: 14, seed }),
    ))

    expect(lines.size).toBe(pools.bored.length)
  })
})
