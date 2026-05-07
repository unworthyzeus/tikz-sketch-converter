import assert from 'node:assert/strict'
import test from 'node:test'
import {
  barChartRowsForConfig,
  buildBarChartSnippet,
  buildGanttChartSnippet,
  buildModularDiagramSnippet,
  diagramSemanticConfigChanged,
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

test('semantic changes switch non-bar common diagrams to modular generated snippets', () => {
  const flowPreset = { id: 'ml-pipeline', group: 'ML / DL', preview: 'flow' }
  const defaults = { blockLabels: '', inputLabel: '', outputLabel: '', nodeLabels: 'A, B, C', connectNodes: true }

  assert.equal(diagramSemanticConfigChanged(flowPreset, defaults, defaults), false)
  assert.equal(
    diagramSemanticConfigChanged(
      flowPreset,
      { ...defaults, blockLabels: 'Raw IQ, Synchronize, Demodulate', inputLabel: 'samples' },
      defaults,
    ),
    true,
  )
  assert.equal(
    shouldUseConfiguredLibrarySnippet(
      flowPreset,
      { blockLabels: 'Raw IQ, Synchronize, Demodulate' },
      { explicitModularDiagramConfig: true },
    ),
    true,
  )
})

test('flow, graph, paper and control diagrams build semantically editable snippets', () => {
  const formatText = (value) => value

  const flow = buildModularDiagramSnippet(
    { id: 'ml-pipeline', group: 'ML / DL', preview: 'flow' },
    {
      blockLabels: 'Raw IQ, Synchronize, Demodulate',
      inputLabel: 'samples',
      outputLabel: 'bits',
      edgeLabels: 'aligned, symbols',
      branchCount: 3,
    },
    { formatText },
  ).join('\n')
  assert.match(flow, /Raw IQ/)
  assert.match(flow, /Synchronize/)
  assert.match(flow, /samples/)
  assert.match(flow, /bits/)
  assert.match(flow, /aligned/)

  const graph = buildModularDiagramSnippet(
    { id: 'graph-directed', group: 'Graph', preview: 'network' },
    {
      nodeLabels: 'UE, gNB, Core',
      edgeLabels: 'uplink, backhaul',
      connectNodes: true,
    },
    { formatText },
  ).join('\n')
  assert.match(graph, /\(n0\).*UE/)
  assert.match(graph, /\(n1\).*gNB/)
  assert.match(graph, /uplink/)

  const paper = buildModularDiagramSnippet(
    { id: 'paper-multi-panel', group: 'Paper', preview: 'flow' },
    { blockLabels: 'raw input, latent map, final output' },
    { formatText },
  ).join('\n')
  assert.match(paper, /raw input/)
  assert.match(paper, /latent map/)
  assert.match(paper, /Panel A/)

  const control = buildModularDiagramSnippet(
    { id: 'control-kalman-filter', group: 'Control', preview: 'flow' },
    {
      blockLabels: 'Predict, Innovation, Gain, Update',
      inputLabel: 'posterior',
      outputLabel: 'posterior feedback',
      edgeLabels: 'prior, residual, gain, posterior',
    },
    { formatText },
  ).join('\n')
  assert.match(control, /Predict/)
  assert.match(control, /Innovation/)
  assert.match(control, /posterior feedback/)
  assert.match(control, /residual/)
})

test('matrix, resource-grid, Tanner, MIMO and link-budget diagrams have specific modular snippets', () => {
  const formatText = (value) => value

  const confusion = buildModularDiagramSnippet(
    { id: 'ml-confusion', group: 'ML / DL', preview: 'matrix' },
    {
      classLabels: 'cat,dog',
      matrixEntries: '42,3\n5,50',
    },
    { formatText },
  ).join('\n')
  assert.match(confusion, /Predicted/)
  assert.match(confusion, /Actual/)
  assert.match(confusion, /cat/)
  assert.match(confusion, /42/)
  assert.match(confusion, /50/)

  const resourceGrid = buildModularDiagramSnippet(
    { id: 'telecom-ofdm-resource-grid', group: 'Telecom', preview: 'matrix' },
    {
      symbolCount: 8,
      subcarrierCount: 4,
      pilotSpacing: 2,
      blockLabels: 'pilot,data',
    },
    { formatText },
  ).join('\n')
  assert.match(resourceGrid, /OFDM resource grid/)
  assert.match(resourceGrid, /grid \(3\.04,1\.28\)/)
  assert.match(resourceGrid, /pilot/)
  assert.match(resourceGrid, /data/)

  const tanner = buildModularDiagramSnippet(
    { id: 'telecom-ldpc-tanner', group: 'Telecom', preview: 'network' },
    {
      variableCount: 5,
      checkCount: 3,
      edgeLabels: 'v1-c1,v2-c1,v3-c2,v5-c3',
    },
    { formatText },
  ).join('\n')
  assert.match(tanner, /\(v5\)/)
  assert.match(tanner, /\(c3\)/)
  assert.match(tanner, /\(v5\) -- \(c3\)/)
  assert.match(tanner, /variable bits/)

  const mimo = buildModularDiagramSnippet(
    { id: 'telecom-mimo-ofdm-downlink', group: 'Telecom', preview: 'network' },
    {
      antennaCount: 4,
      inputLabel: 'layers',
      outputLabel: 'decoded layers',
      channelLabel: '$H[k]$',
      blockLabels: 'layers,precoder,OFDM TX,channel,equalizer',
    },
    { formatText },
  ).join('\n')
  assert.match(mimo, /TX 4/)
  assert.match(mimo, /\$H\[k\]\$/)
  assert.match(mimo, /decoded layers/)

  const budget = buildModularDiagramSnippet(
    { id: 'telecom-link-budget', group: 'Telecom', preview: 'matrix' },
    {
      budgetRows: 'Tx power,23 dBm\nAntenna gain,15 dBi\nPath loss,-128 dB\nRx power,-90 dBm',
    },
    { formatText },
  ).join('\n')
  assert.match(budget, /Link budget/)
  assert.match(budget, /Tx power/)
  assert.match(budget, /23 dBm/)
  assert.match(budget, /Rx power/)
})

test('OFDM, FEC, channel, feedback, MIMO-link and RF diagrams have specialized modular snippets', () => {
  const formatText = (value) => value

  const ofdm = buildModularDiagramSnippet(
    { id: 'telecom-ofdm-transmitter', group: 'Telecom', preview: 'flow' },
    {
      blockLabels: 'Bits,QAM mapper,S/P,IFFT,CP + DAC',
      inputLabel: '$b_k$',
      outputLabel: '$s(t)$',
      carrierLabel: '$f_c$',
      modulation: '16-QAM',
      subcarrierCount: 4,
      symbolCount: 8,
      pilotSpacing: 2,
    },
    { formatText },
  ).join('\n')
  assert.match(ofdm, /OFDM TX/)
  assert.match(ofdm, /QAM mapper/)
  assert.match(ofdm, /Subcarriers x4/)
  assert.match(ofdm, /N_\{sym\}=8/)
  assert.match(ofdm, /\$f_c\$/)

  const fec = buildModularDiagramSnippet(
    { id: 'telecom-fec-chain', group: 'Telecom', preview: 'flow' },
    {
      blockLabels: 'CRC,LDPC encoder,Interleaver,QAM mapper,Channel,LDPC decoder',
      inputLabel: 'bits',
      outputLabel: 'decoded bits',
      modulation: 'rate 1/2',
      noiseLabel: 'erasures',
    },
    { formatText },
  ).join('\n')
  assert.match(fec, /FEC chain/)
  assert.match(fec, /LDPC encoder/)
  assert.match(fec, /rate 1\/2/)
  assert.match(fec, /erasures/)

  const channel = buildModularDiagramSnippet(
    { id: 'telecom-awgn-channel', group: 'Telecom', preview: 'flow' },
    {
      inputLabel: '$x(t)$',
      outputLabel: '$y(t)$',
      channelLabel: '$h(t)$',
      noiseLabel: '$n(t)$',
      snrLabel: 'SNR=12 dB',
      gainDb: -3,
    },
    { formatText },
  ).join('\n')
  assert.match(channel, /AWGN/)
  assert.match(channel, /\$n\(t\)\$/)
  assert.match(channel, /SNR=12 dB/)
  assert.match(channel, /-3 dB/)

  const feedback = buildModularDiagramSnippet(
    { id: 'telecom-synchronization-loop', group: 'Telecom', preview: 'flow' },
    {
      blockLabels: 'Timing error,Loop filter,NCO,Resampler',
      inputLabel: 'samples',
      outputLabel: 'aligned samples',
      feedbackLabel: 'timing estimate',
      carrierLabel: '$\\hat{\\tau}$',
    },
    { formatText },
  ).join('\n')
  assert.match(feedback, /Synchronization loop/)
  assert.match(feedback, /Timing error/)
  assert.match(feedback, /timing estimate/)
  assert.match(feedback, /\$\\hat\{\\tau\}\$/)

  const mimoLink = buildModularDiagramSnippet(
    { id: 'telecom-mimo-link', group: 'Telecom', preview: 'network' },
    {
      antennaCount: 3,
      inputLabel: '$\\mathbf{x}$',
      outputLabel: '$\\hat{\\mathbf{x}}$',
      channelLabel: '$\\mathbf{H}$',
      blockLabels: 'TX array,RX array',
    },
    { formatText },
  ).join('\n')
  assert.match(mimoLink, /TX 3/)
  assert.match(mimoLink, /RX 3/)
  assert.match(mimoLink, /\$\\mathbf\{H\}\$/)

  const rf = buildModularDiagramSnippet(
    { id: 'rf-front-end', group: 'Telecom', preview: 'flow' },
    {
      blockLabels: 'Antenna,LNA,BPF,Mixer,IF filter',
      inputLabel: 'RF in',
      outputLabel: 'IF out',
      carrierLabel: 'LO',
      gainDb: 15,
      noiseLabel: 'NF=2 dB',
    },
    { formatText },
  ).join('\n')
  assert.match(rf, /RF front-end/)
  assert.match(rf, /LNA/)
  assert.match(rf, /LO/)
  assert.match(rf, /15 dB/)
  assert.match(rf, /NF=2 dB/)
})

test('semantic change detection includes specialized diagram counts and rows', () => {
  const preset = { id: 'telecom-ofdm-resource-grid', group: 'Telecom', preview: 'matrix' }
  const defaults = { symbolCount: 6, subcarrierCount: 4, pilotSpacing: 3, blockLabels: '' }

  assert.equal(diagramSemanticConfigChanged(preset, defaults, defaults), false)
  assert.equal(diagramSemanticConfigChanged(preset, { ...defaults, symbolCount: 8 }, defaults), true)
  assert.equal(
    shouldUseConfiguredLibrarySnippet(preset, { symbolCount: 8 }, { explicitModularDiagramConfig: true }),
    true,
  )
})
