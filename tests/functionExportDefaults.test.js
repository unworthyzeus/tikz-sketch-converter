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
