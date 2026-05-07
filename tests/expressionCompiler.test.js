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

test('compileExpression treats a leading negative base with mathematical exponent precedence', () => {
  const { compileExpression } = loadExpressionCompiler()

  assert.equal(compileExpression('-x^2')(2), -4)
  assert.equal(compileExpression('(-x)^2')(2), 4)
  assert.equal(compileExpression('-sin(x)^2')(Math.PI / 2), -1)
})

test('compileExpression accepts common implicit multiplication notation', () => {
  const { compileExpression } = loadExpressionCompiler()

  assert.equal(compileExpression('2x + 3pi')(4), 8 + 3 * Math.PI)
  assert.equal(compileExpression('2(x + 1)')(3), 8)
  assert.equal(compileExpression('(x + 1)(x - 1)')(5), 24)
})

test('compileExpression rejects adjacent numeric literals instead of multiplying them implicitly', () => {
  const { compileExpression } = loadExpressionCompiler()

  assert.throws(() => compileExpression('1.2.3')(0), /Expresion matematica invalida/)
  assert.throws(() => compileExpression('2 3')(0), /Expresion matematica invalida/)
})
