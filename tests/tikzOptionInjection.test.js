import assert from 'node:assert/strict'
import test from 'node:test'
import { injectTikzOptionsIntoLines } from '../src/tikzOptionInjection.js'

test('appends options before a multiline axis closing bracket so configured values win', () => {
  const result = injectTikzOptionsIntoLines(
    ['\\begin{axis}[', '  width=5cm, height=3cm,', '  grid=none', ']', '  \\addplot coordinates {(0,0) (1,1)};', '\\end{axis}'],
    ['width=6cm', 'grid=major'],
    ['\\begin{axis}'],
  )

  assert.deepEqual(result, [
    '\\begin{axis}[',
    '  width=5cm, height=3cm,',
    '  grid=none',
    '  width=6cm, grid=major,',
    ']',
    '  \\addplot coordinates {(0,0) (1,1)};',
    '\\end{axis}',
  ])
})

test('injects one-line commands without changing commands that have no options', () => {
  const result = injectTikzOptionsIntoLines(
    ['\\addplot[draw=black] coordinates {(0,0)};', '\\node at (0,0) {x};'],
    ['smooth', 'mark=*'],
    ['\\addplot'],
  )

  assert.deepEqual(result, ['\\addplot[draw=black, smooth, mark=*] coordinates {(0,0)};', '\\node at (0,0) {x};'])
})

test('keeps nested bracket options intact when injecting node styling', () => {
  const result = injectTikzOptionsIntoLines(
    ['\\node[label={[xshift=2pt]right:$x,y$}, draw=black] at (0,0) {A};'],
    ['fill=white'],
    ['\\node'],
  )

  assert.deepEqual(result, ['\\node[label={[xshift=2pt]right:$x,y$}, draw=black, fill=white] at (0,0) {A};'])
})

test('does not inject into macros that only share a command prefix', () => {
  const result = injectTikzOptionsIntoLines(['\\nodepart{second}Body', '\\drawedge (a) -- (b);'], ['draw=red'], [
    '\\node',
    '\\draw',
  ])

  assert.deepEqual(result, ['\\nodepart{second}Body', '\\drawedge (a) -- (b);'])
})
