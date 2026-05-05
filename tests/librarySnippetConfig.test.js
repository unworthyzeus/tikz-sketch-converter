import assert from 'node:assert/strict'
import test from 'node:test'
import {
  formatMatrixEntryRows,
  normalizeGanttRange,
  shouldUseConfiguredLibrarySnippet,
} from '../src/librarySnippetConfig.js'

test('shape variants only replace snippets for configurable primitive presets', () => {
  assert.equal(
    shouldUseConfiguredLibrarySnippet(
      { id: 'circuit-rc-lowpass', group: 'Circuit', preview: 'circuit' },
      { shapeVariant: 'rounded' },
      { hasCircuitComponent: false },
    ),
    false,
  )
  assert.equal(
    shouldUseConfiguredLibrarySnippet(
      { id: 'circuit-resistor', group: 'Circuit', preview: 'resistor' },
      { shapeVariant: 'rounded' },
      { hasCircuitComponent: true },
    ),
    true,
  )
  assert.equal(
    shouldUseConfiguredLibrarySnippet(
      { id: 'telecom-ofdm-transmitter', group: 'Telecom', preview: 'flow' },
      { blockLabels: '' },
    ),
    false,
  )
  assert.equal(
    shouldUseConfiguredLibrarySnippet(
      { id: 'shape-process', group: 'Shapes', preview: 'flow' },
      { shapeVariant: 'diamond' },
    ),
    true,
  )
})

test('telecom profile defaults do not replace designed snippets unless labels are explicit', () => {
  const preset = { id: 'telecom-ofdm-transmitter', group: 'Telecom', preview: 'flow' }

  assert.equal(shouldUseConfiguredLibrarySnippet(preset, { blockLabels: 'Bits, QAM, IFFT' }), false)
  assert.equal(
    shouldUseConfiguredLibrarySnippet(preset, { blockLabels: 'Bits, QAM, IFFT' }, { explicitBlockLabels: true }),
    true,
  )
})

test('formatMatrixEntryRows accepts placeholder-style row separators without duplicating them', () => {
  assert.deepEqual(formatMatrixEntryRows('a & b\\\\\nc & d'), ['a & b', 'c & d'])
  assert.deepEqual(formatMatrixEntryRows('x & y \\\\ z & w'), ['x & y', 'z & w'])
  assert.deepEqual(formatMatrixEntryRows('\\alpha & 1\n\\beta & 2'), ['\\alpha & 1', '\\beta & 2'])
})

test('normalizeGanttRange keeps reversed dates inside the requested bounds', () => {
  assert.deepEqual(normalizeGanttRange(7, 3), { start: 3, end: 7 })
  assert.deepEqual(normalizeGanttRange(4, 4), { start: 4, end: 5 })
})
