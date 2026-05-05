import assert from 'node:assert/strict'
import test from 'node:test'
import { objectPreviewBadges, terminalPreviewLabels } from '../src/objectPreview.js'

test('objectPreviewBadges prioritizes visible object identity and metadata', () => {
  const badges = objectPreviewBadges(
    { title: 'Resistor', group: 'Circuits' },
    {
      autoLabel: true,
      circuitLabel: 'R_1',
      circuitValue: '10 k',
      netName: 'Vout',
      referenceName: 'fig:filter',
      paperRole: 'load',
      datasetTag: 'bench-a',
      spiceModel: 'R',
    },
  )

  assert.deepEqual(badges, [
    { key: 'label', text: 'R_1' },
    { key: 'value', text: '10 k' },
    { key: 'net', text: 'net: Vout' },
    { key: 'ref', text: 'fig:filter' },
  ])
})

test('objectPreviewBadges falls back to object title and trims empty metadata', () => {
  assert.deepEqual(objectPreviewBadges({ title: 'Transformer' }, { label: '  ', paperRole: 'encoder' }, 3), [
    { key: 'title', text: 'Transformer' },
    { key: 'role', text: 'encoder' },
  ])
})

test('terminalPreviewLabels uses configured terminal names when available', () => {
  assert.deepEqual(terminalPreviewLabels('in, out', 2), ['in', 'out'])
  assert.deepEqual(terminalPreviewLabels('gate; drain\nsource', 3), ['gate', 'drain', 'source'])
  assert.deepEqual(terminalPreviewLabels('D, G, S', 2), ['D', 'G'])
  assert.deepEqual(terminalPreviewLabels('', 3), ['1', '2', '3'])
})
