// Builds the extension and zips extension/dist for Chrome Web Store upload.
import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, rmSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const dist = resolve(here, 'dist')
const outdir = resolve(here, 'release')

execFileSync(process.execPath, [resolve(here, 'build.mjs')], { stdio: 'inherit' })

const { version } = JSON.parse(readFileSync(resolve(dist, 'manifest.json'), 'utf8'))
const zipPath = resolve(outdir, `tab-pet-${version}.zip`)

mkdirSync(outdir, { recursive: true })
rmSync(zipPath, { force: true })
// manifest.json has to sit at the zip root, so zip from inside dist.
execFileSync('zip', ['-r', '-X', '-q', zipPath, '.', '-x', '*.DS_Store'], { cwd: dist, stdio: 'inherit' })
console.log(`Store package ready: ${zipPath}`)
