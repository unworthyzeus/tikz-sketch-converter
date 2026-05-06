import assert from 'node:assert/strict'
import test from 'node:test'
import {
  functionDataTableRows,
  functionDataTableUsesYError,
  parseFunctionDataTable,
} from '../src/functionDataTable.js'

test('parseFunctionDataTable keeps an optional y-error column', () => {
  assert.deepEqual(parseFunctionDataTable('0,1,0.1\n1 2 0.2\nbad row\n2,3'), [
    { x: 0, y: 1, yError: 0.1 },
    { x: 1, y: 2, yError: 0.2 },
    { x: 2, y: 3 },
  ])
})

test('functionDataTableRows exports yerr only when error bars have data', () => {
  assert.equal(functionDataTableUsesYError([{ x: 0, y: 1, yError: 0.1 }]), true)
  assert.deepEqual(
    functionDataTableRows([
      { x: 0, y: 1, yError: 0.1 },
      { x: 1, y: 2 },
    ]),
    ['x y yerr', '0 1 0.1', '1 2 0'],
  )
  assert.deepEqual(functionDataTableRows([{ x: 0, y: 1 }]), ['x y', '0 1'])
})
