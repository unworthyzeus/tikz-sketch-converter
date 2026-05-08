import assert from 'node:assert/strict'
import test from 'node:test'
import { applySnippetLabelOverrides, editableSnippetLabelsForLines } from '../src/snippetLabels.js'
import { libraryPaletteItems } from '../src/tikzPaletteItems.js'
import { libraryPresets } from '../src/tikzLibraryPresets.js'

test('extracts labels from circuitikz options, node contents and gantt commands', () => {
  const lines = [
    '\\draw (0,0) to[sV,l=$V_s$] (0,-2) to[R,l=$R$] (1,0);',
    '\\draw (op.-) -- ++(-0.8,0) node[left] {$v_-$};',
    '\\gantttitle{ML Delivery}{7} \\\\',
    '\\ganttbar{Training}{4}{6} \\\\',
  ]

  assert.deepEqual(
    editableSnippetLabelsForLines(lines).map((item) => item.value),
    ['$V_s$', '$R$', '$v_-$', 'ML Delivery', 'Training'],
  )
})

test('extracts labels from pgfplots axis labels, legends, tikz-cd arrows and matrix cells', () => {
  const lines = [
    '\\begin{axis}[xlabel={$x$}, ylabel={Score}, title={Run A}]',
    '  \\legend{$x^2$,$2-x^2$}',
    '  A \\arrow[r, "f"] & B \\\\',
    '  a_{11} & a_{12} \\\\',
  ]

  assert.deepEqual(
    editableSnippetLabelsForLines(lines).map((item) => item.value),
    ['$x$', 'Score', 'Run A', '$x^2$', '$2-x^2$', 'A', 'f', 'B', 'a_{11}', 'a_{12}'],
  )
})

test('applies per-object snippet label overrides without changing surrounding TikZ syntax', () => {
  const lines = [
    '\\draw (0,0) to[R,l=$R$] (2,0);',
    '\\node[state] (q0) {$q_0$};',
    '\\begin{axis}[xlabel={$x$}, ylabel={Score}]',
  ]
  const labels = editableSnippetLabelsForLines(lines)
  const overrides = Object.fromEntries(labels.map((item) => [item.key, item.value]))
  overrides['snippet-label-0'] = '$R_f$'
  overrides['snippet-label-1'] = '$s_0$'
  overrides['snippet-label-2'] = '$t$'
  overrides['snippet-label-3'] = 'Accuracy'

  assert.deepEqual(
    applySnippetLabelOverrides(lines, overrides, { formatText: (value) => `FMT(${value})` }),
    [
      '\\draw (0,0) to[R,l=FMT($R_f$)] (2,0);',
      '\\node[state] (q0) {FMT($s_0$)};',
      '\\begin{axis}[xlabel={FMT($t$)}, ylabel={FMT(Accuracy)}]',
    ],
  )
})

test('all shipped object and diagram galleries expose many snippet labels for editing', () => {
  const labels = [...libraryPaletteItems, ...libraryPresets].flatMap((preset) => editableSnippetLabelsForLines(preset.snippet ?? []))

  assert.ok(labels.length > 100)
  assert.ok(labels.some((item) => item.value === '$R$'))
  assert.ok(labels.some((item) => item.value === 'Training'))
  assert.ok(labels.some((item) => item.value === '$q_0$'))
})
