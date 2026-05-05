import assert from 'node:assert/strict'
import test from 'node:test'
import { circuitDrawTikzOptions } from '../src/circuitOptions.js'

test('circuitDrawTikzOptions wires the exposed bipole length control into TikZ output', () => {
  assert.deepEqual(circuitDrawTikzOptions({ bipoleLength: 1.75 }), [
    'draw=__COLOR__',
    'line width=0.65pt',
    'bipoles/length=1.75cm',
  ])
})

test('circuitDrawTikzOptions omits bipole length at the default zero value', () => {
  assert.deepEqual(circuitDrawTikzOptions({ bipoleLength: 0 }), ['draw=__COLOR__', 'line width=0.65pt'])
})

test('circuitDrawTikzOptions wires the exposed IEC and American style control into TikZ output', () => {
  assert.deepEqual(circuitDrawTikzOptions({ circuitStyle: 'iec' }), ['draw=__COLOR__', 'line width=0.65pt', 'european'])
  assert.deepEqual(circuitDrawTikzOptions({ circuitStyle: 'american' }), [
    'draw=__COLOR__',
    'line width=0.65pt',
    'american',
  ])
  assert.deepEqual(circuitDrawTikzOptions({ circuitStyle: 'auto' }), ['draw=__COLOR__', 'line width=0.65pt'])
})
