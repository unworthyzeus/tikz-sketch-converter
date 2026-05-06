export function splitNodeLabels(value = '', count = 0) {
  const labels = `${value ?? ''}`
    .split(/[,;\n]/)
    .map((label) => label.trim())
    .filter(Boolean)
  const safeCount = Math.max(0, Math.round(Number(count) || 0))

  return Array.from({ length: safeCount }, (_, index) => labels[index] ?? `${index + 1}`)
}

function splitExplicitLabels(value = '') {
  return `${value ?? ''}`
    .split(/[,;\n]/)
    .map((label) => label.trim())
    .filter(Boolean)
}

function connectorLabelAnchor(direction) {
  return direction === 'up' || direction === 'down' ? 'right' : 'above'
}

export function connectorLabelTikz(config = {}, connectorIndex = 0, formatText = (value) => value) {
  const labels = splitExplicitLabels(config.edgeLabels)
  const label = labels[connectorIndex]
  if (!label) return ''

  return ` node[midway, ${connectorLabelAnchor(config.nodeDirection)}, font=\\scriptsize] {${formatText(label)}}`
}
