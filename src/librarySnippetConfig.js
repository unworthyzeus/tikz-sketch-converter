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

function taskLetter(index) {
  return String.fromCharCode(65 + (index % 26))
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

  return configurablePrimitiveIds.has(preset.id)
}
