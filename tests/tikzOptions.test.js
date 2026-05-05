import assert from 'node:assert/strict'
import test from 'node:test'
import { splitTikzOptions } from '../src/tikzOptions.js'

test('splitTikzOptions preserves commas inside nested TikZ option groups', () => {
  assert.deepEqual(
    splitTikzOptions('minor tick num=1, legend style={at={(0.5,-0.2)},anchor=north}, ymin=-1'),
    ['minor tick num=1', 'legend style={at={(0.5,-0.2)},anchor=north}', 'ymin=-1'],
  )
})

test('splitTikzOptions preserves commas inside inline math labels', () => {
  assert.deepEqual(splitTikzOptions('nodes={label={$x,y$}}, thick, color=black'), [
    'nodes={label={$x,y$}}',
    'thick',
    'color=black',
  ])
})
