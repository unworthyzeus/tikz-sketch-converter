function hasText(value) {
  return `${value ?? ''}`.trim().length > 0
}

export function configDrivenRequirements(config = {}) {
  const libraries = new Set()
  const pgfplotsLibraries = new Set()

  if (config.shadow) libraries.add('shadows')
  if (hasText(config.pattern)) libraries.add('patterns')

  if (config.shapeVariant === 'callout') libraries.add('shapes.callouts')
  if (config.shapeVariant === 'cloud') libraries.add('shapes.symbols')
  if (config.shapeVariant === 'cylinder') libraries.add('shapes.geometric')
  if (config.shapeVariant === 'split') libraries.add('shapes.multipart')

  if (hasText(config.colormap)) pgfplotsLibraries.add('colormaps')

  return {
    libraries: [...libraries].sort(),
    pgfplotsLibraries: [...pgfplotsLibraries].sort(),
  }
}
