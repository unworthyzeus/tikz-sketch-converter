function defaultFormat(value) {
  return `${Number(value)}`
}

export function circuitDrawTikzOptions(config = {}, formatValue = defaultFormat) {
  const options = ['draw=__COLOR__', 'line width=0.65pt']
  const bipoleLength = Number(config.bipoleLength)

  if (Number.isFinite(bipoleLength) && bipoleLength > 0) {
    options.push(`bipoles/length=${formatValue(bipoleLength)}cm`)
  }
  if (config.circuitStyle === 'iec') options.push('european')
  if (config.circuitStyle === 'american') options.push('american')

  return options
}
