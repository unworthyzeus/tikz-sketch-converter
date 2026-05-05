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

test('advancedPgfplotsAxisOptions emits bounds and style controls', () => {
  assert.deepEqual(
    advancedPgfplotsAxisOptions({
      xmin: '-1',
      xmax: '1',
      ymin: '1e-6',
      ymax: 1,
      xLabelStyle: 'font=\\small',
      yLabelStyle: 'rotate=-90',
      tickLabelStyle: 'font=\\scriptsize',
      legendStyle: 'draw=none, fill=none',
      axisLineStyle: 'line width=.45pt',
      gridLineStyle: 'dashed, gray!30',
      enlargeLimits: 'false',
    }),
    [
      'xmin=-1',
      'xmax=1',
      'ymin=1e-6',
      'ymax=1',
      'xlabel style={font=\\small}',
      'ylabel style={rotate=-90}',
      'tick label style={font=\\scriptsize}',
      'legend style={draw=none, fill=none}',
      'axis line style={line width=.45pt}',
      'grid style={dashed, gray!30}',
      'enlargelimits=false',
    ],
  )
})
