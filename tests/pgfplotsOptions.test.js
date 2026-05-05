import assert from 'node:assert/strict'
import test from 'node:test'
import { advancedPgfplotsAxisOptions } from '../src/pgfplotsOptions.js'

test('advancedPgfplotsAxisOptions emits optional axis controls predictably', () => {
  assert.deepEqual(
    advancedPgfplotsAxisOptions({
      axisEqual: true,
      minorTicks: 2,
      legendColumns: 3,
      reverseX: true,
      reverseY: true,
    }),
    ['axis equal image', 'minor tick num=2', 'legend columns=3', 'x dir=reverse', 'y dir=reverse'],
  )
})

test('advancedPgfplotsAxisOptions omits default values', () => {
  assert.deepEqual(advancedPgfplotsAxisOptions({ minorTicks: 0, legendColumns: 1 }), [])
})
