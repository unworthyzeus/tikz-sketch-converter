import assert from 'node:assert/strict'
import test from 'node:test'
import { moveElementBy } from '../src/elementTransforms.js'

test('moveElementBy translates geometric endpoints', () => {
  const moved = moveElementBy(
    {
      type: 'line',
      start: { x: -1, y: 2 },
      end: { x: 3, y: -4 },
    },
    2,
    -1,
  )

  assert.deepEqual(moved.start, { x: 1, y: 1 })
  assert.deepEqual(moved.end, { x: 5, y: -5 })
})

test('moveElementBy translates function graphs without changing their domain', () => {
  const element = {
    type: 'function',
    expression: 'sin(x)',
    domainStart: -6,
    domainEnd: 6,
    samples: 120,
    yOffset: 0.5,
    functionOptions: {
      series: [
        { id: 'cos', expression: 'cos(x)', enabled: true },
        { id: 'tan', expression: 'tan(x)', enabled: true },
      ],
    },
  }

  const moved = moveElementBy(element, 3.25, -2)

  assert.equal(moved.domainStart, -6)
  assert.equal(moved.domainEnd, 6)
  assert.equal(moved.xOffset, 3.25)
  assert.equal(moved.yOffset, -1.5)
  assert.deepEqual(moved.functionOptions.series, element.functionOptions.series)
})
