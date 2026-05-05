function integerInRange(value, fallback, min, max) {
  const number = Number(value)
  if (!Number.isFinite(number)) return fallback
  return Math.max(min, Math.min(max, Math.round(number)))
}

export function advancedPgfplotsAxisOptions(config = {}) {
  const options = []
  const minorTicks = integerInRange(config.minorTicks, 0, 0, 20)
  const legendColumns = integerInRange(config.legendColumns, 1, 1, 8)

  if (config.axisEqual) options.push('axis equal image')
  if (minorTicks > 0) options.push(`minor tick num=${minorTicks}`)
  if (legendColumns > 1) options.push(`legend columns=${legendColumns}`)
  if (config.reverseX) options.push('x dir=reverse')
  if (config.reverseY) options.push('y dir=reverse')

  return options
}
