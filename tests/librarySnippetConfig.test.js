import assert from 'node:assert/strict'
import test from 'node:test'
import { shouldUseConfiguredLibrarySnippet } from '../src/librarySnippetConfig.js'

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
