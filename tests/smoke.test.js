import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { unresolvedGenericPreviewIds } from '../src/previewKinds.js'
import { libraryPaletteItems } from '../src/tikzPaletteItems.js'
import { libraryPresets } from '../src/tikzLibraryPresets.js'

const appSource = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8')
const paletteSource = readFileSync(new URL('../src/tikzPaletteItems.js', import.meta.url), 'utf8')
const todoSource = readFileSync(new URL('../TODO.md', import.meta.url), 'utf8')

test('TODO implementation hooks are present', () => {
  assert.match(appSource, /functionFeaturePoints/)
  assert.match(appSource, /renderSelectionHandles/)
  assert.match(appSource, /inferCircuitNets/)
  assert.match(appSource, /buildNetlistMetadata/)
  assert.match(appSource, /segmentIntersection/)
  assert.match(appSource, /Copy \.TeX code/)
  assert.match(appSource, /downloadCanvasSvg/)
  assert.match(appSource, /downloadOverleafZip/)
  assert.match(appSource, /createZipBlob/)
  assert.match(appSource, /metadata\.json/)
  assert.match(appSource, /loadKatexRenderer/)
  assert.match(appSource, /import\('katex'\)/)
  assert.match(appSource, /exportPresetOptions/)
  assert.match(appSource, /legendPos/)
  assert.match(appSource, /errorBars/)
})

test('function plots support multi-series styling and marked points', () => {
  assert.match(appSource, /functionSeriesFor/)
  assert.match(appSource, /functionDisplaySeries/)
  assert.match(appSource, /functionLineStyleOptions/)
  assert.match(appSource, /functionLineStyleTikz/)
  assert.match(appSource, /functionLineStyleSvg/)
  assert.match(appSource, /parseMarkedFunctionPoints/)
  assert.match(appSource, /markedPoints/)
  assert.match(appSource, /addFunctionSeries/)
  assert.match(appSource, /addFunctionToSelectedGraph/)
  assert.match(appSource, /showGraphFrame/)
  assert.match(appSource, /showGraphGrid/)
  assert.match(appSource, /functionYScaleFor/)
  assert.match(appSource, /axisHeight/)
  assert.match(appSource, /Mas funciones en el mismo grafico/)
})

test('text labels resize with persistent dimensions and export font size', () => {
  assert.match(appSource, /labelMetricsForElement/)
  assert.match(appSource, /labelWidth/)
  assert.match(appSource, /labelHeight/)
  assert.match(appSource, /Tamano fuente px/)
  assert.match(appSource, /minimum width=\$\{formatNumber\(metrics\.widthCm\)\}cm/)
  assert.match(appSource, /\\\\fontsize/)
})

test('object resize uses the bottom-right handle without recentering', () => {
  assert.match(appSource, /function moveOriginToBoundsMin/)
  assert.match(appSource, /function resizeLibraryElementToBounds/)
  assert.match(appSource, /terminalLength: Number\(formatNumber/)
  assert.match(appSource, /stretchX: Number\(formatNumber/)
  assert.match(appSource, /minY: Math\.min\(originalBounds\.maxY - 0\.1, point\.y\)/)
  assert.match(appSource, /maxY: originalBounds\.maxY/)
  assert.doesNotMatch(appSource, /origin: boundsCenter\(nextBounds\), scale: scale \* ratio/)
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

test('generic palette previews are semantically classified', () => {
  assert.deepEqual(unresolvedGenericPreviewIds([...libraryPaletteItems, ...libraryPresets]), [])
  assert.match(appSource, /renderPlotPreview/)
  assert.match(appSource, /renderMatrixPreview/)
  assert.match(appSource, /renderNetworkPreview/)
  assert.match(appSource, /renderLogicPreview/)
  assert.match(appSource, /renderFlowPreview/)
  assert.match(appSource, /normalizeBoardElement/)
  assert.match(appSource, /map\(normalizeBoardElement\)/)
})

test('library objects expose advanced configurable TikZ metadata', () => {
  assert.match(appSource, /objectConfigSections/)
  assert.match(appSource, /Paper style/)
  assert.match(appSource, /PGFPlots/)
  assert.match(appSource, /CircuitikZ/)
  assert.match(appSource, /Metadata exportable/)
  assert.match(appSource, /applyLibraryConfigToSnippet/)
  assert.match(appSource, /libraryAxisTikzOptions/)
  assert.match(appSource, /libraryObjectMetadata/)
  assert.match(appSource, /spiceLike/)
})

test('TODO tracks the major product areas', () => {
  assert.match(todoSource, /Core editor UX/i)
  assert.match(todoSource, /TikZ and PGFPlots/i)
  assert.match(todoSource, /Telecommunications engineering/i)
  assert.match(todoSource, /Quality and docs/i)
  assert.match(todoSource, /Future Hardening Completed/)
})
