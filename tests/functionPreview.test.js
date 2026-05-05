import assert from 'node:assert/strict'
import test from 'node:test'
import { curveMarkerPoints, functionLegendEntries, markerGlyphParts } from '../src/functionPreview.js'

test('functionLegendEntries exposes every visible series with a useful label', () => {
  const entries = functionLegendEntries([
    { series: { id: 'primary', expression: 'sin(x)', legend: '', color: '#111111', lineStyle: 'solid', markerStyle: '*' } },
    { series: { id: 'series-2', expression: 'cos(x)', legend: 'carrier', color: '#1f4e79', lineStyle: 'dashed', markerStyle: 'square*' } },
    { series: { id: 'empty', expression: '', legend: '', color: '#8c2f39', lineStyle: 'dotted', markerStyle: 'none' } },
  ])

  assert.deepEqual(entries, [
    { id: 'primary', label: 'sin(x)', color: '#111111', lineStyle: 'solid', markerStyle: '*', index: 0 },
    { id: 'series-2', label: 'carrier', color: '#1f4e79', lineStyle: 'dashed', markerStyle: 'square*', index: 1 },
    { id: 'empty', label: 'Serie 3', color: '#8c2f39', lineStyle: 'dotted', markerStyle: 'none', index: 2 },
  ])
})

test('functionLegendEntries returns no entries when the requested maximum is zero', () => {
  const series = [
    { series: { id: 'primary', expression: 'sin(x)' } },
    { series: { id: 'secondary', expression: 'cos(x)' } },
    { series: { id: 'third', expression: 'tan(x)' } },
  ]

  assert.deepEqual(functionLegendEntries(series, 0), [])
  assert.deepEqual(functionLegendEntries(series, -2), [])
})

test('curveMarkerPoints samples finite curve points without flooding the preview', () => {
  const points = Array.from({ length: 25 }, (_, index) => ({ x: index, y: index * index }))

  assert.deepEqual(
    curveMarkerPoints(points, '*', 5).map((point) => point.x),
    [0, 6, 12, 18, 24],
  )
  assert.deepEqual(curveMarkerPoints(points, 'none', 5), [])
  assert.deepEqual(
    curveMarkerPoints([null, { x: 1, y: 1 }, null, { x: 2, y: 4 }], 'diamond*', 6).map((point) => point.x),
    [1, 2],
  )
})

test('curveMarkerPoints returns no preview markers when the requested maximum is zero', () => {
  const points = Array.from({ length: 5 }, (_, index) => ({ x: index, y: index }))

  assert.deepEqual(curveMarkerPoints(points, '*', 0), [])
  assert.deepEqual(curveMarkerPoints(points, '*', -3), [])
})

test('markerGlyphParts maps PGFPlots marker styles to SVG drawing primitives', () => {
  assert.deepEqual(markerGlyphParts('*', { x: 10, y: 20, size: 4 }), [
    { type: 'circle', cx: 10, cy: 20, r: 4, filled: true },
  ])
  assert.equal(markerGlyphParts('square*', { x: 10, y: 20, size: 4 })[0].type, 'rect')
  assert.equal(markerGlyphParts('triangle*', { x: 10, y: 20, size: 4 })[0].type, 'path')
  assert.equal(markerGlyphParts('x', { x: 10, y: 20, size: 4 }).length, 2)
  assert.deepEqual(markerGlyphParts('none', { x: 10, y: 20, size: 4 }), [])
})
