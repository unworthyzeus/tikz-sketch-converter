function cleanText(value) {
  const text = `${value ?? ''}`.trim()
  return text || null
}

export function objectPreviewBadges(preset = {}, config = {}, maxBadges = 4) {
  const primaryLabel = cleanText(config.autoLabel ? config.circuitLabel : config.label)
  const entries = []

  if (primaryLabel) entries.push({ key: 'label', text: primaryLabel })
  else if (cleanText(preset.title)) entries.push({ key: 'title', text: cleanText(preset.title) })

  const candidates = [
    ['value', cleanText(config.circuitValue)],
    ['net', cleanText(config.netName) ? `net: ${cleanText(config.netName)}` : null],
    ['ref', cleanText(config.referenceName)],
    ['role', cleanText(config.paperRole)],
    ['tag', cleanText(config.datasetTag)],
    ['model', cleanText(config.spiceModel)],
  ]

  candidates.forEach(([key, text]) => {
    if (text) entries.push({ key, text })
  })

  return entries.slice(0, maxBadges)
}

export function terminalPreviewLabels(value = '', count = 0) {
  const configured = `${value ?? ''}`
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

  return Array.from({ length: count }, (_, index) => configured[index] || `${index + 1}`)
}
