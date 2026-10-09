// Rasterizes SVG for the service worker, which cannot use <img> or a DOM canvas.
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.target !== 'offscreen' || message.type !== 'rasterize') return false

  void rasterize(message.svg as string, message.sizes as number[]).then(sendResponse)

  return true
})

async function rasterize(svg: string, sizes: number[]) {
  const image = new Image()
  image.src = `data:image/svg+xml,${encodeURIComponent(svg)}`
  await image.decode()

  const result: Record<number, { width: number, height: number, data: number[] }> = {}
  for (const size of sizes) {
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const context = canvas.getContext('2d')!
    context.drawImage(image, 0, 0, size, size)
    const { data } = context.getImageData(0, 0, size, size)
    result[size] = { width: size, height: size, data: Array.from(data) }
  }

  return result
}
