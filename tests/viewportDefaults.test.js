import assert from 'node:assert/strict'
import test from 'node:test'
import { clampCanvasZoom, initialCanvasZoom } from '../src/viewportDefaults.js'

test('clampCanvasZoom keeps zoom inside the supported editor range', () => {
  assert.equal(clampCanvasZoom(0.1), 0.55)
  assert.equal(clampCanvasZoom(1.25), 1.25)
  assert.equal(clampCanvasZoom(9), 2.25)
  assert.equal(clampCanvasZoom('nope'), 1)
})

test('initialCanvasZoom respects a shared-board zoom before responsive defaults', () => {
  assert.equal(initialCanvasZoom(1.8, 390), 1.8)
  assert.equal(initialCanvasZoom(4, 390), 2.25)
})

test('initialCanvasZoom fits the editor better on narrow viewports', () => {
  assert.equal(initialCanvasZoom(undefined, 390), 0.55)
  assert.equal(initialCanvasZoom(undefined, 760), 0.75)
  assert.equal(initialCanvasZoom(undefined, 1180), 1)
  assert.equal(initialCanvasZoom(undefined, undefined), 1)
})
