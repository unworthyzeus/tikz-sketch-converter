import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const appSource = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8')

function loadTikzTextHelpers() {
  const start = appSource.indexOf('function escapeTikzText')
  const end = appSource.indexOf('function indentLatex')
  assert.notEqual(start, -1)
  assert.notEqual(end, -1)
  return Function(`${appSource.slice(start, end)}; return { formatTikzNodeText };`)()
}

test('formatTikzNodeText escapes literal text around inline math', () => {
  const { formatTikzNodeText } = loadTikzTextHelpers()

  assert.equal(formatTikzNodeText('Gain 50% at $x_1$ & rising'), 'Gain 50\\% at $x_1$ \\& rising')
})

test('formatTikzNodeText preserves explicit LaTeX-only labels', () => {
  const { formatTikzNodeText } = loadTikzTextHelpers()

  assert.equal(formatTikzNodeText('\\alpha_1'), '\\alpha_1')
})

test('formatTikzNodeText escapes literal text around LaTeX commands', () => {
  const { formatTikzNodeText } = loadTikzTextHelpers()

  assert.equal(formatTikzNodeText('Gain \\alpha_1 & 50%'), 'Gain \\alpha_1 \\& 50\\%')
})

test('formatTikzNodeText treats an unmatched dollar as literal text', () => {
  const { formatTikzNodeText } = loadTikzTextHelpers()

  assert.equal(formatTikzNodeText('Cost $5 & rising'), 'Cost \\$5 \\& rising')
})
