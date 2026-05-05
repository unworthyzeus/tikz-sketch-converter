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

const axisModeEnvironments = new Set(['axis', 'semilogxaxis', 'semilogyaxis', 'loglogaxis'])
const pgfplotsEnvironments = new Set([...axisModeEnvironments, 'polaraxis'])

function hasExplicitAxisMode(explicitModes = {}) {
  return Boolean(explicitModes.xMode || explicitModes.yMode)
}

export function pgfplotsAxisEnvironmentForModes(currentEnvironment, config = {}, explicitModes = {}) {
  if (!axisModeEnvironments.has(currentEnvironment) || !hasExplicitAxisMode(explicitModes)) {
    return currentEnvironment
  }

  const xLog = config.xMode === 'log'
  const yLog = config.yMode === 'log'
  if (xLog && yLog) return 'loglogaxis'
  if (xLog) return 'semilogxaxis'
  if (yLog) return 'semilogyaxis'
  return 'axis'
}

export function applyPgfplotsAxisMode(lines, config = {}, explicitModes = {}) {
  if (!hasExplicitAxisMode(explicitModes)) return lines

  return lines.map((line) =>
    line.replace(/\\(begin|end)\{(axis|semilogxaxis|semilogyaxis|loglogaxis)\}/g, (match, boundary, environment) => {
      const nextEnvironment = pgfplotsAxisEnvironmentForModes(environment, config, explicitModes)
      return `\\${boundary}{${nextEnvironment}}`
    }),
  )
}

export function functionPgfplotsAxisSettings(options = {}) {
  const requestedEnvironment = pgfplotsEnvironments.has(options.axisType) ? options.axisType : 'axis'
  const xMode = options.logX || requestedEnvironment === 'semilogxaxis' || requestedEnvironment === 'loglogaxis' ? 'log' : 'linear'
  const yMode = options.logY || requestedEnvironment === 'semilogyaxis' || requestedEnvironment === 'loglogaxis' ? 'log' : 'linear'

  return {
    environment: pgfplotsAxisEnvironmentForModes(requestedEnvironment, { xMode, yMode }, { xMode: true, yMode: true }),
    xMode,
    yMode,
  }
}

function constellationCoordinatesForModulation(value = '') {
  const key = `${value ?? ''}`.trim().toUpperCase().replace(/\s+/g, '').replaceAll('_', '-')
  if (key === 'BPSK' || key === '2-PSK') return [[-1, 0], [1, 0]]
  if (key === 'QPSK' || key === '4-QAM' || key === '4QAM') return [[-1, -1], [-1, 1], [1, -1], [1, 1]]
  if (key === '8-PSK' || key === '8PSK') {
    return Array.from({ length: 8 }, (_, index) => {
      const angle = (index * Math.PI) / 4
      return [Math.cos(angle), Math.sin(angle)]
    })
  }
  if (key === '16-QAM' || key === '16QAM') {
    return [-3, -1, 1, 3].flatMap((x) => [-3, -1, 1, 3].map((y) => [x, y]))
  }
  const squareQamMatch = key.match(/^(\d+)-?QAM$/)
  const order = Number(squareQamMatch?.[1])
  const sideLength = Math.sqrt(order)
  if (Number.isInteger(sideLength) && sideLength > 1 && sideLength <= 32) {
    const levels = Array.from({ length: sideLength }, (_, index) => 2 * index - (sideLength - 1))
    return levels.flatMap((x) => levels.map((y) => [x, y]))
  }
  return null
}

function coordinateList(points) {
  return points.map(([x, y]) => `(${formatNumber(x)},${formatNumber(y)})`).join(' ')
}

export function applyLibraryPlotModulation(lines, presetId, config = {}) {
  if (presetId !== 'plot-constellation') return lines

  const coordinates = constellationCoordinatesForModulation(config.modulation)
  if (!coordinates?.length) return lines

  const nextLines = []
  let replaced = false
  let pendingAddplot = false
  let skippingOriginalCoordinates = false

  lines.forEach((line) => {
    if (skippingOriginalCoordinates) {
      if (line.includes(';')) skippingOriginalCoordinates = false
      return
    }

    if (replaced) {
      nextLines.push(line)
      return
    }

    const hasAddplot = /\\addplot(?:3|\+)?\b/.test(line)
    const hasCoordinates = line.includes('coordinates')
    if (!pendingAddplot && !hasAddplot) {
      nextLines.push(line)
      return
    }

    if (hasAddplot && !hasCoordinates) {
      pendingAddplot = !line.includes(';')
      nextLines.push(line)
      return
    }

    if (!hasCoordinates) {
      if (line.includes(';')) pendingAddplot = false
      nextLines.push(line)
      return
    }

    replaced = true
    pendingAddplot = false
    const replacement = `coordinates {${coordinateList(coordinates)}}`
    if (/coordinates\s*\{[^}]*\}/.test(line)) {
      nextLines.push(line.replace(/coordinates\s*\{[^}]*\}/, replacement))
      return
    }

    const openingMatch = line.match(/^(.*?coordinates\s*)\{/)
    nextLines.push(openingMatch ? `${openingMatch[1]}{${coordinateList(coordinates)}};` : line)
    skippingOriginalCoordinates = !line.includes(';')
  })

  return nextLines
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
