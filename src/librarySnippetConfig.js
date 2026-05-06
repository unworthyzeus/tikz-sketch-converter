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

export function buildModularDiagramSnippet(preset = {}, config = {}, options = {}) {
  switch (modularDiagramKindForPreset(preset)) {
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
