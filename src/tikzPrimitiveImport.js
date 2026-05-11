const numberPattern = String.raw`[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?`
const coordinatePattern = new RegExp(String.raw`\(\s*(${numberPattern})\s*,\s*(${numberPattern})\s*\)`, 'gi')

function readCoordinates(source) {
  return [...`${source ?? ''}`.matchAll(coordinatePattern)].map((match) => ({
    x: Number(match[1]),
    y: Number(match[2]),
  }))
}

function parseOptions(statement) {
  return statement.match(/\\(?:draw|path|node)\s*\[([^\]]*)]/)?.[1] ?? ''
}

function importedStyleFor(options = '') {
  const style = {}
  if (/\b(?:dashed|dotted|dash pattern)\b/i.test(options)) style.dashed = true

  const widthMatch = options.match(/\bline width\s*=\s*([-+]?(?:\d+\.?\d*|\.\d+))/i)
  if (widthMatch) style.width = Number(widthMatch[1])

  const drawMatch = options.match(/\b(?:draw|color)\s*=\s*([#A-Za-z0-9!]+)\b/i)
  if (drawMatch?.[1]?.startsWith('#')) style.stroke = drawMatch[1]

  const fillMatch = options.match(/\bfill\s*=\s*([#A-Za-z0-9!]+)\b/i)
  if (fillMatch?.[1]?.startsWith('#')) style.fill = fillMatch[1]

  return style
}

function arrowStyleFor(options = '', statement = '') {
  const text = `${options} ${statement}`
  if (/\{?Stealth}?\s*-\s*\{?Stealth}?|<->|<-/i.test(text)) return 'both'
  if (/Latex/i.test(text)) return 'latex'
  if (/Triangle/i.test(text)) return 'triangle'
  if (/->|-\{(?:Stealth|Latex|Triangle)}/i.test(text)) return 'stealth'
  return null
}

function statementLines(snippet = '') {
  const body = `${snippet ?? ''}`
    .replace(/\\begin\{tikzpicture}(\[[^\]]*])?/g, '')
    .replace(/\\end\{tikzpicture}/g, '')

  return body
    .split(';')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('%'))
}

function parseNode(statement) {
  const match = statement.match(
    new RegExp(String.raw`\\node(?:\[[^\]]*])?(?:\s*\([^)]+\))?\s*at\s*\(\s*(${numberPattern})\s*,\s*(${numberPattern})\s*\)\s*\{([\s\S]*)\}\s*$`, 'i'),
  )
  if (!match) return null

  return {
    type: 'text',
    position: { x: Number(match[1]), y: Number(match[2]) },
    text: match[3].trim(),
    ...importedStyleFor(parseOptions(statement)),
  }
}

function parseRectangle(statement) {
  if (!/\\draw\b/i.test(statement) || !/\brectangle\b/i.test(statement)) return null
  const coordinates = readCoordinates(statement)
  if (coordinates.length < 2) return null

  return {
    type: 'rect',
    start: coordinates[0],
    end: coordinates[1],
    ...importedStyleFor(parseOptions(statement)),
  }
}

function parseCircle(statement) {
  const match = statement.match(new RegExp(String.raw`\\draw(?:\[[^\]]*])?\s*\(\s*(${numberPattern})\s*,\s*(${numberPattern})\s*\)\s*circle\s*\(\s*(${numberPattern})\s*\)\s*$`, 'i'))
  if (!match) return null

  const x = Number(match[1])
  const y = Number(match[2])
  const radius = Math.abs(Number(match[3]))
  return {
    type: 'ellipse',
    start: { x: x - radius, y: y - radius },
    end: { x: x + radius, y: y + radius },
    ...importedStyleFor(parseOptions(statement)),
  }
}

function parseEllipse(statement) {
  const coordinate = statement.match(new RegExp(String.raw`\\draw(?:\[[^\]]*])?\s*\(\s*(${numberPattern})\s*,\s*(${numberPattern})\s*\)\s*ellipse`, 'i'))
  if (!coordinate) return null

  const radiusMatch =
    statement.match(new RegExp(String.raw`x\s+radius\s*=\s*(${numberPattern}).*y\s+radius\s*=\s*(${numberPattern})`, 'i')) ??
    statement.match(new RegExp(String.raw`ellipse\s*\(\s*(${numberPattern})\s+and\s+(${numberPattern})\s*\)`, 'i'))
  if (!radiusMatch) return null

  const x = Number(coordinate[1])
  const y = Number(coordinate[2])
  const radiusX = Math.abs(Number(radiusMatch[1]))
  const radiusY = Math.abs(Number(radiusMatch[2]))
  return {
    type: 'ellipse',
    start: { x: x - radiusX, y: y - radiusY },
    end: { x: x + radiusX, y: y + radiusY },
    ...importedStyleFor(parseOptions(statement)),
  }
}

function parsePath(statement) {
  if (!/\\(?:draw|path)\b/i.test(statement) || !/--/.test(statement)) return null
  const points = readCoordinates(statement)
  if (points.length < 2) return null

  const options = parseOptions(statement)
  const arrowStyle = arrowStyleFor(options, statement)
  if (points.length === 2) {
    return {
      type: arrowStyle ? 'arrow' : 'line',
      start: points[0],
      end: points[1],
      ...(arrowStyle ? { arrowStyle } : {}),
      ...importedStyleFor(options),
    }
  }

  return {
    type: 'path',
    points,
    smooth: false,
    ...importedStyleFor(options),
  }
}

export function parseEditableTikzPrimitives(snippet = '') {
  const elements = []
  const unsupported = []

  statementLines(snippet).forEach((statement) => {
    const parsed =
      parseNode(statement) ??
      parseRectangle(statement) ??
      parseCircle(statement) ??
      parseEllipse(statement) ??
      parsePath(statement)

    if (parsed) {
      elements.push(parsed)
    } else {
      unsupported.push(`${statement};`)
    }
  })

  return { elements, unsupported }
}
