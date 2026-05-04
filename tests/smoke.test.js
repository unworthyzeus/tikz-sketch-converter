import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { libraryPaletteItems } from '../src/tikzPaletteItems.js'

const appSource = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8')
const paletteSource = readFileSync(new URL('../src/tikzPaletteItems.js', import.meta.url), 'utf8')
const todoSource = readFileSync(new URL('../TODO.md', import.meta.url), 'utf8')

test('TODO implementation hooks are present', () => {
  assert.match(appSource, /functionFeaturePoints/)
  assert.match(appSource, /renderSelectionHandles/)
  assert.match(appSource, /inferCircuitNets/)
  assert.match(appSource, /Copy \.TeX code/)
  assert.match(appSource, /downloadCanvasSvg/)
  assert.match(appSource, /downloadOverleafZip/)
  assert.match(appSource, /createZipBlob/)
  assert.match(appSource, /exportPresetOptions/)
  assert.match(appSource, /legendPos/)
  assert.match(appSource, /errorBars/)
})

test('telecommunications and circuit palettes include requested domains', () => {
  assert.match(paletteSource, /telecom-transmitter-chain/)
  assert.match(paletteSource, /telecom-qpsk-mod/)
  assert.match(paletteSource, /telecom-superhet/)
  assert.match(paletteSource, /telecom-matched-filter/)
  assert.match(paletteSource, /telecom-mimo-channel/)
  assert.match(paletteSource, /rf-waveguide/)
  assert.match(paletteSource, /rf-circulator/)
  assert.match(paletteSource, /plot-constellation/)
  assert.match(paletteSource, /plot-spectrogram/)
  assert.match(paletteSource, /circuit-controlled-vsource/)
  assert.match(paletteSource, /circuit-transmission-line/)
  assert.match(paletteSource, /circuit-voltmeter/)
})

test('circuit palette ids and previews resolve to circuit symbols', () => {
  const counts = new Map()
  libraryPaletteItems.forEach((item) => counts.set(item.id, (counts.get(item.id) ?? 0) + 1))
  assert.deepEqual(
    [...counts].filter(([, count]) => count > 1),
    [],
  )
  assert.equal(libraryPaletteItems.find((item) => item.id === 'circuit-nmos')?.preview, 'nmos')
  assert.equal(libraryPaletteItems.find((item) => item.id === 'circuit-pmos')?.preview, 'pmos')
  assert.equal(libraryPaletteItems.find((item) => item.id === 'circuit-npn')?.preview, 'npn')
  assert.equal(libraryPaletteItems.find((item) => item.id === 'circuit-switch')?.preview, 'switch')
  assert.match(appSource, /key\.includes\('current source'\)\) return 'I'/)
  assert.match(appSource, /key\.includes\('controlled voltage'\).*return 'cV'/)
})

test('TODO tracks the major product areas', () => {
  assert.match(todoSource, /Core editor UX/i)
  assert.match(todoSource, /TikZ and PGFPlots/i)
  assert.match(todoSource, /Telecommunications engineering/i)
  assert.match(todoSource, /Quality and docs/i)
  assert.match(todoSource, /Future Hardening/)
})
