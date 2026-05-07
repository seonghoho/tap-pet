if (typeof (globalThis as { window?: unknown }).window === 'undefined') {
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    writable: true,
    value: globalThis,
  })
}
