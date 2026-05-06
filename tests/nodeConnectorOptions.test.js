import assert from 'node:assert/strict'
import test from 'node:test'
import {
  connectorLabelTikz,
  splitNodeLabels,
} from '../src/nodeConnectorOptions.js'

const formatText = (value) => `tikz(${value})`

test('splitNodeLabels accepts comma, semicolon and newline separators', () => {
  assert.deepEqual(splitNodeLabels('alpha, beta; gamma\ndelta', 5), ['alpha', 'beta', 'gamma', 'delta', '5'])
})

test('connectorLabelTikz emits directional labels for generated extra-node edges', () => {
  assert.equal(
    connectorLabelTikz({ edgeLabels: 'raw, equalized', nodeDirection: 'right' }, 0, formatText),
    ' node[midway, above, font=\\scriptsize] {tikz(raw)}',
  )
  assert.equal(
    connectorLabelTikz({ edgeLabels: 'raw, equalized', nodeDirection: 'down' }, 1, formatText),
    ' node[midway, right, font=\\scriptsize] {tikz(equalized)}',
  )
})

test('connectorLabelTikz omits missing connector labels', () => {
  assert.equal(connectorLabelTikz({ edgeLabels: 'raw', nodeDirection: 'left' }, 2, formatText), '')
})

test('connectorLabelTikz preserves explicit numeric connector labels', () => {
  assert.equal(
    connectorLabelTikz({ edgeLabels: '1, 2', nodeDirection: 'right' }, 0, formatText),
    ' node[midway, above, font=\\scriptsize] {tikz(1)}',
  )
})
