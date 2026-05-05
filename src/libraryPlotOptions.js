import { splitTikzOptions } from './tikzOptions.js'

const defaultErrorBarOptions = '/pgfplots/error bars/y dir=both, /pgfplots/error bars/y explicit'
const numericTokenPattern = /^[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?$/i

function formatNumber(value) {
  if (!Number.isFinite(value)) return '0'
  const rounded = Math.round(value * 1000) / 1000
  return Object.is(rounded, -0) ? '0' : `${rounded}`
}

function headerForColumnCount(count) {
  const names = ['x', 'y', 'z']
  return Array.from({ length: count }, (_, index) => names[index] ?? `c${index + 1}`).join(' ')
}

export function parseLibraryPlotDataTable(value = '') {
  return `${value ?? ''}`
    .split(/\n|;/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) =>
      line
        .split(/[,\s]+/)
        .map((part) => part.trim())
        .filter(Boolean),
    )
    .filter((parts) => parts.length >= 2 && parts.every((part) => numericTokenPattern.test(part)))
    .map((parts) => parts.map(Number))
}

function addplotPrefix(line) {
  const coordinateMatch = line.match(/^(.*?\\addplot(?:3|\+)?(?:\[[^\]]*])?)\s+coordinates\b/)
  if (coordinateMatch) return coordinateMatch[1].trimEnd()

  const expressionMatch = line.match(/^(.*?\\addplot(?:3|\+)?(?:\[[^\]]*])?)\s+\{.*};\s*$/)
  if (expressionMatch) return expressionMatch[1].trimEnd()

  return line.trimEnd()
}

function tableLinesFor(prefix, rows) {
  const leadingWhitespace = prefix.match(/^\s*/)?.[0] ?? ''
  const columns = Math.max(2, ...rows.map((row) => row.length))
  return [
    `${prefix} table[row sep=\\\\] {`,
    `${leadingWhitespace}  ${headerForColumnCount(columns)}\\\\`,
    ...rows.map((row) => `${leadingWhitespace}  ${row.map(formatNumber).join(' ')}\\\\`),
    `${leadingWhitespace}};`,
  ]
}

export function applyLibraryPlotDataTable(lines, dataTable) {
  const rows = parseLibraryPlotDataTable(dataTable)
  if (!rows.length) return lines

  const nextLines = []
  let replaced = false
  let skippingOriginalCoordinates = false

  lines.forEach((line) => {
    if (skippingOriginalCoordinates) {
      if (line.includes(';')) skippingOriginalCoordinates = false
      return
    }

    const trimmed = line.trimStart()
    if (!replaced && /^\\addplot(?:3|\+)?\b/.test(trimmed)) {
      nextLines.push(...tableLinesFor(addplotPrefix(line), rows))
      replaced = true
      skippingOriginalCoordinates = !line.includes(';')
      return
    }

    nextLines.push(line)
  })

  return nextLines
}

export function libraryAddPlotTikzOptions(config = {}) {
  const options = []
  const samples = Number(config.samples)

  if (`${config.plotDomain ?? ''}`.trim()) options.push(`domain=${`${config.plotDomain}`.trim()}`)
  if (Number.isFinite(samples) && Math.round(samples) !== 120) options.push(`samples=${Math.round(samples)}`)
  if (config.markStyle) options.push(`mark=${config.markStyle}`)
  if (config.plotSmooth) options.push('smooth')
  if (config.shader) options.push(`shader=${config.shader}`)
  if (config.pointMeta) options.push(`point meta=${config.pointMeta}`)
  if (config.stemPlot) options.push('ycomb')
  if (config.constPlot) options.push('const plot')
  if (config.errorBars) options.push(...splitTikzOptions(config.errorBarOptions || defaultErrorBarOptions))
  options.push(...splitTikzOptions(config.addplotExtraOptions))
  return options
}
