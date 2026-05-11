import assert from 'node:assert/strict'
import test from 'node:test'
import { parseEditableTikzPrimitives } from '../src/tikzPrimitiveImport.js'

test('parseEditableTikzPrimitives imports multiple basic TikZ primitives', () => {
  const result = parseEditableTikzPrimitives(String.raw`
    \begin{tikzpicture}
      \node at (0,0) {$x$};
      \draw[dashed, line width=1.4pt] (0,0) -- (1,1) -- (2,0);
      \draw (2,1) rectangle (3,2);
      \draw[->] (-1,0) -- (-2,0);
    \end{tikzpicture}
  `)

  assert.equal(result.unsupported.length, 0)
  assert.deepEqual(
    result.elements.map((element) => element.type),
    ['text', 'path', 'rect', 'arrow'],
  )
  assert.equal(result.elements[1].dashed, true)
  assert.equal(result.elements[1].width, 1.4)
  assert.equal(result.elements[3].arrowStyle, 'stealth')
})

test('parseEditableTikzPrimitives imports circles and ellipses as editable ellipses', () => {
  const result = parseEditableTikzPrimitives(String.raw`
    \draw (1,2) circle (0.5);
    \draw (3,4) ellipse [x radius=1.5, y radius=.25];
  `)

  assert.equal(result.unsupported.length, 0)
  assert.deepEqual(result.elements[0], {
    type: 'ellipse',
    start: { x: 0.5, y: 1.5 },
    end: { x: 1.5, y: 2.5 },
  })
  assert.equal(result.elements[1].start.x, 1.5)
  assert.equal(result.elements[1].end.y, 4.25)
})

test('parseEditableTikzPrimitives preserves unsupported commands for snippet fallback', () => {
  const result = parseEditableTikzPrimitives(String.raw`
    \draw (0,0) .. controls (1,1) .. (2,0);
    \draw (0,0) -- (1,0);
  `)

  assert.equal(result.elements.length, 1)
  assert.deepEqual(result.unsupported, [String.raw`\draw (0,0) .. controls (1,1) .. (2,0);`])
})
