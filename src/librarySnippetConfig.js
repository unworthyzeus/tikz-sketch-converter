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
    return true
  }

  return configurablePrimitiveIds.has(preset.id)
}
