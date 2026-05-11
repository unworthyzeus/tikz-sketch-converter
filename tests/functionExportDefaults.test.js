import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const appSource = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8')

function loadFunctionExportDefaults() {
  const start = appSource.indexOf('const defaultFunctionOptions')
  const end = appSource.indexOf('const exportPresetOptions')
  assert.notEqual(start, -1)
  assert.notEqual(end, -1)
  return Function(`${appSource.slice(start, end)}; return { defaultFunctionOptions };`)()
}

test('function plot defaults do not duplicate the explicit series line width', () => {
  const { defaultFunctionOptions } = loadFunctionExportDefaults()

  assert.equal(defaultFunctionOptions.plotOptions, '')
})

test('function plot defaults expose axis sizing and title controls', () => {
  const { defaultFunctionOptions } = loadFunctionExportDefaults()

  assert.equal(defaultFunctionOptions.axisWidth, '7cm')
  assert.equal(defaultFunctionOptions.axisHeight, '4.5cm')
  assert.equal(defaultFunctionOptions.axisLines, 'left')
  assert.equal(defaultFunctionOptions.plotTitle, '')
  assert.match(appSource, /axis lines=\$\{functionOptions\.axisLines\}/)
  assert.match(appSource, /title=\{\$\{formatTikzNodeText\(functionOptions\.plotTitle\)\}\}/)
})

test('function plot defaults expose legend mode controls and polar requirements', () => {
  const { defaultFunctionOptions } = loadFunctionExportDefaults()

  assert.equal(defaultFunctionOptions.legendMode, 'auto')
  assert.equal(defaultFunctionOptions.legendEntries, '')
  assert.match(appSource, /legend entries=\{\$\{functionLegendLabelValues\.map\(formatTikzNodeText\)\.join\(','\)\}\}/)
  assert.match(appSource, /functionOptions\.axisType === 'polaraxis'/)
  assert.match(appSource, /pgfplotsLibraries\.add\('polar'\)/)
})

test('function table export wires y-error columns into PGFPlots tables', () => {
  assert.match(appSource, /functionDataTableRows\(tablePoints\)/)
  assert.match(appSource, /functionDataTableUsesYError\(tablePoints\)/)
  assert.match(appSource, /y error=yerr/)
})
