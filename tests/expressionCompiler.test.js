import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const appSource = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8')

function loadExpressionCompiler() {
  const start = appSource.indexOf('function erf')
  const end = appSource.indexOf('function sampleExpressionPoints')
  assert.notEqual(start, -1)
  assert.notEqual(end, -1)
  return Function(`${appSource.slice(start, end)}; return { compileExpression };`)()
}

test('compileExpression keeps the supported min helper available', () => {
  const { compileExpression } = loadExpressionCompiler()

  assert.equal(compileExpression('min(2, x)')(5), 2)
})

test('compileExpression rejects mistyped helper names instead of aliasing them', () => {
  const { compileExpression } = loadExpressionCompiler()

  assert.throws(() => compileExpression('nin(2, x)'), /Nombre no permitido: nin/)
})
