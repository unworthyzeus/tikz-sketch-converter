import assert from 'node:assert/strict'
import test from 'node:test'
import {
  barChartRowsForConfig,
  buildBarChartSnippet,
  buildGanttChartSnippet,
  formatMatrixEntryRows,
  ganttTaskRowsForConfig,
  normalizeGanttRange,
  shouldUseConfiguredLibrarySnippet,
} from '../src/librarySnippetConfig.js'

test('shape variants only replace snippets for configurable primitive presets', () => {
  assert.equal(
    shouldUseConfiguredLibrarySnippet(
      { id: 'circuit-rc-lowpass', group: 'Circuit', preview: 'circuit' },
      { shapeVariant: 'rounded' },
      { hasCircuitComponent: false },
    ),
    false,
  )
  assert.equal(
    shouldUseConfiguredLibrarySnippet(
      { id: 'circuit-resistor', group: 'Circuit', preview: 'resistor' },
      { shapeVariant: 'rounded' },
      { hasCircuitComponent: true },
    ),
    true,
  )
  assert.equal(
    shouldUseConfiguredLibrarySnippet(
      { id: 'telecom-ofdm-transmitter', group: 'Telecom', preview: 'flow' },
      { blockLabels: '' },
    ),
    false,
  )
  assert.equal(
    shouldUseConfiguredLibrarySnippet(
      { id: 'shape-process', group: 'Shapes', preview: 'flow' },
      { shapeVariant: 'diamond' },
    ),
    true,
  )
})

test('telecom profile defaults do not replace designed snippets unless labels are explicit', () => {
  const preset = { id: 'telecom-ofdm-transmitter', group: 'Telecom', preview: 'flow' }

  assert.equal(shouldUseConfiguredLibrarySnippet(preset, { blockLabels: 'Bits, QAM, IFFT' }), false)
  assert.equal(
    shouldUseConfiguredLibrarySnippet(preset, { blockLabels: 'Bits, QAM, IFFT' }, { explicitBlockLabels: true }),
    true,
  )
})

test('formatMatrixEntryRows accepts placeholder-style row separators without duplicating them', () => {
  assert.deepEqual(formatMatrixEntryRows('a & b\\\\\nc & d'), ['a & b', 'c & d'])
  assert.deepEqual(formatMatrixEntryRows('x & y \\\\ z & w'), ['x & y', 'z & w'])
  assert.deepEqual(formatMatrixEntryRows('\\alpha & 1\n\\beta & 2'), ['\\alpha & 1', '\\beta & 2'])
})

test('normalizeGanttRange keeps reversed dates inside the requested bounds', () => {
  assert.deepEqual(normalizeGanttRange(7, 3), { start: 3, end: 7 })
  assert.deepEqual(normalizeGanttRange(4, 4), { start: 4, end: 5 })
})

test('gantt row config controls task count, labels, ranges and progress per bar', () => {
  const config = {
    barCount: 4,
    ganttStart: 1,
    ganttEnd: 8,
    ganttProgress: 60,
    plotTitle: 'Radio rollout',
    ganttTasks: 'Spec,1,2,100\nRF design,2,5,75\nPrototype,5,7\nField test,7,8,20',
  }

  assert.deepEqual(ganttTaskRowsForConfig(config), [
    { label: 'Spec', start: 1, end: 2, progress: 100 },
    { label: 'RF design', start: 2, end: 5, progress: 75 },
    { label: 'Prototype', start: 5, end: 7, progress: 60 },
    { label: 'Field test', start: 7, end: 8, progress: 20 },
  ])

  const snippet = buildGanttChartSnippet(config, { formatText: (value) => value }).join('\n')
  assert.match(snippet, /\\begin\{ganttchart\}.*\{1\}\{8\}/)
  assert.match(snippet, /\\gantttitle\{Radio rollout\}\{8\}/)
  assert.equal((snippet.match(/\\ganttbar/g) ?? []).length, 4)
  assert.match(snippet, /\\ganttbar\[progress=75\]\{RF design\}\{2\}\{5\}/)
})

test('gantt row config keeps legacy block labels when task rows are not explicit', () => {
  assert.deepEqual(
    ganttTaskRowsForConfig({
      barCount: 3,
      ganttStart: 1,
      ganttEnd: 7,
      blockLabels: 'Prep,Train,Write',
    }).map((row) => row.label),
    ['Prep', 'Train', 'Write'],
  )
})

test('bar chart row config controls bar count, category positions and values', () => {
  const config = {
    barCount: 4,
    barData: 'LTE,4.2\nNR downlink,6.5\nWiFi,3\nSAT,2.5',
  }

  assert.deepEqual(barChartRowsForConfig(config), [
    { key: 'bar1', label: 'LTE', value: 4.2 },
    { key: 'bar2', label: 'NR downlink', value: 6.5 },
    { key: 'bar3', label: 'WiFi', value: 3 },
    { key: 'bar4', label: 'SAT', value: 2.5 },
  ])

  const snippet = buildBarChartSnippet(config, { formatText: (value) => value }).join('\n')
  assert.match(snippet, /symbolic x coords=\{bar1,bar2,bar3,bar4\}/)
  assert.match(snippet, /xticklabels=\{LTE,NR downlink,WiFi,SAT\}/)
  assert.match(snippet, /coordinates \{\(bar1,4\.2\) \(bar2,6\.5\) \(bar3,3\) \(bar4,2\.5\)\}/)
})

test('bar and gantt config switch common diagrams to generated editable snippets', () => {
  assert.equal(
    shouldUseConfiguredLibrarySnippet({ id: 'gantt-paper', group: 'Planning', preview: 'flow' }, { ganttTasks: 'Prep,1,2' }),
    true,
  )
  assert.equal(
    shouldUseConfiguredLibrarySnippet({ id: 'plot-bar', group: 'Plots', preview: 'plot' }, { barData: 'A,2\nB,3' }),
    true,
  )
  assert.equal(
    shouldUseConfiguredLibrarySnippet({ id: 'plot-bar', group: 'Plots', preview: 'plot' }, { barCount: 5 }),
    true,
  )
})
