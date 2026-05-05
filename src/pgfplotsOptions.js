function integerInRange(value, fallback, min, max) {
  const number = Number(value)
  if (!Number.isFinite(number)) return fallback
  return Math.max(min, Math.min(max, Math.round(number)))
}

function textValue(value) {
  return `${value ?? ''}`.trim()
}

function pushTextOption(options, key, value) {
  const text = textValue(value)
  if (text) options.push(`${key}=${text}`)
}

function pushStyleOption(options, key, value) {
  const text = textValue(value)
  if (text) options.push(`${key}={${text}}`)
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
  pushTextOption(options, 'xmin', config.xmin)
  pushTextOption(options, 'xmax', config.xmax)
  pushTextOption(options, 'ymin', config.ymin)
  pushTextOption(options, 'ymax', config.ymax)
  pushStyleOption(options, 'xlabel style', config.xLabelStyle)
  pushStyleOption(options, 'ylabel style', config.yLabelStyle)
  pushStyleOption(options, 'tick label style', config.tickLabelStyle)
  pushStyleOption(options, 'legend style', config.legendStyle)
  pushStyleOption(options, 'axis line style', config.axisLineStyle)
  pushStyleOption(options, 'grid style', config.gridLineStyle)
  pushTextOption(options, 'enlargelimits', config.enlargeLimits)

  return options
}
