import assert from 'node:assert/strict'
import test from 'node:test'
import {
  functionFrameBoundsForDataBounds,
  mapFunctionPointToFrame,
  resizeFunctionPlotToBounds,
} from '../src/functionLayout.js'

test('resizeFunctionPlotToBounds changes only the visual plot box', () => {
  const element = {
    type: 'function',
    expression: 'sin(x)',
    domainStart: -6,
    domainEnd: 6,
    samples: 160,
    xOffset: 1.25,
    yOffset: -0.5,
    functionOptions: {
      axisWidth: '7cm',
      axisHeight: '4.5cm',
      yScale: 2,
      series: [{ id: 'cos', expression: 'cos(x)', enabled: true }],
    },
  }
  const resized = resizeFunctionPlotToBounds(
    element,
    { minX: -2, maxX: 8, minY: -3, maxY: 2 },
    { minX: -1, maxX: 6, minY: -1.5, maxY: 3 },
    element.functionOptions,
    (value) => `${Math.round(value * 1000) / 1000}`,
  )

  assert.equal(resized.expression, 'sin(x)')
  assert.equal(resized.domainStart, -6)
  assert.equal(resized.domainEnd, 6)
  assert.equal(resized.xOffset, 1.75)
  assert.equal(resized.yOffset, -1.75)
  assert.equal(resized.functionOptions.yScale, 2)
  assert.deepEqual(resized.functionOptions.series, element.functionOptions.series)
  assert.equal(resized.functionOptions.axisWidth, '10cm')
  assert.equal(resized.functionOptions.axisHeight, '5cm')
})

test('function frame uses axis dimensions and maps math points into the resized plot box', () => {
  const dataBounds = { minX: -5, maxX: 5, minY: -1, maxY: 1 }
  const frameBounds = functionFrameBoundsForDataBounds(dataBounds, { axisWidth: '8cm', axisHeight: '4cm' })

  assert.deepEqual(frameBounds, { minX: -4, maxX: 4, minY: -2, maxY: 2 })
  assert.deepEqual(mapFunctionPointToFrame({ x: -5, y: -1 }, dataBounds, frameBounds), { x: -4, y: -2 })
  assert.deepEqual(mapFunctionPointToFrame({ x: 0, y: 0 }, dataBounds, frameBounds), { x: 0, y: 0 })
  assert.deepEqual(mapFunctionPointToFrame({ x: 5, y: 1 }, dataBounds, frameBounds), { x: 4, y: 2 })
})
