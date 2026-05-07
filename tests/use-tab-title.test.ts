import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'

const lifecycleHooks = vi.hoisted(() => ({
  mounted: [] as Array<() => void>,
  beforeUnmount: [] as Array<() => void>,
  reset() {
    this.mounted.length = 0
    this.beforeUnmount.length = 0
  },
}))

vi.mock('vue', async () => {
  const actual = await vi.importActual<typeof import('vue')>('vue')

  return {
    ...actual,
    onMounted: (cb: () => void) => {
      lifecycleHooks.mounted.push(cb)
    },
    onBeforeUnmount: (cb: () => void) => {
      lifecycleHooks.beforeUnmount.push(cb)
    },
  }
})

vi.mock('#app', () => ({
  useHead: vi.fn(),
}))

describe('useTabTitle', () => {
  let documentStub: { title: string }

  beforeEach(() => {
    vi.useFakeTimers()
    documentStub = { title: '' }
    vi.stubGlobal('document', documentStub)
    vi.stubGlobal('window', {
      setInterval: globalThis.setInterval.bind(globalThis),
      clearInterval: globalThis.clearInterval.bind(globalThis),
    })
    lifecycleHooks.reset()
  })

  afterEach(() => {
    lifecycleHooks.beforeUnmount.forEach((cb) => cb())
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  async function flushMounted(): Promise<void> {
    lifecycleHooks.mounted.forEach((cb) => cb())
    await nextTick()
  }

  it('writes the title to document.title once mounted', async () => {
    const { useTabTitle } = await import('~/composables/useTabTitle')

    useTabTitle({
      title: ref('Project Dashboard *'),
      animationEnabled: ref(false),
      isDocumentVisible: ref(true),
    })

    await flushMounted()

    expect(documentStub.title).toBe('Project Dashboard *')
  })

  it('falls back to the default title when the source is empty', async () => {
    const { useTabTitle } = await import('~/composables/useTabTitle')

    useTabTitle({
      title: ref(''),
      animationEnabled: ref(false),
      isDocumentVisible: ref(true),
    })

    await flushMounted()

    expect(documentStub.title).toBe('Tab Pet')
  })

  it('updates the title when the source ref changes', async () => {
    const { useTabTitle } = await import('~/composables/useTabTitle')
    const title = ref('First')

    useTabTitle({
      title,
      animationEnabled: ref(false),
      isDocumentVisible: ref(true),
    })

    await flushMounted()
    expect(documentStub.title).toBe('First')

    title.value = 'Second'
    await nextTick()

    expect(documentStub.title).toBe('Second')
  })

  it('rotates the title characters when animation is enabled and the document is hidden', async () => {
    const { useTabTitle } = await import('~/composables/useTabTitle')

    useTabTitle({
      title: ref('Inbox'),
      animationEnabled: ref(true),
      isDocumentVisible: ref(false),
    })

    await flushMounted()

    expect(documentStub.title).toBe('Inbox')

    vi.advanceTimersByTime(1500)
    expect(documentStub.title).toBe('nboxI')

    vi.advanceTimersByTime(1500)
    expect(documentStub.title).toBe('boxIn')
  })

  it('does not animate while the document is visible even with animation enabled', async () => {
    const { useTabTitle } = await import('~/composables/useTabTitle')

    useTabTitle({
      title: ref('Inbox'),
      animationEnabled: ref(true),
      isDocumentVisible: ref(true),
    })

    await flushMounted()

    expect(documentStub.title).toBe('Inbox')

    vi.advanceTimersByTime(5000)
    expect(documentStub.title).toBe('Inbox')
  })

  it('stops animation when the visibility flag flips to visible', async () => {
    const { useTabTitle } = await import('~/composables/useTabTitle')
    const isDocumentVisible = ref(false)

    useTabTitle({
      title: ref('Inbox'),
      animationEnabled: ref(true),
      isDocumentVisible,
    })

    await flushMounted()
    vi.advanceTimersByTime(1500)
    expect(documentStub.title).toBe('nboxI')

    isDocumentVisible.value = true
    await nextTick()

    expect(documentStub.title).toBe('Inbox')

    vi.advanceTimersByTime(5000)
    expect(documentStub.title).toBe('Inbox')
  })

})
