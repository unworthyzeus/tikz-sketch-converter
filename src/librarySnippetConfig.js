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

export function shouldUseConfiguredLibrarySnippet(preset = {}, config = {}, capabilities = {}) {
  if (capabilities.hasCircuitComponent) return true
  if (preset.id === 'shape-callout') return true
  if (hasText(config.matrixEntries) && (preset.preview === 'matrix' || `${preset.id ?? ''}`.includes('matrix'))) return true
  if (
    `${preset.id ?? ''}`.includes('gantt') &&
    (config.ganttStart !== 1 || config.ganttEnd !== 7 || config.ganttProgress > 0 || hasText(config.blockLabels))
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
