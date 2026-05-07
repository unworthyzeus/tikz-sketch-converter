const configurablePrimitiveIds = new Set([
  'shape-process',
  'shape-decision',
  'shape-ellipse-node',
  'shape-cylinder',
  'shape-cloud',
  'shape-callout',
  'shape-rounded-module',
  'math-equation-node',
  'math-theorem-box',
  'annotation-callout-arrow',
])

function hasText(value) {
  return `${value ?? ''}`.trim().length > 0
}

function formatNumber(value) {
  const number = Number(value)
  if (!Number.isFinite(number)) return '0'
  const rounded = Math.round(number * 1000) / 1000
  return Object.is(rounded, -0) ? '0' : `${rounded}`
}

function numberInRange(value, fallback, min, max) {
  const number = Number(value)
  if (!Number.isFinite(number)) return fallback
  return Math.max(min, Math.min(max, number))
}

function countInRange(value, fallback = 3) {
  return Math.round(numberInRange(value, fallback, 1, 20))
}

function clampProgress(value, fallback = 0) {
  return Math.round(numberInRange(value, fallback, 0, 100))
}

function splitConfigRows(value = '') {
  return `${value ?? ''}`
    .split(/\n|;/)
    .map((line) => line.trim())
    .filter(Boolean)
}

function splitInlineLabels(value = '') {
  return `${value ?? ''}`
    .split(/[,\n;]/)
    .map((line) => line.trim())
    .filter(Boolean)
}

function textFor(value, fallback = '') {
  const text = `${value ?? ''}`.trim()
  return text || fallback
}

function taskLetter(index) {
  return String.fromCharCode(65 + (index % 26))
}

function diagramText(preset = {}) {
  return `${preset.id ?? ''} ${preset.group ?? ''} ${preset.preview ?? ''} ${preset.title ?? ''}`.toLowerCase()
}

export function modularDiagramKindForPreset(preset = {}) {
  const id = `${preset.id ?? ''}`.toLowerCase()
  const group = `${preset.group ?? ''}`.toLowerCase()
  const preview = `${preset.preview ?? ''}`.toLowerCase()
  const text = diagramText(preset)

  if (id === 'ml-confusion') return 'confusion'
  if (id === 'telecom-ofdm-resource-grid' || id === 'telecom-5g-nr-frame') return 'resource-grid'
  if (id === 'telecom-link-budget') return 'link-budget'
  if (id === 'telecom-ldpc-tanner') return 'tanner'
  if (id === 'telecom-mimo-ofdm-downlink') return 'mimo-ofdm'
  if (
    id === 'telecom-ofdm-transmitter' ||
    id === 'telecom-ofdm-receiver' ||
    id === 'telecom-ofdm-pilot-estimator' ||
    id === 'telecom-ofdm-transceiver'
  ) {
    return 'ofdm-chain'
  }
  if (id === 'telecom-fec-chain') return 'fec-chain'
  if (id === 'telecom-awgn-channel' || id === 'telecom-channel') return 'awgn-channel'
  if (
    id === 'telecom-synchronization-loop' ||
    id === 'telecom-pll' ||
    id === 'telecom-feedback-loop' ||
    id === 'telecom-adaptive-equalizer'
  ) {
    return 'feedback-loop'
  }
  if (id === 'telecom-mimo-link' || id === 'telecom-mimo-tx' || id === 'telecom-mimo-rx' || id === 'telecom-mimo-channel') {
    return 'mimo-link'
  }
  if (id === 'rf-front-end' || id === 'telecom-superhet') return 'rf-chain'
  if (id.includes('gantt') || preview === 'plot' || group === 'plots' || group === 'stats') return null
  if (group === 'circuit' || text.includes('circuit')) return null
  if (preview === 'matrix' || text.includes('matrix') || text.includes('confusion')) return null
  if (id === 'paper-multi-panel' || group === 'paper') return 'panel'
  if (id === 'control-kalman-filter' || group === 'control') return 'control'
  if (id === 'math-venn') return 'set'
  if (id === 'commutative-square' || id === 'math-comm-triangle') return 'commutative'
  if (id === 'uml-sequence') return 'sequence'
  if (id === 'uml-usecase') return 'usecase'
  if (group === 'er') return 'entity'
  if (preview === 'network' || preview === 'tree' || group === 'graph' || group === 'automata' || group === 'petri') {
    return 'network'
  }
  if (preview === 'flow' || preview === 'cube' || group === 'flow' || group === 'ml / dl' || group === 'uml') return 'flow'

  return null
}

export function semanticDiagramFieldsForPreset(preset = {}) {
  switch (modularDiagramKindForPreset(preset)) {
    case 'confusion':
      return ['classLabels', 'matrixEntries', 'inputLabel', 'outputLabel']
    case 'resource-grid':
      return ['symbolCount', 'subcarrierCount', 'pilotSpacing', 'blockLabels', 'inputLabel', 'outputLabel']
    case 'link-budget':
      return ['budgetRows', 'matrixEntries', 'inputLabel', 'outputLabel', 'gainDb']
    case 'tanner':
      return ['variableCount', 'checkCount', 'edgeLabels', 'nodeLabels', 'blockLabels']
    case 'mimo-ofdm':
      return ['antennaCount', 'blockLabels', 'inputLabel', 'outputLabel', 'channelLabel']
    case 'ofdm-chain':
      return [
        'blockLabels',
        'inputLabel',
        'outputLabel',
        'signalLabel',
        'carrierLabel',
        'modulation',
        'symbolCount',
        'subcarrierCount',
        'pilotSpacing',
        'noiseLabel',
      ]
    case 'fec-chain':
      return ['blockLabels', 'inputLabel', 'outputLabel', 'signalLabel', 'modulation', 'branchCount', 'noiseLabel']
    case 'awgn-channel':
      return ['inputLabel', 'outputLabel', 'channelLabel', 'noiseLabel', 'snrLabel', 'gainDb', 'modulation']
    case 'feedback-loop':
      return ['blockLabels', 'edgeLabels', 'inputLabel', 'outputLabel', 'feedbackLabel', 'signalLabel', 'carrierLabel', 'nodeDistance']
    case 'mimo-link':
      return ['antennaCount', 'branchCount', 'inputLabel', 'outputLabel', 'channelLabel', 'blockLabels', 'modulation', 'noiseLabel']
    case 'rf-chain':
      return ['blockLabels', 'inputLabel', 'outputLabel', 'carrierLabel', 'gainDb', 'noiseLabel', 'terminalNames']
    case 'control':
      return ['blockLabels', 'edgeLabels', 'inputLabel', 'outputLabel', 'feedbackLabel', 'nodeDistance']
    case 'network':
      return ['nodeLabels', 'edgeLabels', 'blockLabels', 'connectNodes', 'branchCount', 'nodeDistance', 'layerDistance']
    case 'panel':
      return ['blockLabels', 'nodeLabels', 'matrixEntries', 'branchCount']
    case 'set':
      return ['nodeLabels', 'blockLabels']
    case 'commutative':
      return ['nodeLabels', 'edgeLabels', 'nodeDistance', 'layerDistance']
    case 'sequence':
      return ['nodeLabels', 'edgeLabels', 'branchCount', 'nodeDistance']
    case 'usecase':
      return ['inputLabel', 'blockLabels', 'nodeLabels']
    case 'entity':
      return ['blockLabels', 'matrixEntries', 'nodeLabels']
    case 'flow':
      return ['blockLabels', 'nodeLabels', 'edgeLabels', 'inputLabel', 'outputLabel', 'signalLabel', 'branchCount', 'nodeDistance']
    default:
      return []
  }
}

function comparableConfigValue(value) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return Number.isFinite(value) ? Math.round(value * 1000) / 1000 : ''
  const text = `${value ?? ''}`.trim()
  const number = Number(text)
  if (text !== '' && Number.isFinite(number)) return Math.round(number * 1000) / 1000
  return text
}

export function diagramSemanticConfigChanged(preset = {}, config = {}, defaultConfig = {}) {
  return semanticDiagramFieldsForPreset(preset).some(
    (field) => comparableConfigValue(config[field]) !== comparableConfigValue(defaultConfig[field]),
  )
}

function explicitLabels(value = '') {
  return splitInlineLabels(value)
}

function labelsForConfig(config = {}, key, fallbackLabels = [], fallbackCount = 3) {
  const explicit = explicitLabels(config[key])
  const source = explicit.length ? explicit : fallbackLabels
  const requested = explicit.length || Number(config.branchCount) || source.length || fallbackCount
  const count = countInRange(requested, fallbackCount)

  return Array.from({ length: count }, (_, index) => source[index] ?? `Step ${index + 1}`)
}

function fixedLabelsForConfig(config = {}, key, fallbackLabels = [], minimumCount = fallbackLabels.length) {
  const explicit = explicitLabels(config[key])
  const source = explicit.length ? explicit : fallbackLabels
  const count = Math.max(1, Math.min(20, explicit.length || fallbackLabels.length || minimumCount || 1))

  return Array.from({ length: Math.max(count, minimumCount) }, (_, index) => source[index] ?? `Step ${index + 1}`)
}

function countFromConfig(config = {}, key, fallback, min = 1, max = 20) {
  return Math.round(numberInRange(config[key], fallback, min, max))
}

function splitTableRow(row = '') {
  const byComma = `${row ?? ''}`
    .split(/[,&]/)
    .map((cell) => cell.trim())
    .filter(Boolean)
  if (byComma.length > 1) return byComma

  return `${row ?? ''}`
    .trim()
    .split(/\s+/)
    .map((cell) => cell.trim())
    .filter(Boolean)
}

function tableRowsForConfig(value = '', fallbackRows = []) {
  const rows = splitConfigRows(value).map(splitTableRow).filter((row) => row.length)
  return rows.length ? rows : fallbackRows
}

function edgeLabel(config = {}, index = 0, fallback = '') {
  return explicitLabels(config.edgeLabels)[index] ?? textFor(config.signalLabel, fallback)
}

function edgeNode(label, formatText) {
  return label ? ` node[above, font=\\scriptsize] {${formatText(label)}}` : ''
}

function flowSpacing(config = {}, fallback = 1.45) {
  const configured = Number(config.nodeDistance)
  return Number.isFinite(configured) && configured > 0 ? Math.max(0.85, Math.min(4, configured)) : fallback
}

function buildFlowDiagramSnippet(preset = {}, config = {}, { formatText = (value) => value } = {}) {
  const fallback = explicitLabels(config.nodeLabels)
  const labels = labelsForConfig(config, 'blockLabels', fallback.length ? fallback : ['Input', preset.title ?? 'Process', 'Output'])
  const spacing = flowSpacing(config)
  const lines = labels.map((label, index) => {
    const name = `b${index}`
    const shape = index === 0 && `${preset.id ?? ''}`.includes('decision') ? 'diamond, aspect=2' : 'rectangle, rounded corners=2pt'
    return `\\node[${shape}, draw=__COLOR__, __FILL_STYLE__, align=center, minimum width=1.15cm, minimum height=.58cm] (${name}) at (${formatNumber(
      index * spacing,
    )},0) {${formatText(label)}};`
  })

  labels.slice(1).forEach((_, index) => {
    lines.push(`\\draw[-{Stealth}, draw=__COLOR__, line width=.55pt] (b${index}) --${edgeNode(edgeLabel(config, index), formatText)} (b${index + 1});`)
  })

  if (hasText(config.inputLabel)) {
    lines.push(`\\draw[-{Stealth}, draw=__COLOR__, line width=.55pt] (-.9,0) -- node[above, font=\\scriptsize] {${formatText(config.inputLabel)}} (b0.west);`)
  }
  if (hasText(config.outputLabel)) {
    lines.push(`\\draw[-{Stealth}, draw=__COLOR__, line width=.55pt] (b${labels.length - 1}.east) -- ++(.9,0) node[right, font=\\scriptsize] {${formatText(config.outputLabel)}};`)
  }
  if (hasText(config.noiseLabel)) {
    lines.push(`\\node[font=\\scriptsize] at (${formatNumber(((labels.length - 1) * spacing) / 2)},.66) {${formatText(config.noiseLabel)}};`)
  }

  return lines
}

function buildControlDiagramSnippet(config = {}, { formatText = (value) => value } = {}) {
  const labels = labelsForConfig(config, 'blockLabels', ['Predict', 'Innovation', 'Gain', 'Update'], 4).slice(0, 4)
  const edges = explicitLabels(config.edgeLabels)
  const spacing = flowSpacing(config, 1.5)
  const feedback = textFor(config.outputLabel, textFor(config.feedbackLabel, 'posterior feedback'))

  return [
    `\\node[draw=__COLOR__, __FILL_STYLE__, align=center, font=\\scriptsize, minimum width=1.35cm, minimum height=.68cm] (pred) at (0,0) {${formatText(labels[0])}};`,
    `\\node[circle, draw=__COLOR__, minimum size=.72cm, font=\\scriptsize] (innov) at (${formatNumber(spacing)},0) {${formatText(labels[1])}};`,
    `\\node[draw=__COLOR__, __FILL_STYLE__, align=center, font=\\scriptsize, minimum width=1.2cm] (gain) at (${formatNumber(spacing)},.95) {${formatText(labels[2])}};`,
    `\\node[draw=__COLOR__, __FILL_STYLE__, align=center, font=\\scriptsize, minimum width=1.35cm, minimum height=.68cm] (upd) at (${formatNumber(
      2 * spacing,
    )},0) {${formatText(labels[3])}};`,
    `\\draw[-{Stealth}, draw=__COLOR__, line width=.55pt] (-.9,0) node[left, font=\\scriptsize] {${formatText(textFor(config.inputLabel, 'posterior'))}} -- (pred.west);`,
    `\\draw[-{Stealth}, draw=__COLOR__, line width=.55pt] (pred) --${edgeNode(edges[0] ?? 'prior', formatText)} (innov);`,
    `\\draw[-{Stealth}, draw=__COLOR__, line width=.55pt] (${formatNumber(spacing)},1.32) node[above, font=\\scriptsize] {${formatText(textFor(config.signalLabel, '$y_k$'))}} -- (innov.north);`,
    `\\draw[-{Stealth}, draw=__COLOR__, line width=.55pt] (innov) --${edgeNode(edges[1] ?? 'residual', formatText)} (upd);`,
    `\\draw[-{Stealth}, draw=__COLOR__, line width=.55pt] (innov.north) -- (gain.south);`,
    `\\draw[-{Stealth}, draw=__COLOR__, line width=.55pt] (gain.east) -| node[pos=.25, above, font=\\scriptsize] {${formatText(edges[2] ?? '$K_k$')}} (upd.north);`,
    `\\draw[-{Stealth}, draw=__COLOR__, line width=.55pt] (upd.south) |- ++(-${formatNumber(spacing)},-.62) -| node[pos=.25, below, font=\\scriptsize] {${formatText(feedback)}} (pred.south);`,
  ]
}

function buildNetworkDiagramSnippet(preset = {}, config = {}, { formatText = (value) => value } = {}) {
  const labels = labelsForConfig(config, 'nodeLabels', explicitLabels(config.blockLabels), 3)
  const spacing = flowSpacing(config, 1.35)
  const lines = labels.map((label, index) => {
    const column = index % 2
    const row = Math.floor(index / 2)
    const x = column * spacing
    const y = -row * 0.92 + (column ? -0.26 : 0)
    const shape = `${preset.group ?? ''}` === 'Petri' && index % 2 === 1 ? 'rectangle' : 'circle'
    return `\\node[${shape}, draw=__COLOR__, __FILL_STYLE__, align=center, minimum size=.66cm] (n${index}) at (${formatNumber(x)},${formatNumber(y)}) {${formatText(label)}};`
  })

  if (config.connectNodes !== false) {
    labels.slice(1).forEach((_, index) => {
      lines.push(`\\draw[-{Stealth}, draw=__COLOR__, line width=.5pt] (n${index}) --${edgeNode(edgeLabel(config, index), formatText)} (n${index + 1});`)
    })
  }

  return lines
}

function buildPanelDiagramSnippet(config = {}, { formatText = (value) => value } = {}) {
  const labels = labelsForConfig(config, 'blockLabels', explicitLabels(config.nodeLabels), 3)
  const columns = labels.length <= 3 ? labels.length : 2
  const lines = []

  labels.forEach((label, index) => {
    const column = index % columns
    const row = Math.floor(index / columns)
    const x = column * 1.55
    const y = -row * 1.05
    lines.push(`\\draw[draw=__COLOR__, __FILL_STYLE__, line width=.55pt] (${formatNumber(x)},${formatNumber(y)}) rectangle ++(1.25,-.82);`)
    lines.push(`\\node[anchor=north west, font=\\bfseries\\scriptsize] at (${formatNumber(x + 0.06)},${formatNumber(y - 0.06)}) {Panel ${taskLetter(index)}};`)
    lines.push(`\\node[align=center, font=\\scriptsize, text width=1.05cm] at (${formatNumber(x + 0.625)},${formatNumber(y - 0.47)}) {${formatText(label)}};`)
  })

  return lines
}

function buildSetDiagramSnippet(config = {}, { formatText = (value) => value } = {}) {
  const labels = labelsForConfig(config, 'nodeLabels', explicitLabels(config.blockLabels).length ? explicitLabels(config.blockLabels) : ['$A$', '$B$', '$A\\cap B$'], 3)

  return [
    '\\draw[draw=__COLOR__, fill=__FILL__, fill opacity=.12] (0,0) circle (.78);',
    '\\draw[draw=__COLOR__, fill=__FILL__, fill opacity=.12] (.78,0) circle (.78);',
    `\\node at (-.24,0) {${formatText(labels[0])}};`,
    `\\node at (1.02,0) {${formatText(labels[1])}};`,
    `\\node[font=\\scriptsize] at (.39,-.62) {${formatText(labels[2])}};`,
  ]
}

function buildCommutativeDiagramSnippet(config = {}, { formatText = (value) => value } = {}) {
  const labels = labelsForConfig(config, 'nodeLabels', ['$A$', '$B$', '$C$', '$D$'], 4).slice(0, 4)
  const edges = explicitLabels(config.edgeLabels)
  const x = flowSpacing(config, 1.55)
  const y = Math.max(0.85, Number(config.layerDistance) || 1.05)

  return [
    `\\node (n0) at (0,0) {${formatText(labels[0])}};`,
    `\\node (n1) at (${formatNumber(x)},0) {${formatText(labels[1])}};`,
    `\\node (n2) at (0,-${formatNumber(y)}) {${formatText(labels[2])}};`,
    `\\node (n3) at (${formatNumber(x)},-${formatNumber(y)}) {${formatText(labels[3])}};`,
    `\\draw[-{Stealth}, draw=__COLOR__, line width=.55pt] (n0) --${edgeNode(edges[0] ?? '$f$', formatText)} (n1);`,
    `\\draw[-{Stealth}, draw=__COLOR__, line width=.55pt] (n0) -- node[left, font=\\scriptsize] {${formatText(edges[1] ?? '$g$')}} (n2);`,
    `\\draw[-{Stealth}, draw=__COLOR__, line width=.55pt] (n1) -- node[right, font=\\scriptsize] {${formatText(edges[2] ?? '$h$')}} (n3);`,
    `\\draw[-{Stealth}, draw=__COLOR__, line width=.55pt] (n2) -- node[below, font=\\scriptsize] {${formatText(edges[3] ?? '$k$')}} (n3);`,
  ]
}

function buildSequenceDiagramSnippet(config = {}, { formatText = (value) => value } = {}) {
  const actors = labelsForConfig(config, 'nodeLabels', explicitLabels(config.blockLabels).length ? explicitLabels(config.blockLabels) : ['Client', 'Server'], 2).slice(0, 4)
  const messages = explicitLabels(config.edgeLabels)
  const spacing = flowSpacing(config, 1.85)
  const lines = actors.map(
    (actor, index) => `\\node (a${index}) at (${formatNumber(index * spacing)},0) {${formatText(actor)}};`,
  )

  actors.forEach((_, index) => {
    lines.push(`\\draw[draw=__COLOR__!45] (a${index}) -- ++(0,-${formatNumber(1.4 + messages.length * 0.42)});`)
  })
  ;(messages.length ? messages : ['request', 'reply']).forEach((message, index) => {
    const from = index % 2 === 0 ? 0 : Math.min(actors.length - 1, 1)
    const to = index % 2 === 0 ? Math.min(actors.length - 1, 1) : 0
    const y = -0.5 - index * 0.48
    const arrow = index % 2 === 0 ? '-{Stealth}' : '{Stealth}-'
    lines.push(`\\draw[${arrow}, draw=__COLOR__, line width=.5pt] (${formatNumber(from * spacing)},${formatNumber(y)}) -- node[above, font=\\scriptsize] {${formatText(message)}} (${formatNumber(to * spacing)},${formatNumber(y)});`)
  })

  return lines
}

function buildUsecaseDiagramSnippet(config = {}, { formatText = (value) => value } = {}) {
  const cases = labelsForConfig(config, 'blockLabels', explicitLabels(config.nodeLabels).length ? explicitLabels(config.nodeLabels) : ['Use case'], 1)
  const actor = textFor(config.inputLabel, 'Actor')

  return [
    `\\node[font=\\scriptsize] at (0,.82) {${formatText(actor)}};`,
    '\\node[circle, draw=__COLOR__, minimum size=.32cm] (head) at (0,.45) {};',
    '\\draw[draw=__COLOR__, line width=.5pt] (0,.28) -- (0,-.45) (-.38,0) -- (.38,0) (-.3,-.92) -- (0,-.45) -- (.3,-.92);',
    ...cases.map((label, index) => `\\node[ellipse, draw=__COLOR__, __FILL_STYLE__, align=center, minimum width=1.55cm] (u${index}) at (${formatNumber(1.9)},${formatNumber(.2 - index * .72)}) {${formatText(label)}};`),
    ...cases.map((_, index) => `\\draw[draw=__COLOR__!65, line width=.45pt] (.45,${formatNumber(-.1 - Math.min(index, 1) * .32)}) -- (u${index}.west);`),
  ]
}

function buildEntityDiagramSnippet(config = {}, { formatText = (value) => value } = {}) {
  const entries = splitConfigRows(config.matrixEntries)
  const labels = labelsForConfig(config, 'blockLabels', explicitLabels(config.nodeLabels).length ? explicitLabels(config.nodeLabels) : ['Entity', 'relation', 'Entity'], 3).slice(0, 3)
  const attributes = entries.length ? entries : labels

  return [
    `\\node[draw=__COLOR__, __FILL_STYLE__, align=center, minimum width=1.25cm, minimum height=.55cm] (e0) at (0,0) {${formatText(attributes[0])}};`,
    `\\node[diamond, draw=__COLOR__, aspect=2, align=center, inner sep=1pt] (r) at (1.55,0) {${formatText(attributes[1] ?? 'relates')}};`,
    `\\node[draw=__COLOR__, __FILL_STYLE__, align=center, minimum width=1.25cm, minimum height=.55cm] (e1) at (3.1,0) {${formatText(attributes[2] ?? 'Entity')}};`,
    '\\draw[draw=__COLOR__, line width=.5pt] (e0) -- (r) -- (e1);',
  ]
}

function buildConfusionMatrixSnippet(config = {}, { formatText = (value) => value } = {}) {
  const classes = labelsForConfig(config, 'classLabels', explicitLabels(config.blockLabels).length ? explicitLabels(config.blockLabels) : ['negative', 'positive'], 2).slice(0, 4)
  const entries = tableRowsForConfig(config.matrixEntries, [
    ['42', '3'],
    ['5', '50'],
  ])
  const rows = classes.map((className, rowIndex) => {
    const row = entries[rowIndex] ?? []
    const cells = classes.map((_, columnIndex) => row[columnIndex] ?? '0')
    return `  ${formatText(className)} & ${cells.map(formatText).join(' & ')} \\\\`
  })

  return [
    '\\node[font=\\scriptsize] at (1.05,.72) {Predicted};',
    '\\node[font=\\scriptsize, rotate=90] at (-.72,-.72) {Actual};',
    '\\matrix[matrix of nodes, draw=__COLOR__, line width=.55pt, row sep=.05cm, column sep=.18cm, nodes={minimum width=.72cm, minimum height=.42cm, align=center}] (cm) at (0,0) {',
    `   & ${classes.map((className) => formatText(className)).join(' & ')} \\\\`,
    ...rows,
    '};',
  ]
}

function buildResourceGridSnippet(preset = {}, config = {}, { formatText = (value) => value } = {}) {
  const isNrFrame = `${preset.id ?? ''}` === 'telecom-5g-nr-frame'
  const columns = countFromConfig(config, 'symbolCount', isNrFrame ? 14 : 6, 1, 28)
  const rows = countFromConfig(config, 'subcarrierCount', isNrFrame ? 5 : 4, 1, 24)
  const pilotSpacing = countFromConfig(config, 'pilotSpacing', isNrFrame ? 3 : 2, 1, 16)
  const labels = labelsForConfig(config, 'blockLabels', isNrFrame ? ['PDCCH', 'PDSCH', 'DM-RS'] : ['pilot', 'data', 'guard'], 3)
  const cellWidth = 0.38
  const cellHeight = 0.32
  const width = columns * cellWidth
  const height = rows * cellHeight
  const pilotCells = []

  for (let column = 0; column < columns; column += 1) {
    for (let row = 0; row < rows; row += 1) {
      if ((column + row) % pilotSpacing === 0) pilotCells.push({ column, row })
    }
  }

  const highlightedCells = pilotCells.slice(0, Math.min(18, pilotCells.length)).map(({ column, row }) => {
    const x = column * cellWidth
    const y = row * cellHeight
    return `\\filldraw[fill=__COLOR__!16, draw=__COLOR__, line width=.35pt] (${formatNumber(x)},${formatNumber(y)}) rectangle ++(${formatNumber(cellWidth)},${formatNumber(cellHeight)});`
  })

  if (isNrFrame && columns >= 4 && rows >= 2) {
    highlightedCells.unshift(
      `\\filldraw[fill=__COLOR__!10, draw=__COLOR__, line width=.35pt] (${formatNumber(cellWidth)},${formatNumber(
        height - 2 * cellHeight,
      )}) rectangle (${formatNumber(Math.min(width, 4 * cellWidth))},${formatNumber(height)}) node[midway, font=\\scriptsize] {${formatText(labels[0])}};`,
    )
  }

  return [
    `\\draw[step=${formatNumber(cellWidth)}cm, draw=__COLOR__!35, line width=.35pt] (0,0) grid (${formatNumber(width)},${formatNumber(height)});`,
    ...highlightedCells,
    `\\node[font=\\scriptsize, text=__COLOR__] at (${formatNumber(width / 2)},${formatNumber(height + 0.32)}) {${formatText(isNrFrame ? '5G NR frame grid' : 'OFDM resource grid')}};`,
    `\\node[font=\\scriptsize, text=__COLOR__!75] at (${formatNumber(cellWidth * 0.7)},${formatNumber(height + 0.04)}) {${formatText(labels[0])}};`,
    `\\node[font=\\scriptsize, text=__COLOR__!75] at (${formatNumber(width - cellWidth * 1.2)},${formatNumber(cellHeight * 0.45)}) {${formatText(labels[1])}};`,
    `\\draw[-{Stealth}, draw=__COLOR__, line width=.45pt] (${formatNumber(width + 0.18)},${formatNumber(cellHeight / 2)}) -- ++(.55,0) node[right, font=\\scriptsize] {${formatText(textFor(config.outputLabel, 'symbol'))}};`,
    `\\draw[-{Stealth}, draw=__COLOR__, line width=.45pt] (${formatNumber(cellWidth / 2)},${formatNumber(height + 0.16)}) -- ++(0,.52) node[above, font=\\scriptsize] {${formatText(textFor(config.inputLabel, 'subcarrier'))}};`,
  ]
}

function tannerEdgesForConfig(config = {}, variableCount = 4, checkCount = 2) {
  const explicitEdges = explicitLabels(config.edgeLabels)
    .map((edge) => edge.match(/v?\s*(\d+)\s*[-:]\s*c?\s*(\d+)/i))
    .filter(Boolean)
    .map((match) => ({ variable: Number(match[1]), check: Number(match[2]) }))
    .filter(({ variable, check }) => variable >= 1 && variable <= variableCount && check >= 1 && check <= checkCount)
  if (explicitEdges.length) return explicitEdges

  return Array.from({ length: variableCount }, (_, index) => [
    { variable: index + 1, check: (index % checkCount) + 1 },
    { variable: index + 1, check: ((index + 1) % checkCount) + 1 },
  ]).flat()
}

function buildTannerGraphSnippet(config = {}, { formatText = (value) => value } = {}) {
  const variableCount = countFromConfig(config, 'variableCount', countFromConfig(config, 'branchCount', 4, 1, 12), 1, 16)
  const checkCount = countFromConfig(config, 'checkCount', countFromConfig(config, 'barCount', 2, 1, 8), 1, 12)
  const variables = labelsForConfig(config, 'nodeLabels', [], variableCount)
  const checks = labelsForConfig(config, 'blockLabels', [], checkCount)
  const variableStep = Math.min(0.56, 2.2 / Math.max(1, variableCount - 1))
  const checkStep = Math.min(0.72, 1.8 / Math.max(1, checkCount - 1))
  const lines = []

  for (let index = 0; index < variableCount; index += 1) {
    const y = ((variableCount - 1) / 2 - index) * variableStep
    lines.push(`\\node[circle, draw=__COLOR__, __FILL_STYLE__, minimum size=.42cm] (v${index + 1}) at (0,${formatNumber(y)}) {${formatText(variables[index] ?? `$v_${index + 1}$`)}};`)
  }
  for (let index = 0; index < checkCount; index += 1) {
    const y = ((checkCount - 1) / 2 - index) * checkStep
    lines.push(`\\node[rectangle, draw=__COLOR__, __FILL_STYLE__, minimum width=.52cm, minimum height=.38cm] (c${index + 1}) at (2.2,${formatNumber(y)}) {${formatText(checks[index] ?? `$c_${index + 1}$`)}};`)
  }
  tannerEdgesForConfig(config, variableCount, checkCount).forEach(({ variable, check }) => {
    lines.push(`\\draw[draw=__COLOR__!70, line width=.45pt] (v${variable}) -- (c${check});`)
  })
  lines.push('\\node[font=\\scriptsize, text=__COLOR__!75] at (0,-1.45) {variable bits};')
  lines.push('\\node[font=\\scriptsize, text=__COLOR__!75] at (2.2,-1.45) {check equations};')

  return lines
}

function buildMimoOfdmSnippet(config = {}, { formatText = (value) => value } = {}) {
  const antennaCount = countFromConfig(config, 'antennaCount', countFromConfig(config, 'branchCount', 3, 1, 12), 1, 12)
  const labels = labelsForConfig(config, 'blockLabels', ['layers', 'precoder', 'OFDM TX', 'channel', 'equalizer'], 5)
  const stackStep = Math.min(0.58, 2.2 / Math.max(1, antennaCount - 1))
  const channelLabel = textFor(config.channelLabel, '$\\mathbf{H}[k]$')
  const lines = [
    `\\node[draw=__COLOR__, __FILL_STYLE__, align=center, minimum width=1cm] (layers) at (0,0) {${formatText(textFor(config.inputLabel, labels[0]))}};`,
    `\\node[draw=__COLOR__, __FILL_STYLE__, align=center, minimum width=1.05cm] (prec) at (1.45,0) {${formatText(labels[1])}\\\\$\\mathbf{W}$};`,
  ]

  for (let index = 0; index < antennaCount; index += 1) {
    const y = ((antennaCount - 1) / 2 - index) * stackStep
    lines.push(`\\node[draw=__COLOR__, __FILL_STYLE__, align=center, font=\\scriptsize, minimum width=1.15cm] (tx${index + 1}) at (3.0,${formatNumber(y)}) {${formatText(labels[2])}\\\\TX ${index + 1}};`)
    lines.push(`\\draw[-{Stealth}, draw=__COLOR__, line width=.45pt] (prec.east) -- (tx${index + 1}.west);`)
  }
  lines.push(`\\node[draw=__COLOR__, __FILL_STYLE__, align=center, minimum width=1cm, minimum height=${formatNumber(Math.max(1.1, antennaCount * stackStep))}cm] (chan) at (4.55,0) {${formatText(channelLabel)}};`)
  lines.push(`\\node[draw=__COLOR__, __FILL_STYLE__, align=center, minimum width=1.15cm] (rx) at (6.05,0) {${formatText(labels[4])}};`)
  for (let index = 0; index < antennaCount; index += 1) {
    lines.push(`\\draw[-{Stealth}, draw=__COLOR__, line width=.45pt] (tx${index + 1}.east) -- (chan.west);`)
  }
  lines.push('\\draw[-{Stealth}, draw=__COLOR__, line width=.55pt] (layers) -- (prec);')
  lines.push(`\\draw[-{Stealth}, draw=__COLOR__, line width=.55pt] (chan) -- (rx) -- ++(.85,0) node[right, font=\\scriptsize] {${formatText(textFor(config.outputLabel, '$\\hat{s}_\\ell$'))}};`)

  return lines
}

function buildLinkBudgetSnippet(config = {}, { formatText = (value) => value } = {}) {
  const rows = tableRowsForConfig(config.budgetRows || config.matrixEntries, [
    ['Tx power', '20 dBm'],
    ['Antenna gain', '12 dBi'],
    ['Path loss', '-102 dB'],
    ['Rx power', '-70 dBm'],
  ])

  return [
    '\\node[font=\\scriptsize, text=__COLOR__] at (1.05,.45) {Link budget};',
    '\\matrix[matrix of nodes, draw=__COLOR__, line width=.55pt, row sep=.08cm, column sep=.35cm, nodes={anchor=west, minimum height=.35cm}] (lb) at (0,0) {',
    ...rows.map((row) => `  ${formatText(row[0] ?? '')} & ${formatText(row.slice(1).join(' ') || '')} \\\\`),
    '};',
  ]
}

function ofdmChainDefaults(preset = {}) {
  const id = `${preset.id ?? ''}`.toLowerCase()
  if (id.includes('receiver')) {
    return {
      title: 'OFDM RX',
      labels: ['RF/ADC', 'CP remove', 'FFT', 'Equalizer', 'Demapper'],
      input: '$r(t)$',
      output: '$\\hat{b}_k$',
    }
  }
  if (id.includes('pilot-estimator')) {
    return {
      title: 'OFDM pilot estimator',
      labels: ['Pilot tones', 'FFT bins', 'LS/MMSE', 'Interpolator'],
      input: '$Y_p$',
      output: '$\\hat{H}[k]$',
    }
  }
  if (id.includes('transceiver')) {
    return {
      title: 'OFDM transceiver',
      labels: ['Mapper', 'IFFT + CP', 'Channel', 'FFT + EQ', 'Demapper'],
      input: '$b_k$',
      output: '$\\hat{b}_k$',
    }
  }
  return {
    title: 'OFDM TX',
    labels: ['Bits', 'QAM mapper', 'S/P', 'IFFT', 'CP + DAC'],
    input: '$b_k$',
    output: '$s(t)$',
  }
}

function buildOfdmChainSnippet(preset = {}, config = {}, { formatText = (value) => value } = {}) {
  const defaults = ofdmChainDefaults(preset)
  const labels = fixedLabelsForConfig(config, 'blockLabels', defaults.labels, defaults.labels.length)
  const spacing = flowSpacing(config, 1.25)
  const subcarriers = countFromConfig(config, 'subcarrierCount', 4, 1, 16)
  const symbolCount = countFromConfig(config, 'symbolCount', 6, 1, 28)
  const pilotSpacing = countFromConfig(config, 'pilotSpacing', 3, 1, 16)
  const lines = [
    `\\node[font=\\scriptsize, text=__COLOR__] at (${formatNumber(((labels.length - 1) * spacing) / 2)},.88) {${formatText(defaults.title)}};`,
  ]

  labels.forEach((label, index) => {
    lines.push(`\\node[draw=__COLOR__, __FILL_STYLE__, rounded corners=2pt, align=center, minimum width=1.02cm, minimum height=.58cm] (ofdm${index}) at (${formatNumber(index * spacing)},0) {${formatText(label)}};`)
  })
  labels.slice(1).forEach((_, index) => {
    const edgeText = index === 1 ? textFor(config.signalLabel, '$X_k$') : ''
    lines.push(`\\draw[-{Stealth}, draw=__COLOR__, line width=.5pt] (ofdm${index}) --${edgeNode(edgeText, formatText)} (ofdm${index + 1});`)
  })

  const laneCount = Math.min(6, subcarriers)
  for (let index = 0; index < laneCount; index += 1) {
    const y = -0.48 - index * 0.16
    lines.push(`\\draw[draw=__COLOR__!55, line width=.32pt] (${formatNumber(spacing * 1.55)},${formatNumber(y)}) -- (${formatNumber(spacing * 3.2)},${formatNumber(y)});`)
    if (index % Math.max(1, pilotSpacing) === 0) {
      lines.push(`\\fill[__COLOR__!45] (${formatNumber(spacing * 2.38)},${formatNumber(y)}) circle (.035);`)
    }
  }
  lines.push(`\\node[font=\\scriptsize, text=__COLOR__!75] at (${formatNumber(spacing * 2.38)},${formatNumber(-0.62 - laneCount * 0.16)}) {Subcarriers x${subcarriers}};`)
  lines.push(`\\node[font=\\scriptsize, text=__COLOR__!75] at (${formatNumber(spacing * 3.85)},-.62) {$N_{sym}=${symbolCount}$};`)
  if (hasText(config.modulation)) {
    lines.push(`\\node[font=\\scriptsize, text=__COLOR__!75] at (${formatNumber(spacing)},-.62) {${formatText(config.modulation)}};`)
  }
  if (hasText(config.carrierLabel)) {
    lines.push(`\\draw[-{Stealth}, draw=__COLOR__, line width=.45pt] (${formatNumber((labels.length - 1) * spacing)},-.9) node[below, font=\\scriptsize] {${formatText(config.carrierLabel)}} -- (ofdm${labels.length - 1}.south);`)
  }
  if (hasText(config.noiseLabel)) {
    const channelIndex = Math.max(1, Math.floor(labels.length / 2))
    lines.push(`\\draw[-{Stealth}, draw=__COLOR__!70, line width=.45pt] (${formatNumber(channelIndex * spacing)},.62) node[above, font=\\scriptsize] {${formatText(config.noiseLabel)}} -- (ofdm${channelIndex}.north);`)
  }
  lines.push(`\\draw[-{Stealth}, draw=__COLOR__, line width=.55pt] (-.82,0) node[left, font=\\scriptsize] {${formatText(textFor(config.inputLabel, defaults.input))}} -- (ofdm0.west);`)
  lines.push(`\\draw[-{Stealth}, draw=__COLOR__, line width=.55pt] (ofdm${labels.length - 1}.east) -- ++(.82,0) node[right, font=\\scriptsize] {${formatText(textFor(config.outputLabel, defaults.output))}};`)

  return lines
}

function buildFecChainSnippet(config = {}, { formatText = (value) => value } = {}) {
  const labels = fixedLabelsForConfig(
    config,
    'blockLabels',
    ['CRC', 'LDPC encoder', 'Interleaver', 'QAM mapper', 'Channel', 'Demapper', 'LDPC decoder'],
    6,
  )
  const spacing = flowSpacing(config, 1.18)
  const lines = [
    `\\node[font=\\scriptsize, text=__COLOR__] at (${formatNumber(((labels.length - 1) * spacing) / 2)},.86) {FEC chain};`,
  ]

  labels.forEach((label, index) => {
    const shape = /channel/i.test(label) ? 'rounded corners=6pt' : 'rounded corners=2pt'
    lines.push(`\\node[draw=__COLOR__, __FILL_STYLE__, ${shape}, align=center, font=\\scriptsize, minimum width=1.02cm, minimum height=.55cm] (fec${index}) at (${formatNumber(index * spacing)},0) {${formatText(label)}};`)
  })
  labels.slice(1).forEach((_, index) => {
    lines.push(`\\draw[-{Stealth}, draw=__COLOR__, line width=.48pt] (fec${index}) -- (fec${index + 1});`)
  })
  if (hasText(config.modulation)) {
    lines.push(`\\node[font=\\scriptsize, text=__COLOR__!75] at (${formatNumber(spacing * 2.5)},-.62) {${formatText(config.modulation)}};`)
  }
  if (hasText(config.signalLabel)) {
    lines.push(`\\node[font=\\scriptsize, text=__COLOR__!75] at (${formatNumber(spacing * 1.5)},.54) {${formatText(config.signalLabel)}};`)
  }
  if (hasText(config.noiseLabel)) {
    const channelIndex = labels.findIndex((label) => /channel/i.test(label))
    const target = channelIndex >= 0 ? channelIndex : Math.floor(labels.length / 2)
    lines.push(`\\draw[-{Stealth}, draw=__COLOR__!70, line width=.45pt] (${formatNumber(target * spacing)},.64) node[above, font=\\scriptsize] {${formatText(config.noiseLabel)}} -- (fec${target}.north);`)
  }
  lines.push(`\\draw[-{Stealth}, draw=__COLOR__, line width=.55pt] (-.78,0) node[left, font=\\scriptsize] {${formatText(textFor(config.inputLabel, 'bits'))}} -- (fec0.west);`)
  lines.push(`\\draw[-{Stealth}, draw=__COLOR__, line width=.55pt] (fec${labels.length - 1}.east) -- ++(.78,0) node[right, font=\\scriptsize] {${formatText(textFor(config.outputLabel, 'decoded bits'))}};`)

  return lines
}

function buildAwgnChannelSnippet(config = {}, { formatText = (value) => value } = {}) {
  const snrText = textFor(config.snrLabel, '')
  const gain = Number(config.gainDb)
  const gainText = Number.isFinite(gain) && gain !== 0 ? `${formatNumber(gain)} dB` : ''
  const lines = [
    `\\node[draw=__COLOR__, __FILL_STYLE__, rounded corners=2pt, align=center, minimum width=1.25cm, minimum height=.62cm] (chan) at (1.35,0) {${formatText(textFor(config.channelLabel, '$h(t)$'))}};`,
    '\\node[circle, draw=__COLOR__, minimum size=.42cm, inner sep=0pt] (sum) at (2.9,0) {$+$};',
    `\\node[font=\\scriptsize, text=__COLOR__] at (1.35,.82) {AWGN channel};`,
    `\\draw[-{Stealth}, draw=__COLOR__, line width=.55pt] (-.65,0) node[left, font=\\scriptsize] {${formatText(textFor(config.inputLabel, '$x(t)$'))}} -- (chan.west);`,
    '\\draw[-{Stealth}, draw=__COLOR__, line width=.55pt] (chan.east) -- (sum.west);',
    `\\draw[-{Stealth}, draw=__COLOR__, line width=.55pt] (sum.east) -- ++(.8,0) node[right, font=\\scriptsize] {${formatText(textFor(config.outputLabel, '$y(t)$'))}};`,
    `\\draw[-{Stealth}, draw=__COLOR__!70, line width=.45pt] (2.9,.78) node[above, font=\\scriptsize] {${formatText(textFor(config.noiseLabel, '$n(t)$'))}} -- (sum.north);`,
  ]
  if (snrText) lines.push(`\\node[font=\\scriptsize, text=__COLOR__!75] at (2.9,-.58) {${formatText(snrText)}};`)
  if (gainText) lines.push(`\\node[font=\\scriptsize, text=__COLOR__!75] at (1.35,-.58) {${formatText(gainText)}};`)
  if (hasText(config.modulation)) lines.push(`\\node[font=\\scriptsize, text=__COLOR__!75] at (.15,-.58) {${formatText(config.modulation)}};`)

  return lines
}

function feedbackLoopDefaults(preset = {}) {
  const id = `${preset.id ?? ''}`.toLowerCase()
  if (id.includes('pll')) return { title: 'PLL loop', labels: ['Phase detector', 'Loop filter', 'VCO/NCO', 'Divider'], output: '$\\hat{\\phi}$' }
  if (id.includes('adaptive-equalizer')) {
    return { title: 'Adaptive equalizer loop', labels: ['Equalizer', 'Error', 'LMS update', 'Coefficients'], output: '$\\hat{x}[n]$' }
  }
  if (id.includes('feedback-loop')) return { title: 'Feedback loop', labels: ['Forward path', 'Plant', 'Sensor', 'Feedback filter'], output: '$y$' }
  return { title: 'Synchronization loop', labels: ['Timing error', 'Loop filter', 'NCO', 'Resampler'], output: 'aligned samples' }
}

function buildFeedbackLoopSnippet(preset = {}, config = {}, { formatText = (value) => value } = {}) {
  const defaults = feedbackLoopDefaults(preset)
  const labels = fixedLabelsForConfig(config, 'blockLabels', defaults.labels, 4).slice(0, 4)
  const spacing = flowSpacing(config, 1.35)
  const edges = explicitLabels(config.edgeLabels)
  const lines = [
    `\\node[circle, draw=__COLOR__, minimum size=.5cm] (sum) at (0,0) {$+$};`,
    `\\node[draw=__COLOR__, __FILL_STYLE__, rounded corners=2pt, align=center, minimum width=1.05cm] (det) at (${formatNumber(spacing)},0) {${formatText(labels[0])}};`,
    `\\node[draw=__COLOR__, __FILL_STYLE__, rounded corners=2pt, align=center, minimum width=1.05cm] (filter) at (${formatNumber(2 * spacing)},0) {${formatText(labels[1])}};`,
    `\\node[draw=__COLOR__, __FILL_STYLE__, rounded corners=2pt, align=center, minimum width=1.05cm] (nco) at (${formatNumber(3 * spacing)},0) {${formatText(labels[2])}};`,
    `\\node[draw=__COLOR__, __FILL_STYLE__, rounded corners=2pt, align=center, font=\\scriptsize, minimum width=1.05cm] (fb) at (${formatNumber(2 * spacing)},-1.02) {${formatText(labels[3])}};`,
    `\\node[font=\\scriptsize, text=__COLOR__] at (${formatNumber(1.55 * spacing)},.82) {${formatText(defaults.title)}};`,
    `\\draw[-{Stealth}, draw=__COLOR__, line width=.55pt] (-.78,0) node[left, font=\\scriptsize] {${formatText(textFor(config.inputLabel, 'reference'))}} -- (sum.west);`,
    `\\draw[-{Stealth}, draw=__COLOR__, line width=.55pt] (sum) --${edgeNode(edges[0] ?? 'error', formatText)} (det);`,
    `\\draw[-{Stealth}, draw=__COLOR__, line width=.55pt] (det) --${edgeNode(edges[1] ?? '', formatText)} (filter);`,
    `\\draw[-{Stealth}, draw=__COLOR__, line width=.55pt] (filter) --${edgeNode(edges[2] ?? textFor(config.carrierLabel, ''), formatText)} (nco);`,
    `\\draw[-{Stealth}, draw=__COLOR__, line width=.55pt] (nco.east) -- ++(.8,0) node[right, font=\\scriptsize] {${formatText(textFor(config.outputLabel, defaults.output))}};`,
    `\\draw[-{Stealth}, draw=__COLOR__, line width=.5pt] (nco.south) |- (fb.east);`,
    `\\draw[-{Stealth}, draw=__COLOR__, line width=.5pt] (fb.west) -| node[pos=.22, below, font=\\scriptsize] {${formatText(textFor(config.feedbackLabel, 'feedback'))}} (sum.south);`,
  ]
  if (hasText(config.signalLabel)) {
    lines.push(`\\node[font=\\scriptsize, text=__COLOR__!75] at (${formatNumber(spacing)},-.62) {${formatText(config.signalLabel)}};`)
  }

  return lines
}

function buildMimoLinkSnippet(config = {}, { formatText = (value) => value } = {}) {
  const antennaCount = countFromConfig(config, 'antennaCount', countFromConfig(config, 'branchCount', 3, 1, 12), 1, 12)
  const labels = fixedLabelsForConfig(config, 'blockLabels', ['TX array', 'RX array'], 2)
  const stackStep = Math.min(0.58, 2.2 / Math.max(1, antennaCount - 1))
  const channelLabel = textFor(config.channelLabel, '$\\mathbf{H}$')
  const lines = [
    `\\node[font=\\scriptsize, text=__COLOR__] at (1.95,1.05) {MIMO link};`,
    `\\node[draw=__COLOR__, __FILL_STYLE__, rounded corners=2pt, align=center, minimum width=1.05cm] (src) at (-1.1,0) {${formatText(textFor(config.inputLabel, '$\\mathbf{x}$'))}};`,
    `\\node[draw=__COLOR__, __FILL_STYLE__, rounded corners=2pt, align=center, minimum width=.95cm, minimum height=${formatNumber(Math.max(1, antennaCount * stackStep))}cm] (chan) at (1.95,0) {${formatText(channelLabel)}};`,
    `\\node[draw=__COLOR__, __FILL_STYLE__, rounded corners=2pt, align=center, minimum width=1.05cm] (dst) at (4.9,0) {${formatText(textFor(config.outputLabel, '$\\hat{\\mathbf{x}}$'))}};`,
  ]
  for (let index = 0; index < antennaCount; index += 1) {
    const y = ((antennaCount - 1) / 2 - index) * stackStep
    lines.push(`\\node[circle, draw=__COLOR__, __FILL_STYLE__, minimum size=.42cm, font=\\scriptsize] (tx${index + 1}) at (0,${formatNumber(y)}) {TX ${index + 1}};`)
    lines.push(`\\node[circle, draw=__COLOR__, __FILL_STYLE__, minimum size=.42cm, font=\\scriptsize] (rx${index + 1}) at (3.9,${formatNumber(y)}) {RX ${index + 1}};`)
    lines.push(`\\draw[-{Stealth}, draw=__COLOR__, line width=.42pt] (src.east) -- (tx${index + 1}.west);`)
    lines.push(`\\draw[-{Stealth}, draw=__COLOR__, line width=.42pt] (tx${index + 1}.east) -- (chan.west);`)
    lines.push(`\\draw[-{Stealth}, draw=__COLOR__, line width=.42pt] (chan.east) -- (rx${index + 1}.west);`)
    lines.push(`\\draw[-{Stealth}, draw=__COLOR__, line width=.42pt] (rx${index + 1}.east) -- (dst.west);`)
  }
  lines.push(`\\node[font=\\scriptsize, text=__COLOR__!75] at (0,${formatNumber(-1.04 - antennaCount * 0.04)}) {${formatText(labels[0])}};`)
  lines.push(`\\node[font=\\scriptsize, text=__COLOR__!75] at (3.9,${formatNumber(-1.04 - antennaCount * 0.04)}) {${formatText(labels[1])}};`)
  if (hasText(config.modulation)) lines.push(`\\node[font=\\scriptsize, text=__COLOR__!75] at (1.95,-1.25) {${formatText(config.modulation)}};`)
  if (hasText(config.noiseLabel)) lines.push(`\\node[font=\\scriptsize, text=__COLOR__!75] at (1.95,.72) {${formatText(config.noiseLabel)}};`)

  return lines
}

function buildRfChainSnippet(preset = {}, config = {}, { formatText = (value) => value } = {}) {
  const labels = fixedLabelsForConfig(config, 'blockLabels', ['Antenna', 'LNA', 'BPF', 'Mixer', 'IF filter'], 4)
  const terminals = explicitLabels(config.terminalNames)
  const spacing = flowSpacing(config, 1.18)
  const title = `${preset.id ?? ''}` === 'telecom-superhet' ? 'Superhet receiver' : 'RF front-end'
  const gain = Number(config.gainDb)
  const lines = [
    `\\node[font=\\scriptsize, text=__COLOR__] at (${formatNumber(((labels.length - 1) * spacing) / 2)},.86) {${formatText(title)}};`,
  ]

  labels.forEach((label, index) => {
    lines.push(`\\node[rectangle, rounded corners=2pt, draw=__COLOR__, __FILL_STYLE__, align=center, font=\\scriptsize, minimum width=.92cm, minimum height=.52cm] (rf${index}) at (${formatNumber(index * spacing)},0) {${formatText(label)}};`)
  })
  labels.slice(1).forEach((_, index) => {
    lines.push(`\\draw[-{Stealth}, draw=__COLOR__, line width=.48pt] (rf${index}) -- (rf${index + 1});`)
  })
  const mixerIndex = labels.findIndex((label) => /mixer|mix/i.test(label))
  if (mixerIndex >= 0 && hasText(config.carrierLabel)) {
    lines.push(`\\draw[-{Stealth}, draw=__COLOR__, line width=.45pt] (${formatNumber(mixerIndex * spacing)},-.82) node[below, font=\\scriptsize] {${formatText(config.carrierLabel)}} -- (rf${mixerIndex}.south);`)
  } else if (hasText(config.carrierLabel)) {
    lines.push(`\\node[font=\\scriptsize, text=__COLOR__!75] at (${formatNumber(spacing)},-.62) {${formatText(config.carrierLabel)}};`)
  }
  if (Number.isFinite(gain) && gain !== 0) {
    lines.push(`\\node[font=\\scriptsize, text=__COLOR__!75] at (${formatNumber(spacing * 1.5)},-.62) {${formatNumber(gain)} dB};`)
  }
  if (hasText(config.noiseLabel)) {
    lines.push(`\\node[font=\\scriptsize, text=__COLOR__!75] at (${formatNumber(spacing * 2.5)},.58) {${formatText(config.noiseLabel)}};`)
  }
  lines.push(`\\draw[-{Stealth}, draw=__COLOR__, line width=.55pt] (-.78,0) node[left, font=\\scriptsize] {${formatText(textFor(config.inputLabel, terminals[0] ?? 'RF in'))}} -- (rf0.west);`)
  lines.push(`\\draw[-{Stealth}, draw=__COLOR__, line width=.55pt] (rf${labels.length - 1}.east) -- ++(.78,0) node[right, font=\\scriptsize] {${formatText(textFor(config.outputLabel, terminals[1] ?? 'IF out'))}};`)

  return lines
}

export function buildModularDiagramSnippet(preset = {}, config = {}, options = {}) {
  switch (modularDiagramKindForPreset(preset)) {
    case 'confusion':
      return buildConfusionMatrixSnippet(config, options)
    case 'resource-grid':
      return buildResourceGridSnippet(preset, config, options)
    case 'link-budget':
      return buildLinkBudgetSnippet(config, options)
    case 'tanner':
      return buildTannerGraphSnippet(config, options)
    case 'mimo-ofdm':
      return buildMimoOfdmSnippet(config, options)
    case 'ofdm-chain':
      return buildOfdmChainSnippet(preset, config, options)
    case 'fec-chain':
      return buildFecChainSnippet(config, options)
    case 'awgn-channel':
      return buildAwgnChannelSnippet(config, options)
    case 'feedback-loop':
      return buildFeedbackLoopSnippet(preset, config, options)
    case 'mimo-link':
      return buildMimoLinkSnippet(config, options)
    case 'rf-chain':
      return buildRfChainSnippet(preset, config, options)
    case 'control':
      return buildControlDiagramSnippet(config, options)
    case 'network':
      return buildNetworkDiagramSnippet(preset, config, options)
    case 'panel':
      return buildPanelDiagramSnippet(config, options)
    case 'set':
      return buildSetDiagramSnippet(config, options)
    case 'commutative':
      return buildCommutativeDiagramSnippet(config, options)
    case 'sequence':
      return buildSequenceDiagramSnippet(config, options)
    case 'usecase':
      return buildUsecaseDiagramSnippet(config, options)
    case 'entity':
      return buildEntityDiagramSnippet(config, options)
    case 'flow':
      return buildFlowDiagramSnippet(preset, config, options)
    default:
      return null
  }
}

export function formatMatrixEntryRows(value = '') {
  return `${value ?? ''}`
    .split(/\n/)
    .flatMap((line) => line.split(/\\\\/))
    .map((line) => line.trim())
    .filter(Boolean)
}

export function normalizeGanttRange(startValue, endValue) {
  const startNumber = Number(startValue)
  const endNumber = Number(endValue)
  const first = Number.isFinite(startNumber) ? Math.round(startNumber) : 1
  const second = Number.isFinite(endNumber) ? Math.round(endNumber) : first + 1
  const start = Math.min(first, second)
  const end = Math.max(start + 1, Math.max(first, second))

  return { start, end }
}

function normalizeTaskRange(rawStart, rawEnd, fallbackStart, fallbackEnd, chartStart, chartEnd) {
  const parsedStart = Number(rawStart)
  const parsedEnd = Number(rawEnd)
  const fallback = normalizeGanttRange(fallbackStart, fallbackEnd)
  const rawRange = normalizeGanttRange(
    Number.isFinite(parsedStart) ? parsedStart : fallback.start,
    Number.isFinite(parsedEnd) ? parsedEnd : fallback.end,
  )
  const start = Math.max(chartStart, Math.min(chartEnd - 1, rawRange.start))
  const end = Math.max(start + 1, Math.min(chartEnd, rawRange.end))

  return { start, end }
}

export function ganttTaskRowsForConfig(config = {}) {
  const { start: chartStart, end: chartEnd } = normalizeGanttRange(config.ganttStart, config.ganttEnd)
  const count = countInRange(config.barCount, 3)
  const chartSpan = chartEnd - chartStart
  const defaultProgress = clampProgress(config.ganttProgress, 0)
  const explicitRows = splitConfigRows(config.ganttTasks)
  const legacyLabels = explicitRows.length ? [] : splitInlineLabels(config.blockLabels)

  return Array.from({ length: count }, (_, index) => {
    const parts = explicitRows[index]?.split(',').map((part) => part.trim()) ?? (legacyLabels[index] ? [legacyLabels[index]] : [])
    const autoStart = Math.min(chartEnd - 1, Math.round(chartStart + (chartSpan * index) / count))
    const autoEnd = index === count - 1 ? chartEnd : Math.round(chartStart + (chartSpan * (index + 1)) / count)
    const { start, end } = normalizeTaskRange(parts[1], parts[2], autoStart, autoEnd, chartStart, chartEnd)
    const rowProgress = Number(parts[3])

    return {
      label: parts[0] || `Task ${taskLetter(index)}`,
      start,
      end,
      progress: Number.isFinite(rowProgress) ? clampProgress(rowProgress, defaultProgress) : defaultProgress,
    }
  })
}

export function buildGanttChartSnippet(config = {}, { formatText = (value) => value } = {}) {
  const { start, end } = normalizeGanttRange(config.ganttStart, config.ganttEnd)
  const rows = ganttTaskRowsForConfig(config)
  const title = formatText(hasText(config.plotTitle) ? config.plotTitle : 'Plan')

  return [
    `\\begin{ganttchart}[hgrid,vgrid,bar progress label font=\\scriptsize]{${start}}{${end}}`,
    `  \\gantttitle{${title}}{${end - start + 1}} \\\\`,
    ...rows.map((row, index) => {
      const suffix = index < rows.length - 1 ? ' \\\\' : ''
      return `  \\ganttbar[progress=${row.progress}]{${formatText(row.label)}}{${row.start}}{${row.end}}${suffix}`
    }),
    '\\end{ganttchart}',
  ]
}

export function barChartRowsForConfig(config = {}) {
  const count = countInRange(config.barCount, 3)
  const explicitRows = splitConfigRows(config.barData)
  const fallbackValues = [2, 3.5, 2.8, 4.2, 3.1]

  return Array.from({ length: count }, (_, index) => {
    const line = explicitRows[index] ?? ''
    const parts = line.includes(',')
      ? line.split(',').map((part) => part.trim())
      : line.split(/\s+/).map((part) => part.trim())
    const label = parts[0] || taskLetter(index)
    const parsedValue = Number(parts.at(-1))
    const value = Number.isFinite(parsedValue) ? parsedValue : fallbackValues[index % fallbackValues.length]

    return {
      key: `bar${index + 1}`,
      label,
      value,
    }
  })
}

export function buildBarChartSnippet(config = {}, { formatText = (value) => value } = {}) {
  const rows = barChartRowsForConfig(config)
  const xKeys = rows.map((row) => row.key).join(',')
  const xLabels = rows.map((row) => formatText(row.label)).join(',')
  const coordinates = rows.map((row) => `(${row.key},${formatNumber(row.value)})`).join(' ')

  return [
    `\\begin{axis}[ybar,axis lines=left,symbolic x coords={${xKeys}},xtick=data,xticklabels={${xLabels}},tick label style={font=\\scriptsize}]`,
    `  \\addplot[draw=__COLOR__, fill=__COLOR__!15] coordinates {${coordinates}};`,
    '\\end{axis}',
  ]
}

export function shouldUseConfiguredLibrarySnippet(preset = {}, config = {}, capabilities = {}) {
  const presetId = `${preset.id ?? ''}`
  if (capabilities.hasCircuitComponent) return true
  if (preset.id === 'shape-callout') return true
  if (hasText(config.matrixEntries) && (preset.preview === 'matrix' || `${preset.id ?? ''}`.includes('matrix'))) return true
  if (presetId === 'plot-bar' && (hasText(config.barData) || countInRange(config.barCount, 3) !== 3)) return true
  if (
    presetId.includes('gantt') &&
    (
      config.ganttStart !== 1 ||
      config.ganttEnd !== 7 ||
      config.ganttProgress > 0 ||
      countInRange(config.barCount, 3) !== 3 ||
      hasText(config.blockLabels) ||
      hasText(config.ganttTasks)
    )
  ) {
    return true
  }
  if (
    (preset.group === 'Telecom' || `${preset.id ?? ''}`.startsWith('telecom-') || `${preset.id ?? ''}`.startsWith('rf-')) &&
    hasText(config.blockLabels)
  ) {
    return Boolean(capabilities.explicitBlockLabels)
  }
  if (capabilities.explicitModularDiagramConfig && modularDiagramKindForPreset(preset)) return true

  return configurablePrimitiveIds.has(preset.id)
}
