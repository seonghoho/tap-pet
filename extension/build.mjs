// Bundles the Chrome extension into extension/dist (load it via chrome://extensions → "Load unpacked").
import { cpSync, mkdirSync, rmSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')
const outdir = resolve(here, 'dist')

rmSync(outdir, { force: true, recursive: true })
mkdirSync(outdir, { recursive: true })

await build({
  entryPoints: {
    background: resolve(here, 'src/background.ts'),
    popup: resolve(here, 'src/popup.ts'),
    offscreen: resolve(here, 'src/offscreen.ts'),
  },
  outdir,
  bundle: true,
  format: 'esm',
  target: 'chrome116',
  alias: { '~': root },
  define: { 'import.meta.client': 'true', 'import.meta.server': 'false', 'import.meta.dev': 'false' },
  minify: true,
  legalComments: 'none',
  logLevel: 'info',
})

cpSync(resolve(here, 'static'), outdir, { recursive: true })
console.log(`Extension ready: ${outdir}`)
