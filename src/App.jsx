import { useMemo, useRef, useState } from 'react'
import {
  ArrowRight,
  BrainCircuit,
  CalendarDays,
  Circle,
  Code2,
  Copy,
  CircuitBoard,
  Download,
  Eraser,
  Grid3X3,
  GitBranch,
  Layers,
  Minus,
  MousePointer2,
  PenLine,
  RotateCcw,
  RotateCw,
  Sigma,
  Sparkles,
  Square,
  Trash2,
  Type,
  Upload,
  Workflow,
  Maximize2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import './App.css'
import { latexSymbolGroups } from './latexSymbols'
import { libraryPresets } from './tikzLibraryPresets'
import { libraryPaletteItems } from './tikzPaletteItems'

const CANVAS = {
  width: 920,
  height: 620,
  scale: 40,
}

const SNAP_STEP = 0.25

const strokeColors = [
  { label: 'Ink', value: '#111111' },
  { label: 'Graphite', value: '#4b5563' },
  { label: 'Muted blue', value: '#1f4e79' },
  { label: 'Muted green', value: '#2f6f4e' },
  { label: 'Muted red', value: '#8c2f39' },
  { label: 'Amber', value: '#b45309' },
  { label: 'Violet', value: '#6d28d9' },
  { label: 'Teal', value: '#0f766e' },
  { label: 'Black', value: '#000000' },
]

const fillColors = [
  { label: 'Sin relleno', value: 'none' },
  { label: 'White', value: '#ffffff' },
  { label: 'Blue wash', value: '#dbeafe' },
  { label: 'Green wash', value: '#dcfce7' },
  { label: 'Red wash', value: '#fee2e2' },
  { label: 'Amber wash', value: '#fef3c7' },
  { label: 'Violet wash', value: '#ede9fe' },
  { label: 'Cyan wash', value: '#cffafe' },
]

const arrowStyleOptions = [
  { value: 'stealth', label: 'Stealth', tikz: '-{Stealth}' },
  { value: 'latex', label: 'LaTeX', tikz: '-{Latex}' },
  { value: 'triangle', label: 'Triangle', tikz: '-{Triangle}' },
  { value: 'plain', label: 'Simple', tikz: '->' },
  { value: 'both', label: 'Doble', tikz: '{Stealth}-{Stealth}' },
  { value: 'none', label: 'Sin punta', tikz: '-' },
]

const libraryNodeShapeOptions = [
  { value: 'rounded', label: 'Redondeado' },
  { value: 'rectangle', label: 'Rectangulo' },
  { value: 'circle', label: 'Circulo' },
  { value: 'ellipse', label: 'Elipse' },
  { value: 'diamond', label: 'Rombo' },
]

const latexSymbols = latexSymbolGroups.flatMap((group) =>
  group.symbols.map((symbol) => ({
    ...symbol,
    group: group.name,
    haystack: `${group.name} ${symbol.label} ${symbol.value} ${symbol.aliases ?? ''}`.toLowerCase(),
  })),
)

const latexPreviewMap = new Map(latexSymbols.filter((symbol) => !symbol.accent).map((symbol) => [symbol.value, symbol.label]))

const latexCommandPreviewMap = new Map(
  latexSymbols
    .filter((symbol) => !symbol.accent && /^\\[A-Za-z]+$/.test(symbol.value))
    .map((symbol) => [symbol.value, symbol.label]),
)

const accentPreviewMarks = {
  hat: '\u0302',
  widehat: '\u0302',
  tilde: '\u0303',
  widetilde: '\u0303',
  bar: '\u0304',
  overline: '\u0305',
  vec: '\u20d7',
  dot: '\u0307',
  ddot: '\u0308',
  breve: '\u0306',
  check: '\u030c',
  acute: '\u0301',
  grave: '\u0300',
  underline: '\u0332',
}

const toolMeta = [
  { id: 'select', label: 'Seleccionar', icon: MousePointer2 },
  { id: 'pen', label: 'Trazo libre', icon: PenLine },
  { id: 'line', label: 'Linea', icon: Minus },
  { id: 'arrow', label: 'Flecha', icon: ArrowRight },
  { id: 'rect', label: 'Rectangulo', icon: Square },
  { id: 'ellipse', label: 'Circulo / elipse', icon: Circle },
  { id: 'function', label: 'Funcion', icon: Sigma },
  { id: 'text', label: 'Texto', icon: Type },
  { id: 'erase', label: 'Borrar', icon: Eraser },
]

const diagramPresets = [
  {
    kind: 'circuit',
    title: 'Circuito RC',
    description: 'Fuente, resistor y capacitor',
    icon: CircuitBoard,
    origin: { x: -9.25, y: 6.2 },
    stroke: '#111111',
  },
  {
    kind: 'gantt',
    title: 'Gantt ML',
    description: 'Plan de tareas con barras',
    icon: CalendarDays,
    origin: { x: 1.75, y: 6.1 },
    stroke: '#111111',
  },
  {
    kind: 'ml',
    title: 'Pipeline ML',
    description: 'Datos, features, modelo, metricas',
    icon: Workflow,
    origin: { x: -9.25, y: -4.8 },
    stroke: '#111111',
  },
  {
    kind: 'dl',
    title: 'Red DL',
    description: 'Capas densas conectadas',
    icon: BrainCircuit,
    origin: { x: 2.25, y: -4.1 },
    stroke: '#111111',
  },
]

const seedElements = [
  {
    id: 'seed-function',
    type: 'function',
    expression: 'exp(-0.5*x^2)',
    domainStart: -5,
    domainEnd: 5,
    samples: 160,
    stroke: '#111111',
    width: 0.75,
    dashed: false,
    smooth: true,
  },
  {
    id: 'seed-line',
    type: 'line',
    start: { x: -5, y: 0.5 },
    end: { x: 5, y: 0.5 },
    stroke: '#111111',
    width: 0.45,
    dashed: true,
  },
  {
    id: 'seed-text',
    type: 'text',
    position: { x: 2.7, y: 1.05 },
    text: '$f(x)$',
    stroke: '#111111',
    width: 0.8,
  },
]

const createId = () =>
  globalThis.crypto?.randomUUID?.() ?? `el-${Date.now()}-${Math.random().toString(16).slice(2)}`

function makeDiagramElement(preset) {
  return {
    id: createId(),
    type: 'diagram',
    diagramKind: preset.kind,
    title: preset.title,
    origin: preset.origin,
    stroke: preset.stroke,
    fill: preset.fill ?? 'none',
    fillOpacity: preset.fillOpacity ?? 0.18,
    scale: preset.scale ?? 1,
    tikzOptions: preset.tikzOptions ?? '',
    width: 0.75,
    dashed: false,
  }
}

function makeLibraryElement(preset, origin = preset.origin) {
  return {
    id: createId(),
    type: 'library',
    presetId: preset.id,
    title: preset.title,
    group: preset.group,
    origin,
    stroke: preset.stroke,
    fill: preset.fill ?? 'none',
    fillOpacity: preset.fillOpacity ?? 0.18,
    scale: preset.scale ?? 1,
    tikzOptions: preset.tikzOptions ?? '',
    config: defaultLibraryConfig(preset),
    width: preset.defaultStrokeWidth ?? 0.75,
    dashed: false,
  }
}

function tikzArrowStyle(value) {
  return arrowStyleOptions.find((option) => option.value === value)?.tikz ?? '-{Stealth}'
}

function mathContent(text) {
  const trimmed = text.trim()
  const mathMatch = trimmed.match(/^\$(.*)\$$/)
  if (mathMatch) return mathMatch[1].trim()
  if (!trimmed || trimmed === 'Etiqueta') return ''
  return trimmed
}

function appendLatexSymbol(text, symbol) {
  if (symbol.accent) {
    const inlineMath = [...text.matchAll(/\$([^$]+)\$/g)]
    if (inlineMath.length) {
      const last = inlineMath.at(-1)
      const accented = symbol.value.replace('__BASE__', last[1].trim() || 'x')
      return `${text.slice(0, last.index)}$${accented}$${text.slice(last.index + last[0].length)}`
    }

    const base = mathContent(text) || 'x'
    return `$${symbol.value.replace('__BASE__', base)}$`
  }

  const value = symbol.value ?? symbol
  const current = text.trim()
  if (!current || current === 'Etiqueta') return `$${value}$`
  if (/^\$.*\$$/.test(current)) return current.replace(/\$$/, ` ${value}$`)
  return `${current} $${value}$`
}

function getLibraryPreset(element) {
  if (element.customPreset) return element.customPreset
  return (
    libraryPaletteItems.find((preset) => preset.id === element.presetId) ??
    libraryPresets.find((preset) => preset.id === element.presetId) ??
    libraryPaletteItems[0] ??
    libraryPresets[0]
  )
}

function defaultLibraryConfig(preset = {}) {
  return {
    stretchX: 1,
    stretchY: 1,
    label: preset.title ?? 'Object',
    extraNodes: 0,
    nodeSpacing: 0.85,
    nodeDirection: 'right',
    nodeShape: 'rounded',
    nodeLabels: 'A, B, C',
    connectNodes: true,
    calloutPointerX: 0.8,
    calloutPointerY: -0.5,
  }
}

function getLibraryConfig(element, preset = getLibraryPreset(element)) {
  const config = { ...defaultLibraryConfig(preset), ...(element.config ?? {}) }
  return {
    ...config,
    stretchX: Math.max(0.35, Math.min(4, Number(config.stretchX) || 1)),
    stretchY: Math.max(0.35, Math.min(4, Number(config.stretchY) || 1)),
    extraNodes: Math.max(0, Math.min(8, Math.round(Number(config.extraNodes) || 0))),
    nodeSpacing: Math.max(0.25, Math.min(3, Number(config.nodeSpacing) || 0.85)),
    calloutPointerX: Number(config.calloutPointerX) || 0,
    calloutPointerY: Number(config.calloutPointerY) || 0,
  }
}

function splitNodeLabels(value, count) {
  const labels = `${value ?? ''}`
    .split(/[,;\n]/)
    .map((label) => label.trim())
    .filter(Boolean)

  return Array.from({ length: count }, (_, index) => labels[index] ?? `${index + 1}`)
}

function libraryMetrics(element) {
  const preset = getLibraryPreset(element)
  const config = getLibraryConfig(element, preset)
  const baseWidth = Math.max(0.4, preset.width * config.stretchX)
  const baseHeight = Math.max(0.4, preset.height * config.stretchY)
  const nodeSpan = config.extraNodes * 0.9 + Math.max(0, config.extraNodes - 1) * config.nodeSpacing
  const gap = config.extraNodes ? config.nodeSpacing : 0
  const extraSpan = config.extraNodes ? nodeSpan + gap : 0
  const direction = config.nodeDirection

  return {
    preset,
    config,
    scale: Number(element.scale) || 1,
    baseWidth,
    baseHeight,
    leftExtra: direction === 'left' ? extraSpan : 0,
    rightExtra: direction === 'right' ? extraSpan : 0,
    upExtra: direction === 'up' ? extraSpan : 0,
    downExtra: direction === 'down' ? extraSpan : 0,
  }
}

function splitList(value) {
  return value
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

const worldBounds = {
  minX: -CANVAS.width / 2 / CANVAS.scale,
  maxX: CANVAS.width / 2 / CANVAS.scale,
  minY: -CANVAS.height / 2 / CANVAS.scale,
  maxY: CANVAS.height / 2 / CANVAS.scale,
}

function screenToWorld(point) {
  return {
    x: (point.x - CANVAS.width / 2) / CANVAS.scale,
    y: (CANVAS.height / 2 - point.y) / CANVAS.scale,
  }
}

function worldToScreen(point) {
  return {
    x: CANVAS.width / 2 + point.x * CANVAS.scale,
    y: CANVAS.height / 2 - point.y * CANVAS.scale,
  }
}

function snapPoint(point) {
  return {
    x: Math.round(point.x / SNAP_STEP) * SNAP_STEP,
    y: Math.round(point.y / SNAP_STEP) * SNAP_STEP,
  }
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function distanceToSegment(point, start, end) {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const lengthSquared = dx * dx + dy * dy
  if (!lengthSquared) return distance(point, start)

  const t = Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared))
  return distance(point, { x: start.x + t * dx, y: start.y + t * dy })
}

function normalBounds(start, end) {
  return {
    minX: Math.min(start.x, end.x),
    maxX: Math.max(start.x, end.x),
    minY: Math.min(start.y, end.y),
    maxY: Math.max(start.y, end.y),
  }
}

function pointInBounds(point, bounds, padding = 0) {
  return (
    point.x >= bounds.minX - padding &&
    point.x <= bounds.maxX + padding &&
    point.y >= bounds.minY - padding &&
    point.y <= bounds.maxY + padding
  )
}

function polylineHitsPoint(points, point, radius) {
  return points.some((candidate, index) => {
    if (index === 0) return distance(candidate, point) <= radius
    return distanceToSegment(point, points[index - 1], candidate) <= radius
  })
}

function formatNumber(value) {
  if (!Number.isFinite(value)) return '0'
  const rounded = Math.round(value * 1000) / 1000
  return Object.is(rounded, -0) ? '0' : `${rounded}`
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function erf(value) {
  const sign = value < 0 ? -1 : 1
  const x = Math.abs(value)
  const t = 1 / (1 + 0.3275911 * x)
  const y =
    1 -
    (((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
      t *
      Math.exp(-x * x))

  return sign * y
}

function logGamma(value) {
  if (value <= 0 && Number.isInteger(value)) return Number.NaN

  if (value < 0.5) {
    return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * value)) - logGamma(1 - value)
  }

  const coefficients = [
    676.5203681218851,
    -1259.1392167224028,
    771.3234287776531,
    -176.6150291621406,
    12.507343278686905,
    -0.13857109526572012,
    9.984369578019572e-6,
    1.5056327351493116e-7,
  ]
  let x = 0.9999999999998099
  const z = value - 1

  coefficients.forEach((coefficient, index) => {
    x += coefficient / (z + index + 1)
  })

  const t = z + coefficients.length - 0.5
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x)
}

function gamma(value) {
  if (value > 171.6) return Number.POSITIVE_INFINITY
  return Math.exp(logGamma(value))
}

function factorial(value) {
  if (value < 0) return Number.NaN
  if (!Number.isInteger(value)) return gamma(value + 1)

  let result = 1
  for (let index = 2; index <= value; index += 1) result *= index
  return result
}

function besselJ0(value) {
  const x = Number(value)
  let term = 1
  let sum = 1
  const factor = (x * x) / 4

  for (let k = 1; k <= 80; k += 1) {
    term *= -factor / (k * k)
    sum += term
    if (Math.abs(term) < 1e-13) break
  }

  return sum
}

function besselJ1(value) {
  const x = Number(value)
  let term = x / 2
  let sum = term
  const factor = (x * x) / 4

  for (let k = 1; k <= 80; k += 1) {
    term *= -factor / (k * (k + 1))
    sum += term
    if (Math.abs(term) < 1e-13) break
  }

  return sum
}

function besselJ(order, value) {
  const n = Math.round(order)
  const x = Number(value)
  if (n < 0 || Math.abs(n - order) > 1e-9) return Number.NaN
  if (n === 0) return besselJ0(x)
  if (n === 1) return besselJ1(x)
  if (x === 0) return 0

  let previous = besselJ0(x)
  let current = besselJ1(x)
  for (let k = 1; k < n; k += 1) {
    const next = (2 * k * current) / x - previous
    previous = current
    current = next
  }

  return current
}

const mathConstants = {
  e: Math.E,
  phi: (1 + Math.sqrt(5)) / 2,
  pi: Math.PI,
  tau: Math.PI * 2,
}

const mathFunctionHelpers = {
  abs: Math.abs,
  acos: Math.acos,
  acosh: Math.acosh,
  asin: Math.asin,
  asinh: Math.asinh,
  atan: Math.atan,
  atan2: Math.atan2,
  atanh: Math.atanh,
  besselj: besselJ,
  besselj0: besselJ0,
  besselj1: besselJ1,
  ceil: Math.ceil,
  clamp: (value, minimum, maximum) => Math.min(Math.max(value, minimum), maximum),
  cos: Math.cos,
  cosh: Math.cosh,
  deg: (value) => (value * 180) / Math.PI,
  erf,
  exp: Math.exp,
  factorial,
  floor: Math.floor,
  gamma,
  heaviside: (value) => (value < 0 ? 0 : 1),
  hypot: Math.hypot,
  j0: besselJ0,
  j1: besselJ1,
  lgamma: logGamma,
  ln: Math.log,
  log: Math.log,
  log10: Math.log10,
  log2: Math.log2,
  max: Math.max,
  min: Math.min,
  mod: (value, modulus) => ((value % modulus) + modulus) % modulus,
  nin: Math.min,
  pow: Math.pow,
  rad: (value) => (value * Math.PI) / 180,
  rect: (value) => (Math.abs(value) <= 0.5 ? 1 : 0),
  round: Math.round,
  sgn: Math.sign,
  sign: Math.sign,
  sin: Math.sin,
  sinc: (value) => (Math.abs(value) < 1e-9 ? 1 : Math.sin(value) / value),
  sinh: Math.sinh,
  sqrt: Math.sqrt,
  step: (value) => (value < 0 ? 0 : 1),
  tan: Math.tan,
  tanh: Math.tanh,
  tri: (value) => Math.max(1 - Math.abs(value), 0),
}

function compileExpression(expression) {
  const source = expression.trim()
  if (!source) throw new Error('La expresion esta vacia')
  if (!/^[0-9xX+\-*/^%().,\sA-Za-z]+$/.test(source)) {
    throw new Error('Usa solo x, numeros, operadores y funciones matematicas')
  }

  const normalized = source.toLowerCase()
  const names = normalized.match(/[a-z][a-z0-9]*/g) ?? []
  const unknown = names.find(
    (name) =>
      name !== 'x' &&
      !Object.prototype.hasOwnProperty.call(mathConstants, name) &&
      !Object.prototype.hasOwnProperty.call(mathFunctionHelpers, name),
  )
  if (unknown) throw new Error(`Nombre no permitido: ${unknown}`)

  const jsExpression = normalized
    .replace(/\^/g, '**')
    .replace(/\b([a-z][a-z0-9]*)\b/g, (name) => {
      if (name === 'x') return 'x'
      if (Object.prototype.hasOwnProperty.call(mathConstants, name)) return `constants.${name}`
      if (Object.prototype.hasOwnProperty.call(mathFunctionHelpers, name)) return `helpers.${name}`
      return name
    })

  const evaluator = Function('x', 'helpers', 'constants', `"use strict"; return (${jsExpression});`)
  return (x) => evaluator(x, mathFunctionHelpers, mathConstants)
}

function sampleFunction(element) {
  let evaluator
  try {
    evaluator = compileExpression(element.expression)
  } catch {
    return []
  }

  const start = Number(element.domainStart)
  const end = Number(element.domainEnd)
  const samples = Math.max(8, Math.min(400, Number(element.samples) || 120))
  const points = []

  for (let index = 0; index <= samples; index += 1) {
    const t = index / samples
    const x = start + (end - start) * t
    const y = evaluator(x)

    if (Number.isFinite(y) && Math.abs(y) < 1000) {
      points.push({ x, y })
    } else {
      points.push(null)
    }
  }

  return points
}

function splitDrawableSegments(points) {
  const segments = []
  let current = []

  points.forEach((point) => {
    if (!point) {
      if (current.length > 1) segments.push(current)
      current = []
      return
    }

    const previous = current.at(-1)
    if (previous && Math.abs(point.y - previous.y) > 8) {
      if (current.length > 1) segments.push(current)
      current = [point]
      return
    }

    current.push(point)
  })

  if (current.length > 1) segments.push(current)
  return segments
}

function perpendicularDistance(point, start, end) {
  const length = distance(start, end)
  if (length === 0) return distance(point, start)

  return Math.abs(
    (end.y - start.y) * point.x -
      (end.x - start.x) * point.y +
      end.x * start.y -
      end.y * start.x,
  ) / length
}

function simplifyPoints(points, tolerance = 0.08) {
  if (points.length <= 2) return points

  let maxDistance = 0
  let maxIndex = 0
  const start = points[0]
  const end = points.at(-1)

  for (let index = 1; index < points.length - 1; index += 1) {
    const currentDistance = perpendicularDistance(points[index], start, end)
    if (currentDistance > maxDistance) {
      maxDistance = currentDistance
      maxIndex = index
    }
  }

  if (maxDistance > tolerance) {
    const left = simplifyPoints(points.slice(0, maxIndex + 1), tolerance)
    const right = simplifyPoints(points.slice(maxIndex), tolerance)
    return left.slice(0, -1).concat(right)
  }

  return [start, end]
}

function classifyPath(element) {
  const points = element.points
  if (points.length < 4) return element

  const simplified = simplifyPoints(points, 0.1)
  const first = points[0]
  const last = points.at(-1)
  const totalLength = points.slice(1).reduce((sum, point, index) => sum + distance(points[index], point), 0)
  const directLength = distance(first, last)
  const maxLineDistance = Math.max(...points.map((point) => perpendicularDistance(point, first, last)))

  if (directLength > 0.35 && maxLineDistance < Math.max(0.16, directLength * 0.06)) {
    return {
      ...element,
      type: 'line',
      start: first,
      end: last,
    }
  }

  const xs = points.map((point) => point.x)
  const ys = points.map((point) => point.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const width = maxX - minX
  const height = maxY - minY
  const closed = distance(first, last) < Math.max(width, height) * 0.22

  if (!closed || width < 0.35 || height < 0.35 || totalLength < 0.5) {
    return { ...element, points: simplified }
  }

  const edgeTolerance = Math.max(0.16, Math.min(width, height) * 0.12)
  const edgeHits = points.filter(
    (point) =>
      Math.abs(point.x - minX) < edgeTolerance ||
      Math.abs(point.x - maxX) < edgeTolerance ||
      Math.abs(point.y - minY) < edgeTolerance ||
      Math.abs(point.y - maxY) < edgeTolerance,
  ).length

  if (edgeHits / points.length > 0.72) {
    return {
      ...element,
      type: 'rect',
      start: { x: minX, y: maxY },
      end: { x: maxX, y: minY },
    }
  }

  const center = { x: (minX + maxX) / 2, y: (minY + maxY) / 2 }
  const radiusX = width / 2
  const radiusY = height / 2
  const ovalError =
    points.reduce((sum, point) => {
      const normalized =
        ((point.x - center.x) * (point.x - center.x)) / (radiusX * radiusX) +
        ((point.y - center.y) * (point.y - center.y)) / (radiusY * radiusY)
      return sum + Math.abs(normalized - 1)
    }, 0) / points.length

  if (ovalError < 0.42) {
    return {
      ...element,
      type: 'ellipse',
      start: { x: minX, y: maxY },
      end: { x: maxX, y: minY },
    }
  }

  return { ...element, points: simplified }
}

function moveElement(element, deltaX, deltaY) {
  const movePoint = (point) => ({ x: point.x + deltaX, y: point.y + deltaY })

  if (element.type === 'line' || element.type === 'arrow' || element.type === 'rect' || element.type === 'ellipse') {
    return {
      ...element,
      start: movePoint(element.start),
      end: movePoint(element.end),
    }
  }

  if (element.type === 'path') {
    return {
      ...element,
      points: element.points.map(movePoint),
    }
  }

  if (element.type === 'text') {
    return {
      ...element,
      position: movePoint(element.position),
    }
  }

  if (element.type === 'function') {
    return {
      ...element,
      domainStart: Number(element.domainStart) + deltaX,
      domainEnd: Number(element.domainEnd) + deltaX,
      yOffset: (Number(element.yOffset) || 0) + deltaY,
    }
  }

  if (element.type === 'diagram' || element.type === 'library') {
    return {
      ...element,
      origin: movePoint(element.origin),
    }
  }

  return element
}

function elementLabel(element) {
  const labels = {
    line: 'Linea',
    arrow: 'Flecha',
    rect: 'Rectangulo',
    ellipse: 'Elipse',
    path: 'Trazo libre',
    function: 'Funcion',
    text: 'Texto',
    diagram: element.title ?? 'Diagrama',
    library: element.title ?? 'Objeto TikZ',
  }

  return labels[element.type] ?? 'Elemento'
}

function escapeTikzText(text) {
  return text.replace(/[\\{}_%$#&]/g, (match) => {
    const replacements = {
      '\\': '\\textbackslash{}',
      '{': '\\{',
      '}': '\\}',
      '_': '\\_',
      '%': '\\%',
      '$': '\\$',
      '#': '\\#',
      '&': '\\&',
    }

    return replacements[match]
  })
}

function formatTikzNodeText(text) {
  if (/[\\$]/.test(text)) return text
  return escapeTikzText(text)
}

function indentLatex(lines, spaces = 2) {
  const pad = ' '.repeat(spaces)
  return lines.map((line) => (line ? `${pad}${line}` : line))
}

function safeLatexLabel(label) {
  return label
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^A-Za-z0-9:_.-]/g, '')
}

function previewLatexContent(content) {
  const trimmed = content.trim()
  const exact = latexPreviewMap.get(trimmed)
  if (exact) return exact

  const accentMatch = trimmed.match(/^\\([A-Za-z]+)\{(.+)\}$/)
  if (accentMatch && accentPreviewMarks[accentMatch[1]]) {
    return `${previewLatexContent(accentMatch[2])}${accentPreviewMarks[accentMatch[1]]}`
  }

  return trimmed
    .replace(/\\mathbb\{([A-Z])\}/g, (_, letter) => latexPreviewMap.get(`\\mathbb{${letter}}`) ?? letter)
    .replace(/\\mathcal\{([A-Z])\}/g, (_, letter) => latexPreviewMap.get(`\\mathcal{${letter}}`) ?? letter)
    .replace(/\\[A-Za-z]+/g, (command) => latexCommandPreviewMap.get(command) ?? command)
}

function escapeHtml(value) {
  return `${value}`.replace(/[&<>"']/g, (char) => {
    const replacements = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }

    return replacements[char]
  })
}

function renderMathHtml(content) {
  try {
    return katex.renderToString(content, {
      displayMode: false,
      output: 'html',
      throwOnError: false,
      strict: false,
    })
  } catch {
    return `<span class="latex-fallback">${escapeHtml(previewLatexContent(content))}</span>`
  }
}

function renderInlineLatexHtml(text) {
  return `${text}`
    .split(/(\$[^$]+\$)/g)
    .filter(Boolean)
    .map((part) => {
      if (part.startsWith('$') && part.endsWith('$')) {
        return renderMathHtml(part.slice(1, -1))
      }

      return escapeHtml(part)
    })
    .join('')
}

function plainTextForMeasure(text) {
  return `${text}`.replace(/\$([^$]+)\$/g, (_, content) => previewLatexContent(content))
}

function labelBoxForText(text) {
  const plain = plainTextForMeasure(text)
  return {
    width: Math.min(760, Math.max(72, plain.length * 10 + 36)),
    height: 40,
  }
}

function colorWithOpacity(color, opacity = 1) {
  if (!color || color === 'none') return 'transparent'
  const clean = color.replace('#', '')
  if (!/^[0-9a-f]{6}$/i.test(clean)) return color
  const red = parseInt(clean.slice(0, 2), 16)
  const green = parseInt(clean.slice(2, 4), 16)
  const blue = parseInt(clean.slice(4, 6), 16)
  return `rgb(${red} ${green} ${blue} / ${Math.max(0, Math.min(1, opacity))})`
}

function diagramPoint(element, point) {
  const scale = Number(element.scale) || 1
  return {
    x: element.origin.x + point.x * scale,
    y: element.origin.y + point.y * scale,
  }
}

function diagramBounds(element) {
  const scale = Number(element.scale) || 1
  const bounds = {
    circuit: { x: -0.45, y: -2.75, width: 5.75, height: 3.25 },
    gantt: { x: -0.55, y: -3.1, width: 7.35, height: 3.75 },
    ml: { x: -0.55, y: -0.85, width: 8.6, height: 1.7 },
    dl: { x: -0.55, y: -2.25, width: 6.65, height: 4.5 },
  }[element.diagramKind] ?? { x: -0.5, y: -0.5, width: 3, height: 2 }

  return {
    minX: element.origin.x + bounds.x * scale,
    maxX: element.origin.x + (bounds.x + bounds.width) * scale,
    minY: element.origin.y + bounds.y * scale,
    maxY: element.origin.y + (bounds.y + bounds.height) * scale,
  }
}

function tikzPoint(element, point) {
  const absolute = diagramPoint(element, point)
  return `(${formatNumber(absolute.x)},${formatNumber(absolute.y)})`
}

function tikzNodeId(element, suffix) {
  const compactId = element.id.replace(/[^A-Za-z0-9]/g, '').slice(0, 8)
  return `${element.diagramKind}${compactId}${suffix}`.replace(/[^A-Za-z0-9]/g, '')
}

function ganttTasks() {
  return [
    { label: 'Data', start: 0.2, end: 1.9, row: 0 },
    { label: 'Features', start: 1.5, end: 3.1, row: 1 },
    { label: 'Training', start: 3.0, end: 5.0, row: 2 },
    { label: 'Eval', start: 4.7, end: 6.2, row: 3 },
  ]
}

function mlSteps() {
  return ['Data', 'Clean', 'Features', 'Train', 'Metrics']
}

function dlLayerCounts() {
  return [4, 5, 3, 2]
}

function buildDiagramTikz(element, ensureColor) {
  const color = ensureColor(element.stroke)
  const fill = ensureColor(element.fill)
  const fillOpacity = formatNumber(element.fillOpacity ?? 0.18)
  const nodeFillStyle = fill === 'none' ? `fill=${color}!8` : `fill=${fill}, fill opacity=${fillOpacity}, text opacity=1`
  const markFillStyle = fill === 'none' ? `fill=${color}!10` : `fill=${fill}, fill opacity=${fillOpacity}, text opacity=1`
  const title = formatTikzNodeText(element.title)

  if (element.diagramKind === 'circuit') {
    return [
      `  % ${element.title}`,
      `  \\draw[draw=${color}, line width=${formatNumber(element.width)}pt]`,
      `    ${tikzPoint(element, { x: 0, y: 0 })} to[sV,l=$V_{in}$] ${tikzPoint(element, { x: 0, y: -2.4 })}`,
      `    -- ${tikzPoint(element, { x: 4.8, y: -2.4 })} to[C,l=$C$] ${tikzPoint(element, { x: 4.8, y: 0 })}`,
      `    -- ${tikzPoint(element, { x: 3.1, y: 0 })} to[R,l=$R$] ${tikzPoint(element, { x: 1.1, y: 0 })}`,
      `    -- ${tikzPoint(element, { x: 0, y: 0 })};`,
      `  \\node[anchor=west, text=${color}] at ${tikzPoint(element, { x: 5.05, y: 0 })} {$V_{out}$};`,
    ]
  }

  if (element.diagramKind === 'gantt') {
    const lines = [
      `  % ${element.title}`,
      `  \\node[anchor=west, text=${color}, font=\\bfseries] at ${tikzPoint(element, { x: 0, y: 0.45 })} {${title}};`,
      `  \\draw[draw=${color}!45, line width=0.45pt] ${tikzPoint(element, { x: 0, y: 0 })} rectangle ${tikzPoint(element, { x: 6.5, y: -2.75 })};`,
    ]

    for (let tick = 0; tick <= 6; tick += 1) {
      lines.push(
        `  \\draw[draw=${color}!18, line width=0.25pt] ${tikzPoint(element, { x: tick, y: 0 })} -- ${tikzPoint(element, { x: tick, y: -2.75 })};`,
        `  \\node[font=\\scriptsize, text=${color}!75] at ${tikzPoint(element, { x: tick + 0.5, y: 0.18 })} {${tick + 1}};`,
      )
    }

    ganttTasks().forEach((task) => {
      const y = -0.45 - task.row * 0.58
      lines.push(
        `  \\node[anchor=east, font=\\scriptsize, text=${color}] at ${tikzPoint(element, { x: -0.18, y })} {${task.label}};`,
        `  \\filldraw[${fill === 'none' ? `fill=${color}!18` : `fill=${fill}, fill opacity=${fillOpacity}`}, draw=${color}, rounded corners=1.5pt] ${tikzPoint(element, {
          x: task.start,
          y: y + 0.18,
        })} rectangle ${tikzPoint(element, { x: task.end, y: y - 0.18 })};`,
      )
    })

    return lines
  }

  if (element.diagramKind === 'ml') {
    const lines = [
      `  % ${element.title}`,
      `  \\node[anchor=west, text=${color}, font=\\bfseries] at ${tikzPoint(element, { x: 0, y: 0.72 })} {${title}};`,
    ]
    const steps = mlSteps()

    steps.forEach((step, index) => {
      const name = tikzNodeId(element, `step${index}`)
      lines.push(
        `  \\node[draw=${color}, ${nodeFillStyle}, rounded corners=2pt, minimum width=1.18cm, minimum height=0.62cm, align=center] (${name}) at ${tikzPoint(
          element,
          { x: index * 1.55, y: 0 },
        )} {\\scriptsize ${step}};`,
      )
      if (index > 0) {
        lines.push(`  \\draw[->, draw=${color}, line width=0.45pt] (${tikzNodeId(element, `step${index - 1}`)}) -- (${name});`)
      }
    })

    return lines
  }

  if (element.diagramKind === 'dl') {
    const lines = [
      `  % ${element.title}`,
      `  \\node[anchor=west, text=${color}, font=\\bfseries] at ${tikzPoint(element, { x: 0, y: 2.0 })} {${title}};`,
    ]
    const counts = dlLayerCounts()

    counts.forEach((count, layerIndex) => {
      const x = layerIndex * 1.65
      for (let nodeIndex = 0; nodeIndex < count; nodeIndex += 1) {
        const y = (count - 1) * 0.36 - nodeIndex * 0.72
        lines.push(
          `  \\node[circle, draw=${color}, ${markFillStyle}, minimum size=0.22cm, inner sep=0pt] (${tikzNodeId(
            element,
            `l${layerIndex}n${nodeIndex}`,
          )}) at ${tikzPoint(element, { x, y })} {};`,
        )
      }
    })

    counts.slice(0, -1).forEach((count, layerIndex) => {
      for (let left = 0; left < count; left += 1) {
        for (let right = 0; right < counts[layerIndex + 1]; right += 1) {
          lines.push(
            `  \\draw[draw=${color}!35, line width=0.25pt] (${tikzNodeId(element, `l${layerIndex}n${left}`)}) -- (${tikzNodeId(
              element,
              `l${layerIndex + 1}n${right}`,
            )});`,
          )
        }
      }
    })

    ;['Input', 'Hidden', 'Latent', 'Output'].forEach((label, index) => {
      lines.push(`  \\node[font=\\scriptsize, text=${color}] at ${tikzPoint(element, { x: index * 1.65, y: -1.85 })} {${label}};`)
    })

    return lines
  }

  return [`  % Unsupported diagram: ${element.title}`]
}

function libraryBounds(element) {
  const metrics = libraryMetrics(element)
  const scale = metrics.scale
  return {
    minX: element.origin.x - metrics.leftExtra * scale,
    maxX: element.origin.x + (metrics.baseWidth + metrics.rightExtra) * scale,
    minY: element.origin.y - (metrics.baseHeight + metrics.downExtra) * scale,
    maxY: element.origin.y + metrics.upExtra * scale,
  }
}

function elementIntersectsEraser(element, point, radius = 0.24) {
  if (element.type === 'line' || element.type === 'arrow') {
    return distanceToSegment(point, element.start, element.end) <= radius
  }

  if (element.type === 'rect') {
    return pointInBounds(point, normalBounds(element.start, element.end), radius)
  }

  if (element.type === 'ellipse') {
    const bounds = normalBounds(element.start, element.end)
    const center = {
      x: (bounds.minX + bounds.maxX) / 2,
      y: (bounds.minY + bounds.maxY) / 2,
    }
    const rx = Math.max((bounds.maxX - bounds.minX) / 2, radius)
    const ry = Math.max((bounds.maxY - bounds.minY) / 2, radius)
    const normalized = ((point.x - center.x) / rx) ** 2 + ((point.y - center.y) / ry) ** 2
    return normalized <= 1.15
  }

  if (element.type === 'path') {
    return polylineHitsPoint(element.points, point, radius)
  }

  if (element.type === 'function') {
    const points = sampleFunction(element)
      .filter(Boolean)
      .map((sample) => ({ x: sample.x, y: sample.y + (Number(element.yOffset) || 0) }))
    return polylineHitsPoint(points, point, radius)
  }

  if (element.type === 'text') {
    const box = labelBoxForText(element.text)
    const halfWidth = box.width / CANVAS.scale / 2
    const halfHeight = box.height / CANVAS.scale / 2
    return pointInBounds(
      point,
      {
        minX: element.position.x - halfWidth,
        maxX: element.position.x + halfWidth,
        minY: element.position.y - halfHeight,
        maxY: element.position.y + halfHeight,
      },
      radius,
    )
  }

  if (element.type === 'diagram') {
    return pointInBounds(point, diagramBounds(element), radius)
  }

  if (element.type === 'library') {
    return pointInBounds(point, libraryBounds(element), radius)
  }

  return false
}

function tikzNodeShapeOptions(shape) {
  const shapes = {
    circle: 'circle, minimum size=0.62cm',
    diamond: 'diamond, aspect=1.7, inner sep=1pt',
    ellipse: 'ellipse, minimum width=0.9cm',
    rectangle: 'rectangle, minimum width=0.9cm, minimum height=0.45cm',
    rounded: 'rectangle, rounded corners=2pt, minimum width=0.9cm, minimum height=0.45cm',
  }

  return shapes[shape] ?? shapes.rounded
}

function buildConfiguredLibrarySnippet(preset, element) {
  const config = getLibraryConfig(element, preset)
  const label = formatTikzNodeText(config.label || element.title)
  const width = formatNumber(Math.max(0.7, 1.35 * config.stretchX))
  const height = formatNumber(Math.max(0.35, 0.62 * config.stretchY))

  if (preset.id === 'shape-callout') {
    return [
      `\\node[rectangle callout, callout relative pointer={(${formatNumber(config.calloutPointerX)},${formatNumber(
        config.calloutPointerY,
      )})}, draw=__COLOR__, __FILL_STYLE__, line width=0.6pt, minimum width=${width}cm, minimum height=${height}cm, align=center] (callout) at (0,0) {${label}};`,
    ]
  }

  const simpleNodeShapes = {
    'shape-process': 'rectangle',
    'shape-rounded-module': 'rounded',
    'shape-ellipse-node': 'ellipse',
    'shape-cloud': 'cloud, cloud puffs=11',
    'math-equation-node': 'rectangle',
    'math-theorem-box': 'rectangle, align=left',
    'annotation-callout-arrow': 'rectangle, rounded corners=2pt, align=left',
  }
  const shape = simpleNodeShapes[preset.id]
  if (!shape) return null

  const nodeName = preset.id === 'annotation-callout-arrow' ? 'note' : 'obj'
  const lines = [
    `\\node[${shape}, draw=__COLOR__, __FILL_STYLE__, line width=0.6pt, minimum width=${width}cm, minimum height=${height}cm, inner sep=4pt] (${nodeName}) at (0,0) {${label}};`,
  ]

  if (preset.id === 'annotation-callout-arrow') {
    lines.push(`\\draw[-{Stealth}, draw=__COLOR__, line width=0.55pt] (${nodeName}.east) -- ++(${formatNumber(config.calloutPointerX)},${formatNumber(config.calloutPointerY)});`)
  }

  return lines
}

function extraNodeLocalPoint(metrics, index) {
  const { config, baseWidth, baseHeight } = metrics
  const step = config.nodeSpacing + 0.9
  const offset = config.nodeSpacing + index * step
  const centerX = baseWidth / 2
  const centerY = -baseHeight / 2

  if (config.nodeDirection === 'left') return { x: -offset, y: centerY }
  if (config.nodeDirection === 'up') return { x: centerX, y: offset }
  if (config.nodeDirection === 'down') return { x: centerX, y: -baseHeight - offset }
  return { x: baseWidth + offset, y: centerY }
}

function buildExtraNodeTikz(element, color, fill, scopeStretch = { x: 1, y: 1 }) {
  const metrics = libraryMetrics(element)
  const { config } = metrics
  if (!config.extraNodes) return []

  const fillStyle =
    fill === 'none'
      ? 'fill=white'
      : `fill=${fill}, fill opacity=${formatNumber(element.fillOpacity ?? 0.18)}, text opacity=1`
  const labels = splitNodeLabels(config.nodeLabels, config.extraNodes)
  const prefix = `extra${element.id.replace(/[^A-Za-z0-9]/g, '').slice(0, 8)}`
  const shapeOptions = tikzNodeShapeOptions(config.nodeShape)
  const lines = []

  labels.forEach((label, index) => {
    const point = extraNodeLocalPoint(metrics, index)
    const scopedPoint = {
      x: point.x / scopeStretch.x,
      y: point.y / scopeStretch.y,
    }
    lines.push(
      `\\node[${shapeOptions}, draw=${color}, ${fillStyle}, line width=0.55pt, align=center] (${prefix}${index}) at (${formatNumber(
        scopedPoint.x,
      )},${formatNumber(scopedPoint.y)}) {${formatTikzNodeText(label)}};`,
    )

    if (!config.connectNodes) return
    if (index === 0) {
      const anchor =
        config.nodeDirection === 'left'
          ? `(0,${formatNumber((-metrics.baseHeight / 2) / scopeStretch.y)})`
          : config.nodeDirection === 'up'
            ? `(${formatNumber((metrics.baseWidth / 2) / scopeStretch.x)},0)`
            : config.nodeDirection === 'down'
              ? `(${formatNumber((metrics.baseWidth / 2) / scopeStretch.x)},${formatNumber(-metrics.baseHeight / scopeStretch.y)})`
              : `(${formatNumber(metrics.baseWidth / scopeStretch.x)},${formatNumber((-metrics.baseHeight / 2) / scopeStretch.y)})`
      lines.push(`\\draw[-{Stealth}, draw=${color}!65, line width=0.45pt] ${anchor} -- (${prefix}${index});`)
      return
    }

    lines.push(`\\draw[-{Stealth}, draw=${color}!65, line width=0.45pt] (${prefix}${index - 1}) -- (${prefix}${index});`)
  })

  return lines
}

function replaceLibraryTokens(line, element, color, fill) {
  const preset = getLibraryPreset(element)
  const config = getLibraryConfig(element, preset)
  const fillColor = fill === 'none' ? color : fill
  const fillStyle =
    fill === 'none'
      ? 'fill=white'
      : `fill=${fill}, fill opacity=${formatNumber(element.fillOpacity ?? 0.18)}, text opacity=1`
  const fillAwareLine =
    fill === 'none'
      ? line
      : line.replace(/fill=__COLOR__![0-9.]+/g, 'fill=__FILL__, fill opacity=__FILL_OPACITY__')

  return fillAwareLine
    .replaceAll('__COLOR__', color)
    .replaceAll('__FILL__', fillColor)
    .replaceAll('__FILL_OPACITY__', formatNumber(element.fillOpacity ?? 0.18))
    .replaceAll('__FILL_STYLE__', fillStyle)
    .replaceAll('__OPTIONS__', element.tikzOptions?.trim() ?? '')
    .replaceAll('__LABEL__', formatTikzNodeText(config.label))
    .replaceAll('__OBJECT_WIDTH__', formatNumber(config.stretchX))
    .replaceAll('__OBJECT_HEIGHT__', formatNumber(config.stretchY))
    .replaceAll('__NODE_COUNT__', `${config.extraNodes}`)
    .replaceAll('__NODE_SPACING__', formatNumber(config.nodeSpacing))
    .replaceAll('__TITLE__', formatTikzNodeText(element.title))
    .replaceAll('__GROUP__', formatTikzNodeText(element.group ?? 'TikZ'))
}

function buildLibraryTikz(element, ensureColor) {
  const preset = getLibraryPreset(element)
  const config = getLibraryConfig(element, preset)
  const color = ensureColor(element.stroke)
  const fill = ensureColor(element.fill)
  const configuredSnippet = buildConfiguredLibrarySnippet(preset, element)
  const body = (configuredSnippet ?? preset.snippet).map((line) => replaceLibraryTokens(line, element, color, fill))
  const scopeStretch = configuredSnippet ? { x: 1, y: 1 } : { x: config.stretchX, y: config.stretchY }
  const extraNodes = buildExtraNodeTikz(element, color, fill, scopeStretch)

  if (preset.standalone) {
    return [
      `% Standalone ${preset.group}: ${element.title}`,
      `% Preview origin in editor: (${formatNumber(element.origin.x)}, ${formatNumber(element.origin.y)})`,
      ...body,
      ...extraNodes,
    ]
  }

  const scale = Number(element.scale) || 1
  const scopeOptions = [`shift={(${formatNumber(element.origin.x)},${formatNumber(element.origin.y)})}`]
  if (scale !== 1) scopeOptions.push(`scale=${formatNumber(scale)}`)
  if (!configuredSnippet && config.stretchX !== 1) scopeOptions.push(`xscale=${formatNumber(config.stretchX)}`)
  if (!configuredSnippet && config.stretchY !== 1) scopeOptions.push(`yscale=${formatNumber(config.stretchY)}`)
  if (!configuredSnippet && (config.stretchX !== 1 || config.stretchY !== 1)) scopeOptions.push('transform shape')
  if (fill !== 'none') {
    scopeOptions.push(
      `every node/.append style={fill=${fill}, fill opacity=${formatNumber(element.fillOpacity ?? 0.18)}, text opacity=1}`,
    )
  }
  if (element.tikzOptions?.trim()) scopeOptions.push(element.tikzOptions.trim())

  return [
    `  % ${preset.group}: ${element.title}`,
    `  \\begin{scope}[${scopeOptions.join(', ')}]`,
    ...body.map((line) => `    ${line}`),
    ...extraNodes.map((line) => `    ${line}`),
    '  \\end{scope}',
  ]
}

function collectRequirements(elements) {
  const packages = new Set(['\\usepackage{tikz}', '\\usepackage{xcolor}'])
  const libraries = new Set()
  const pgfplotsLibraries = new Set()
  const afterPreamble = new Set()

  const addPackagesForText = (text = '') => {
    if (/\\(?:operatorname|text|boldsymbol|iint|iiint|lVert|rVert|dfrac|tfrac)\b/.test(text)) {
      packages.add('\\usepackage{amsmath}')
    }

    if (
      /\\(?:mathbb|mathfrak|nless|ngtr|nleq|ngeq|lneq|gneq|lneqq|gneqq|nprec|nsucc|nsubseteq|nsupseteq|subsetneq|supsetneq|subsetneqq|supsetneqq|nmid|nvdash|nvDash|nVdash|nVDash|Join|Bumpeq|bumpeq|centerdot|lhd|rhd|unlhd|unrhd|boxplus|boxminus|boxtimes|boxdot|circledast|circledcirc|circleddash|ltimes|rtimes|leftthreetimes|rightthreetimes|curlywedge|curlyvee|Cap|Cup|smallsetminus|intercal|veebar|barwedge|leadsto|rightsquigarrow|leftrightsquigarrow|twoheadleftarrow|twoheadrightarrow|leftleftarrows|rightrightarrows|leftrightarrows|rightleftarrows|upuparrows|downdownarrows|dashleftarrow|dashrightarrow|leftarrowtail|rightarrowtail|looparrowleft|looparrowright|circlearrowleft|circlearrowright|Lsh|Rsh|curvearrowleft|curvearrowright|multimap)\b/.test(
        text,
      )
    ) {
      packages.add('\\usepackage{amssymb}')
    }

    if (/\\(?:textdegree|textmu)\b/.test(text)) {
      packages.add('\\usepackage{textcomp}')
    }

    if (/\\(?:llbracket|rrbracket)\b/.test(text)) {
      packages.add('\\usepackage{stmaryrd}')
    }
  }

  elements.forEach((element) => {
    if (element.type === 'diagram' && element.diagramKind === 'circuit') {
      packages.add('\\usepackage[american]{circuitikz}')
    }

    if (element.type === 'text') {
      addPackagesForText(element.text)
    }

    if (element.type === 'arrow') {
      libraries.add('arrows.meta')
    }

    if (element.type === 'library') {
      const preset = getLibraryPreset(element)
      preset.packages?.forEach((item) => packages.add(item))
      preset.libraries?.forEach((item) => libraries.add(item))
      preset.pgfplotsLibraries?.forEach((item) => pgfplotsLibraries.add(item))
      preset.afterPreamble?.forEach((item) => afterPreamble.add(item))
    }
  })

  return {
    packages: [...packages],
    libraries: [...libraries].sort(),
    pgfplotsLibraries: [...pgfplotsLibraries].sort(),
    afterPreamble: [...afterPreamble],
  }
}

function buildTikz(elements, exportOptions = {}) {
  const includeGrid = exportOptions.includeGrid ?? false
  const monochrome = exportOptions.monochrome ?? true
  const wrapFigure = exportOptions.wrapFigure ?? false
  const figureCaption = exportOptions.caption?.trim() ?? ''
  const figureLabel = safeLatexLabel(exportOptions.label ?? '')
  const requirements = collectRequirements(elements)
  const standaloneSnippets = []
  const usedColors = new Map()
  const ensureColor = (hex) => {
    if (!hex || hex === 'none') return 'none'
    if (monochrome) return 'black'
    const clean = hex.replace('#', '').toUpperCase()
    if (!usedColors.has(clean)) {
      const known = {
        '000000': 'tikzBlack',
        111111: 'tikzInk',
        FFFFFF: 'tikzWhite',
        '4B5563': 'tikzGraphite',
        '1F4E79': 'tikzMutedBlue',
        '2F6F4E': 'tikzMutedGreen',
        '8C2F39': 'tikzMutedRed',
        B45309: 'tikzAmber',
        '6D28D9': 'tikzViolet',
        '0F766E': 'tikzTeal',
        DBEAFE: 'tikzBlueWash',
        DCFCE7: 'tikzGreenWash',
        FEE2E2: 'tikzRedWash',
        FEF3C7: 'tikzAmberWash',
        EDE9FE: 'tikzVioletWash',
        CFFAFE: 'tikzCyanWash',
      }
      usedColors.set(clean, known[clean] ?? `tikzColor${usedColors.size + 1}`)
    }

    return usedColors.get(clean)
  }

  elements.forEach((element) => {
    ensureColor(element.stroke)
    ensureColor(element.fill)
  })

  const definitions = [...usedColors.entries()].map(
    ([hex, name]) => `\\definecolor{${name}}{HTML}{${hex}}`,
  )

  const optionsFor = (element, extras = [], allowFill = false) => {
    const options = [`draw=${ensureColor(element.stroke)}`, `line width=${formatNumber(element.width ?? 1)}pt`]
    if (element.dashed) options.push('dashed')
    if (allowFill && element.fill && element.fill !== 'none') {
      options.push(`fill=${ensureColor(element.fill)}`, `fill opacity=${formatNumber(element.fillOpacity ?? 0.18)}`)
    }
    if (extras.length) options.push(...extras)
    if (element.tikzOptions?.trim()) options.push(element.tikzOptions.trim())
    return `[${options.join(', ')}]`
  }

  const preambleLines = [
    '% Generated with TikZ Sketch Converter',
    '% Preamble suggestions:',
    ...requirements.packages.map((item) => `% ${item}`),
    ...(requirements.libraries.length ? [`% \\usetikzlibrary{${requirements.libraries.join(',')}}`] : []),
    ...(requirements.pgfplotsLibraries.length ? [`% \\usepgfplotslibrary{${requirements.pgfplotsLibraries.join(',')}}`] : []),
    ...requirements.afterPreamble.map((item) => `% ${item}`),
    ...definitions,
  ]
  const pictureLines = ['\\begin{tikzpicture}[x=1cm, y=1cm, line cap=round, line join=round, >=Stealth, every node/.style={font=\\small}]']

  if (includeGrid) {
    pictureLines.push(
      `  \\draw[step=1cm, line width=0.2pt, color=gray!18] (${Math.floor(worldBounds.minX)},${Math.floor(
        worldBounds.minY,
      )}) grid (${Math.ceil(worldBounds.maxX)},${Math.ceil(worldBounds.maxY)});`,
      `  \\draw[->, line width=0.35pt, color=gray!55] (${formatNumber(worldBounds.minX)},0) -- (${formatNumber(
        worldBounds.maxX,
      )},0) node[right] {$x$};`,
      `  \\draw[->, line width=0.35pt, color=gray!55] (0,${formatNumber(worldBounds.minY)}) -- (0,${formatNumber(
        worldBounds.maxY,
      )}) node[above] {$y$};`,
    )
  }

  elements.forEach((element) => {
    if (element.type === 'line') {
      pictureLines.push(
        `  \\draw${optionsFor(element)} (${formatNumber(element.start.x)},${formatNumber(
          element.start.y,
        )}) -- (${formatNumber(element.end.x)},${formatNumber(element.end.y)});`,
      )
    }

    if (element.type === 'arrow') {
      pictureLines.push(
        `  \\draw${optionsFor(element, [tikzArrowStyle(element.arrowStyle)])} (${formatNumber(element.start.x)},${formatNumber(
          element.start.y,
        )}) -- (${formatNumber(element.end.x)},${formatNumber(element.end.y)});`,
      )
    }

    if (element.type === 'rect') {
      pictureLines.push(
        `  \\draw${optionsFor(element, [], true)} (${formatNumber(element.start.x)},${formatNumber(
          element.start.y,
        )}) rectangle (${formatNumber(element.end.x)},${formatNumber(element.end.y)});`,
      )
    }

    if (element.type === 'ellipse') {
      const center = {
        x: (element.start.x + element.end.x) / 2,
        y: (element.start.y + element.end.y) / 2,
      }
      const radiusX = Math.abs(element.end.x - element.start.x) / 2
      const radiusY = Math.abs(element.end.y - element.start.y) / 2
      pictureLines.push(
        `  \\draw${optionsFor(element, [], true)} (${formatNumber(center.x)},${formatNumber(
          center.y,
        )}) ellipse [x radius=${formatNumber(radiusX)}, y radius=${formatNumber(radiusY)}];`,
      )
    }

    if (element.type === 'path') {
      const points = simplifyPoints(element.points, element.smooth ? 0.05 : 0.03)
      if (points.length > 1) {
        const coords = points.map((point) => `(${formatNumber(point.x)},${formatNumber(point.y)})`).join(' ')
        if (element.smooth) {
          pictureLines.push(`  \\draw${optionsFor(element, ['smooth'])} plot coordinates { ${coords} };`)
        } else {
          pictureLines.push(`  \\draw${optionsFor(element)} ${coords.replaceAll(') (', ') -- (')};`)
        }
      }
    }

    if (element.type === 'function') {
      const segments = splitDrawableSegments(
        sampleFunction(element).map((point) =>
          point ? { x: point.x, y: point.y + (Number(element.yOffset) || 0) } : null,
        ),
      )
      segments.forEach((segment, index) => {
        const coords = segment.map((point) => `(${formatNumber(point.x)},${formatNumber(point.y)})`).join(' ')
        const comment = index === 0 ? ` % f(x) = ${element.expression}` : ''
        pictureLines.push(`  \\draw${optionsFor(element, element.smooth === false ? [] : ['smooth'])} plot coordinates { ${coords} };${comment}`)
      })
    }

    if (element.type === 'text') {
      const color = ensureColor(element.stroke)
      const nodeOptions = [`text=${color}`]
      if (element.fill && element.fill !== 'none') {
        nodeOptions.push(
          `fill=${ensureColor(element.fill)}`,
          `fill opacity=${formatNumber(element.fillOpacity ?? 0.18)}`,
          'text opacity=1',
          'inner sep=2pt',
        )
      }
      if (element.tikzOptions?.trim()) nodeOptions.push(element.tikzOptions.trim())
      pictureLines.push(
        `  \\node[${nodeOptions.join(', ')}] at (${formatNumber(element.position.x)},${formatNumber(
          element.position.y,
        )}) {${formatTikzNodeText(element.text)}};`,
      )
    }

    if (element.type === 'diagram') {
      const diagramLines = buildDiagramTikz(element, ensureColor)
      if (element.tikzOptions?.trim()) {
        pictureLines.push(
          `  \\begin{scope}[${element.tikzOptions.trim()}]`,
          ...diagramLines.map((line) => `  ${line}`),
          '  \\end{scope}',
        )
      } else {
        pictureLines.push(...diagramLines)
      }
    }

    if (element.type === 'library') {
      const preset = getLibraryPreset(element)
      const snippet = buildLibraryTikz(element, ensureColor)
      if (preset.standalone) {
        standaloneSnippets.push(...snippet)
      } else {
        pictureLines.push(...snippet)
      }
    }
  })

  pictureLines.push('\\end{tikzpicture}')
  if (standaloneSnippets.length) {
    pictureLines.push('', '% Standalone library environments', ...standaloneSnippets)
  }

  if (!wrapFigure) {
    return [...preambleLines, ...pictureLines].join('\n')
  }

  const figureLines = ['\\begin{figure}[htbp]', '  \\centering', ...indentLatex(pictureLines)]
  if (figureCaption) figureLines.push(`  \\caption{${figureCaption}}`)
  if (figureLabel) figureLines.push(`  \\label{${figureLabel}}`)
  figureLines.push('\\end{figure}')
  return [...preambleLines, ...figureLines].join('\n')
}

function App() {
  const svgRef = useRef(null)
  const importInputRef = useRef(null)
  const [tool, setTool] = useState('select')
  const [zoom, setZoom] = useState(1)
  const [elements, setElements] = useState(seedElements)
  const [selectedId, setSelectedId] = useState('seed-function')
  const [draft, setDraft] = useState(null)
  const [interaction, setInteraction] = useState(null)
  const [past, setPast] = useState([])
  const [future, setFuture] = useState([])
  const [copyLabel, setCopyLabel] = useState('Copiar')
  const [mouseWorld, setMouseWorld] = useState({ x: 0, y: 0 })
  const [settings, setSettings] = useState({
    stroke: '#111111',
    fill: 'none',
    fillOpacity: 0.18,
    width: 0.8,
    dashed: false,
    smooth: true,
    snap: true,
    grid: true,
    arrowStyle: 'stealth',
    objectScale: 1,
    tikzOptions: '',
    labelText: 'Etiqueta',
    exportGrid: false,
    monochromeExport: true,
    wrapFigure: true,
    caption: 'Paper-ready TikZ figure.',
    label: 'fig:tikz-sketch',
  })
  const [functionDraft, setFunctionDraft] = useState({
    expression: '0.25*x^2 - 2',
    domainStart: -6,
    domainEnd: 6,
    samples: 120,
  })
  const [functionError, setFunctionError] = useState('')
  const [librarySearch, setLibrarySearch] = useState('')
  const [libraryGroup, setLibraryGroup] = useState('All')
  const [symbolSearch, setSymbolSearch] = useState('')
  const [symbolsOpen, setSymbolsOpen] = useState(false)
  const [customLibrary, setCustomLibrary] = useState({
    title: 'Custom TikZ block',
    group: 'Custom',
    packages: '\\usepackage{tikz}',
    libraries: 'arrows.meta, positioning',
    snippet: '\\node[draw=__COLOR__, rounded corners=2pt] (a) at (0,0) {Custom};\n\\draw[-{Stealth}, draw=__COLOR__] (a) -- ++(2,0) node[right] {edit me};',
  })

  const selectedElement = elements.find((element) => element.id === selectedId)
  const selectedLibraryConfig = selectedElement?.type === 'library' ? getLibraryConfig(selectedElement) : null
  const activeLabelText = selectedElement?.type === 'text' ? selectedElement.text : settings.labelText
  const tikzCode = useMemo(
    () =>
      buildTikz(elements, {
        includeGrid: settings.exportGrid,
        monochrome: settings.monochromeExport,
        wrapFigure: settings.wrapFigure,
        caption: settings.caption,
        label: settings.label,
      }),
    [elements, settings.caption, settings.exportGrid, settings.label, settings.monochromeExport, settings.wrapFigure],
  )
  const paletteGroups = useMemo(() => ['All', ...Array.from(new Set(libraryPaletteItems.map((preset) => preset.group))).sort()], [])
  const visiblePaletteItems = useMemo(() => {
    const query = librarySearch.trim().toLowerCase()

    return libraryPaletteItems.filter((preset) => {
      const matchesGroup = libraryGroup === 'All' || preset.group === libraryGroup
      const matchesSearch =
        !query ||
        [
          preset.title,
          preset.group,
          preset.description,
          ...(preset.tags ?? []),
          ...(preset.libraries ?? []),
          ...(preset.pgfplotsLibraries ?? []),
          ...(preset.packages ?? []),
        ]
          .join(' ')
          .toLowerCase()
          .includes(query)

      return matchesGroup && matchesSearch
    })
  }, [libraryGroup, librarySearch])
  const visibleLatexSymbols = useMemo(() => {
    const query = symbolSearch.trim().toLowerCase()
    if (!query) return latexSymbols
    return latexSymbols.filter((symbol) => symbol.haystack.includes(query))
  }, [symbolSearch])

  const setCanvasZoom = (nextZoom) => {
    const value = Number(nextZoom)
    setZoom(Math.min(2.25, Math.max(0.55, Number.isFinite(value) ? value : 1)))
  }

  const pushHistory = (snapshot = elements) => {
    setPast((items) => [...items, snapshot].slice(-50))
    setFuture([])
  }

  const commitElements = (nextElements, nextSelectedId = selectedId) => {
    pushHistory(elements)
    setElements(nextElements)
    setSelectedId(nextSelectedId)
  }

  const getWorldPointFromClient = (clientX, clientY) => {
    const rect = svgRef.current.getBoundingClientRect()
    const screenPoint = {
      x: ((clientX - rect.left) / rect.width) * CANVAS.width,
      y: ((clientY - rect.top) / rect.height) * CANVAS.height,
    }
    const worldPoint = screenToWorld(screenPoint)
    return settings.snap ? snapPoint(worldPoint) : worldPoint
  }

  const getWorldPoint = (event) => getWorldPointFromClient(event.clientX, event.clientY)

  const makeBaseElement = () => ({
    id: createId(),
    stroke: settings.stroke,
    fill: settings.fill,
    fillOpacity: settings.fillOpacity,
    width: settings.width,
    dashed: settings.dashed,
    smooth: settings.smooth,
    arrowStyle: settings.arrowStyle,
    tikzOptions: settings.tikzOptions,
  })

  const eraseIds = (ids, snapshot = elements) => {
    if (!ids.length) return
    const idSet = new Set(ids)
    pushHistory(snapshot)
    setElements((current) => current.filter((element) => !idSet.has(element.id)))
    setSelectedId(null)
  }

  const findEraserHits = (point, sourceElements = elements) =>
    sourceElements.filter((element) => elementIntersectsEraser(element, point)).map((element) => element.id)

  const findSelectableHits = (point, sourceElements = elements) =>
    sourceElements
      .map((element, index) => ({ element, index }))
      .filter(({ element }) => elementIntersectsEraser(element, point, 0.34))
      .sort((a, b) => b.index - a.index)
      .map(({ element }) => element)

  const beginErase = (event, forcedElement = null) => {
    const point = getWorldPoint(event)
    const hitIds = forcedElement ? [forcedElement.id] : findEraserHits(point)
    svgRef.current?.setPointerCapture?.(event.pointerId)
    eraseIds(hitIds, elements)
    setInteraction({
      mode: 'erase',
      snapshot: elements,
      erasedIds: hitIds,
      hasErased: hitIds.length > 0,
    })
  }

  const handlePointerDown = (event) => {
    const point = getWorldPoint(event)
    setMouseWorld(point)

    if (tool === 'select') {
      setSelectedId(null)
      return
    }

    if (tool === 'function') {
      return
    }

    if (tool === 'erase') {
      beginErase(event)
      return
    }

    if (tool === 'text') {
      const nextElement = {
        ...makeBaseElement(),
        type: 'text',
        position: point,
        text: settings.labelText,
      }
      commitElements([...elements, nextElement], nextElement.id)
      setTool('select')
      return
    }

    if (tool === 'pen') {
      setDraft({
        ...makeBaseElement(),
        type: 'path',
        points: [point],
      })
      return
    }

    setDraft({
      ...makeBaseElement(),
      type: tool,
      start: point,
      end: point,
    })
  }

  const handlePointerMove = (event) => {
    const point = getWorldPoint(event)
    setMouseWorld(point)

    if (interaction?.mode === 'erase') {
      const existingIds = new Set(interaction.erasedIds)
      const hitIds = findEraserHits(point).filter((id) => !existingIds.has(id))

      if (hitIds.length) {
        if (!interaction.hasErased) pushHistory(interaction.snapshot)
        const hitSet = new Set(hitIds)
        setElements((current) => current.filter((element) => !hitSet.has(element.id)))
        setSelectedId(null)
        setInteraction({
          ...interaction,
          hasErased: true,
          erasedIds: [...interaction.erasedIds, ...hitIds],
        })
      }

      return
    }

    if (interaction?.mode === 'move') {
      const deltaX = point.x - interaction.origin.x
      const deltaY = point.y - interaction.origin.y

      if (!interaction.moved) {
        setPast((items) => [...items, interaction.snapshot].slice(-50))
        setFuture([])
      }

      setInteraction({ ...interaction, moved: true })
      setElements((current) =>
        current.map((element) =>
          element.id === interaction.id ? moveElement(interaction.original, deltaX, deltaY) : element,
        ),
      )
      return
    }

    if (!draft) return

    if (draft.type === 'path') {
      const previous = draft.points.at(-1)
      if (distance(previous, point) > 0.05) {
        setDraft({
          ...draft,
          points: [...draft.points, point],
        })
      }
      return
    }

    setDraft({ ...draft, end: point })
  }

  const handlePointerUp = (event) => {
    if (interaction) {
      svgRef.current?.releasePointerCapture?.(event.pointerId)
      setInteraction(null)
      return
    }

    if (!draft) return

    if (draft.type === 'path') {
      if (draft.points.length > 2) {
        const cleaned = {
          ...draft,
          points: simplifyPoints(draft.points, draft.smooth ? 0.045 : 0.025),
        }
        commitElements([...elements, cleaned], cleaned.id)
      }
      setDraft(null)
      return
    }

    if (distance(draft.start, draft.end) > 0.08) {
      commitElements([...elements, draft], draft.id)
    }

    setDraft(null)
  }

  const handleElementPointerDown = (event, element) => {
    event.stopPropagation()

    if (tool === 'erase') {
      beginErase(event, element)
      return
    }

    const point = getWorldPoint(event)
    const hitElements = tool === 'select' ? findSelectableHits(point) : [element]
    const selectedHitIndex = hitElements.findIndex((hit) => hit.id === selectedId)
    const targetElement =
      tool === 'select' && hitElements.length > 1 && selectedHitIndex >= 0
        ? hitElements[(selectedHitIndex + 1) % hitElements.length]
        : hitElements[0] ?? element

    setSelectedId(targetElement.id)

    if (tool !== 'select') return

    svgRef.current?.setPointerCapture?.(event.pointerId)
    setInteraction({
      mode: 'move',
      id: targetElement.id,
      origin: point,
      original: targetElement,
      snapshot: elements,
      moved: false,
    })
  }

  const updateSelected = (patch) => {
    if (!selectedElement) return
    setElements((current) =>
      current.map((element) => (element.id === selectedElement.id ? { ...element, ...patch } : element)),
    )
  }

  const updateSelectedLibraryConfig = (patch) => {
    if (selectedElement?.type !== 'library') return
    updateSelected({ config: { ...getLibraryConfig(selectedElement), ...patch } })
  }

  const insertLatexSymbol = (symbol) => {
    if (selectedElement?.type === 'text') {
      updateSelected({ text: appendLatexSymbol(selectedElement.text, symbol) })
      return
    }

    setSettings((state) => ({
      ...state,
      labelText: appendLatexSymbol(state.labelText, symbol),
    }))
  }

  const updateLabelText = (text) => {
    if (selectedElement?.type === 'text') {
      updateSelected({ text })
      return
    }

    setSettings((state) => ({ ...state, labelText: text }))
  }

  const deleteSelected = () => {
    if (!selectedElement) return
    commitElements(
      elements.filter((element) => element.id !== selectedElement.id),
      null,
    )
  }

  const clearBoard = () => {
    if (!elements.length) return
    commitElements([], null)
    setTool('select')
  }

  const restoreDemo = () => {
    commitElements(seedElements, 'seed-function')
    setTool('select')
  }

  const recognizeSelectedPath = () => {
    if (!selectedElement || selectedElement.type !== 'path') return
    const converted = classifyPath(selectedElement)
    commitElements(
      elements.map((element) => (element.id === selectedElement.id ? converted : element)),
      converted.id,
    )
  }

  const addFunction = () => {
    try {
      compileExpression(functionDraft.expression)
      const nextElement = {
        ...makeBaseElement(),
        type: 'function',
        expression: functionDraft.expression,
        domainStart: Number(functionDraft.domainStart),
        domainEnd: Number(functionDraft.domainEnd),
        samples: Number(functionDraft.samples),
        yOffset: 0,
        stroke: settings.stroke,
        smooth: true,
      }
      setFunctionError('')
      commitElements([...elements, nextElement], nextElement.id)
      setTool('select')
    } catch (error) {
      setFunctionError(error.message)
    }
  }

  const addDiagramPreset = (preset) => {
    const nextElement = {
      ...makeDiagramElement(preset),
      stroke: settings.stroke,
      fill: settings.fill,
      fillOpacity: settings.fillOpacity,
      scale: settings.objectScale,
      tikzOptions: settings.tikzOptions,
    }
    commitElements([...elements, nextElement], nextElement.id)
    setTool('select')
  }

  const addLibraryPreset = (preset, origin = preset.origin) => {
    const nextElement = {
      ...makeLibraryElement(preset, origin),
      stroke: settings.stroke,
      fill: settings.fill,
      fillOpacity: settings.fillOpacity,
      scale: settings.objectScale,
      tikzOptions: settings.tikzOptions,
    }
    commitElements([...elements, nextElement], nextElement.id)
    setTool('select')
  }

  const handlePaletteDrop = (event) => {
    event.preventDefault()
    const itemId = event.dataTransfer.getData('application/x-tikz-palette-item')
    if (!itemId) return

    const item = libraryPaletteItems.find((preset) => preset.id === itemId)
    if (!item) return

    addLibraryPreset(item, getWorldPointFromClient(event.clientX, event.clientY))
  }

  const addCustomLibrary = () => {
    const customPreset = {
      id: `custom-${Date.now()}`,
      group: customLibrary.group || 'Custom',
      title: customLibrary.title || 'Custom TikZ block',
      description: 'User supplied TikZ snippet',
      origin: { x: -1.5, y: 1.5 },
      stroke: settings.stroke,
      fill: settings.fill,
      fillOpacity: settings.fillOpacity,
      scale: settings.objectScale,
      tikzOptions: settings.tikzOptions,
      width: 4.8,
      height: 2.4,
      preview: 'flow',
      packages: splitList(customLibrary.packages || '\\usepackage{tikz}'),
      libraries: splitList(customLibrary.libraries),
      snippet: customLibrary.snippet.split('\n').filter((line) => line.trim().length),
    }
    const nextElement = {
      ...makeLibraryElement(customPreset),
      stroke: settings.stroke,
      fill: settings.fill,
      fillOpacity: settings.fillOpacity,
      scale: settings.objectScale,
      tikzOptions: settings.tikzOptions,
      customPreset,
    }
    commitElements([...elements, nextElement], nextElement.id)
    setTool('select')
  }

  const undo = () => {
    setPast((items) => {
      if (!items.length) return items
      const previous = items.at(-1)
      setFuture((redoItems) => [elements, ...redoItems].slice(0, 50))
      setElements(previous)
      setSelectedId(null)
      return items.slice(0, -1)
    })
  }

  const redo = () => {
    setFuture((items) => {
      if (!items.length) return items
      const next = items[0]
      setPast((undoItems) => [...undoItems, elements].slice(-50))
      setElements(next)
      setSelectedId(null)
      return items.slice(1)
    })
  }

  const copyTikz = async () => {
    await navigator.clipboard.writeText(tikzCode)
    setCopyLabel('Copiado')
    window.setTimeout(() => setCopyLabel('Copiar'), 1200)
  }

  const downloadTikz = () => {
    downloadBlob(new Blob([tikzCode], { type: 'text/plain;charset=utf-8' }), 'sketch-tikz.tex')
  }

  const downloadBoardState = () => {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      elements,
      settings,
    }
    downloadBlob(
      new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' }),
      'tikz-sketch-board.json',
    )
  }

  const importBoardState = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const payload = JSON.parse(await file.text())
      const nextElements = Array.isArray(payload) ? payload : payload.elements
      if (!Array.isArray(nextElements)) throw new Error('Missing elements array')
      if (!nextElements.every((element) => element && typeof element === 'object' && typeof element.type === 'string')) {
        throw new Error('Invalid element payload')
      }

      pushHistory(elements)
      setElements(nextElements)
      setSelectedId(nextElements[0]?.id ?? null)
      setFuture([])
      if (payload.settings && typeof payload.settings === 'object') {
        setSettings((state) => ({ ...state, ...payload.settings }))
      }
      setTool('select')
    } catch (error) {
      window.alert(`No pude importar ese archivo: ${error.message}`)
    } finally {
      event.target.value = ''
    }
  }

  const downloadCanvasPng = async () => {
    if (!svgRef.current) return

    const clone = svgRef.current.cloneNode(true)
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    clone.setAttribute('width', `${CANVAS.width}`)
    clone.setAttribute('height', `${CANVAS.height}`)

    const style = document.createElementNS('http://www.w3.org/2000/svg', 'style')
    style.textContent = Array.from(document.styleSheets)
      .map((sheet) => {
        try {
          return Array.from(sheet.cssRules)
            .map((rule) => rule.cssText)
            .join('\n')
        } catch {
          return ''
        }
      })
      .join('\n')
    clone.insertBefore(style, clone.firstChild)

    const svgText = new XMLSerializer().serializeToString(clone)
    const svgBlob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)

    try {
      const image = new Image()
      await new Promise((resolve, reject) => {
        image.onload = resolve
        image.onerror = reject
        image.src = url
      })

      const pixelRatio = 2
      const canvas = document.createElement('canvas')
      canvas.width = CANVAS.width * pixelRatio
      canvas.height = CANVAS.height * pixelRatio
      const context = canvas.getContext('2d')
      context.fillStyle = '#ffffff'
      context.fillRect(0, 0, canvas.width, canvas.height)
      context.scale(pixelRatio, pixelRatio)
      context.drawImage(image, 0, 0, CANVAS.width, CANVAS.height)

      const pngBlob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png', 1))
      if (pngBlob) downloadBlob(pngBlob, 'tikz-sketch-board.png')
    } finally {
      URL.revokeObjectURL(url)
    }
  }

  const renderPolyline = (points, className, element, halo = false) => {
    const screenPoints = points.map(worldToScreen).map((point) => `${point.x},${point.y}`).join(' ')
    return (
      <polyline
        className={className}
        points={screenPoints}
        fill="none"
        stroke={halo ? '#6b7280' : element.stroke}
        strokeWidth={(halo ? element.width + 3 : element.width) * 1.05}
        strokeDasharray={element.dashed && !halo ? '8 8' : undefined}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={halo ? 0.32 : 1}
        vectorEffect="non-scaling-stroke"
      />
    )
  }

  const renderDiagramShape = (element, halo = false) => {
    const bounds = diagramBounds(element)
    const topLeft = worldToScreen({ x: bounds.minX, y: bounds.maxY })
    const bottomRight = worldToScreen({ x: bounds.maxX, y: bounds.minY })

    if (halo) {
      return (
        <rect
          x={topLeft.x}
          y={topLeft.y}
          width={bottomRight.x - topLeft.x}
          height={bottomRight.y - topLeft.y}
          rx="0"
          fill="none"
          opacity="0.7"
          stroke="#6b7280"
          strokeWidth="1"
          strokeDasharray="5 4"
          vectorEffect="non-scaling-stroke"
        />
      )
    }

    const point = (relative) => worldToScreen(diagramPoint(element, relative))
    const uiScale = Number(element.scale) || 1
    const shapeFill = element.fill && element.fill !== 'none' ? element.fill : '#ffffff'
    const shapeFillOpacity = element.fill && element.fill !== 'none' ? element.fillOpacity ?? 0.18 : 1
    const diagramScale = CANVAS.scale * (Number(element.scale) || 1)
    const lineProps = {
      fill: 'none',
      stroke: element.stroke,
      strokeWidth: element.width * 1.05,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      vectorEffect: 'non-scaling-stroke',
    }
    const labelProps = {
      fill: element.stroke,
      fontSize: 14,
      fontFamily: '"Times New Roman", Georgia, serif',
      fontWeight: 600,
      textAnchor: 'middle',
      dominantBaseline: 'middle',
    }
    const smallLabelProps = {
      ...labelProps,
      fontSize: 11,
      fontWeight: 600,
    }
    const pathPoints = (points) => points.map(point).map((item) => `${item.x},${item.y}`).join(' ')

    if (element.diagramKind === 'circuit') {
      const sourceCenter = point({ x: 0, y: -1.2 })
      const label = point({ x: 2.35, y: 0.45 })
      return (
        <g>
          <polyline {...lineProps} points={pathPoints([{ x: 0, y: 0 }, { x: 1.1, y: 0 }])} />
          <polyline
            {...lineProps}
            points={pathPoints([
              { x: 1.1, y: 0 },
              { x: 1.28, y: 0.18 },
              { x: 1.56, y: -0.18 },
              { x: 1.84, y: 0.18 },
              { x: 2.12, y: -0.18 },
              { x: 2.4, y: 0.18 },
              { x: 2.68, y: -0.18 },
              { x: 2.96, y: 0.18 },
              { x: 3.1, y: 0 },
            ])}
          />
          <polyline {...lineProps} points={pathPoints([{ x: 3.1, y: 0 }, { x: 4.8, y: 0 }, { x: 4.8, y: -0.88 }])} />
          <polyline {...lineProps} points={pathPoints([{ x: 4.45, y: -0.88 }, { x: 5.15, y: -0.88 }])} />
          <polyline {...lineProps} points={pathPoints([{ x: 4.45, y: -1.22 }, { x: 5.15, y: -1.22 }])} />
          <polyline {...lineProps} points={pathPoints([{ x: 4.8, y: -1.22 }, { x: 4.8, y: -2.4 }, { x: 0, y: -2.4 }])} />
          <polyline {...lineProps} points={pathPoints([{ x: 0, y: -2.4 }, { x: 0, y: -1.58 }])} />
          <polyline {...lineProps} points={pathPoints([{ x: 0, y: -0.82 }, { x: 0, y: 0 }])} />
          <circle cx={sourceCenter.x} cy={sourceCenter.y} r={0.38 * diagramScale} {...lineProps} />
          <text {...smallLabelProps} x={label.x} y={label.y}>
            R
          </text>
          <text {...smallLabelProps} x={point({ x: 5.25, y: -1.05 }).x} y={point({ x: 5.25, y: -1.05 }).y}>
            C
          </text>
          <text {...smallLabelProps} x={point({ x: -0.55, y: -1.2 }).x} y={point({ x: -0.55, y: -1.2 }).y}>
            Vin
          </text>
        </g>
      )
    }

    if (element.diagramKind === 'gantt') {
      const header = point({ x: 3.2, y: 0.5 })
      return (
        <g>
          <text {...labelProps} x={header.x} y={header.y}>
            {element.title}
          </text>
          <rect
            x={point({ x: 0, y: 0 }).x}
            y={point({ x: 0, y: 0 }).y}
            width={6.5 * diagramScale}
            height={2.75 * diagramScale}
            fill={shapeFill}
            fillOpacity={shapeFillOpacity}
            stroke={element.stroke}
            strokeOpacity="0.45"
            strokeWidth="1.1"
            vectorEffect="non-scaling-stroke"
          />
          {Array.from({ length: 7 }, (_, index) => {
            const start = point({ x: index, y: 0 })
            const end = point({ x: index, y: -2.75 })
            return <line key={`tick-${index}`} x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke={element.stroke} strokeOpacity="0.16" />
          })}
          {ganttTasks().map((task) => {
            const y = -0.45 - task.row * 0.58
            const labelPoint = point({ x: -0.25, y })
            const barStart = point({ x: task.start, y: y + 0.18 })
            return (
              <g key={task.label}>
                <text {...smallLabelProps} x={labelPoint.x} y={labelPoint.y} textAnchor="end">
                  {task.label}
                </text>
                <rect
                  x={barStart.x}
                  y={barStart.y}
                  width={(task.end - task.start) * diagramScale}
                  height={0.36 * diagramScale}
                  fill={shapeFill}
                  fillOpacity={shapeFillOpacity}
                  stroke={element.stroke}
                  strokeWidth="1.1"
                  vectorEffect="non-scaling-stroke"
                />
              </g>
            )
          })}
        </g>
      )
    }

    if (element.diagramKind === 'ml') {
      const markerId = `arrow-${element.id}`
      return (
        <g>
          <defs>
            <marker id={markerId} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 8 4 L 0 8 z" fill={element.stroke} />
            </marker>
          </defs>
          <text {...labelProps} x={point({ x: 3.1, y: 0.72 }).x} y={point({ x: 3.1, y: 0.72 }).y}>
            {element.title}
          </text>
          {mlSteps().map((step, index) => {
            const center = point({ x: index * 1.55, y: 0 })
            const nextCenter = point({ x: (index + 1) * 1.55, y: 0 })
            return (
              <g key={step}>
                {index < mlSteps().length - 1 && (
                  <line
                    x1={center.x + 27 * uiScale}
                    y1={center.y}
                    x2={nextCenter.x - 27 * uiScale}
                    y2={nextCenter.y}
                    stroke={element.stroke}
                    strokeWidth="1.2"
                    markerEnd={`url(#${markerId})`}
                  />
                )}
                <rect
                  x={center.x - 32 * uiScale}
                  y={center.y - 18 * uiScale}
                  width={64 * uiScale}
                  height={36 * uiScale}
                  rx="0"
                  fill={shapeFill}
                  fillOpacity={shapeFillOpacity}
                  stroke={element.stroke}
                />
                <text {...smallLabelProps} x={center.x} y={center.y}>
                  {step}
                </text>
              </g>
            )
          })}
        </g>
      )
    }

    if (element.diagramKind === 'dl') {
      const counts = dlLayerCounts()
      const nodes = counts.flatMap((count, layerIndex) =>
        Array.from({ length: count }, (_, nodeIndex) => ({
          id: `${layerIndex}-${nodeIndex}`,
          layerIndex,
          nodeIndex,
          count,
          point: point({ x: layerIndex * 1.65, y: (count - 1) * 0.36 - nodeIndex * 0.72 }),
        })),
      )
      return (
        <g>
          <text {...labelProps} x={point({ x: 2.5, y: 2 }).x} y={point({ x: 2.5, y: 2 }).y}>
            {element.title}
          </text>
          {counts.slice(0, -1).flatMap((count, layerIndex) =>
            Array.from({ length: count }, (_, left) =>
              Array.from({ length: counts[layerIndex + 1] }, (_, right) => {
                const from = nodes.find((node) => node.layerIndex === layerIndex && node.nodeIndex === left).point
                const to = nodes.find((node) => node.layerIndex === layerIndex + 1 && node.nodeIndex === right).point
                return <line key={`${layerIndex}-${left}-${right}`} x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={element.stroke} strokeOpacity="0.28" />
              }),
            ),
          )}
          {nodes.map((node) => (
            <circle
              key={node.id}
              cx={node.point.x}
              cy={node.point.y}
              r={8 * uiScale}
              fill={shapeFill}
              fillOpacity={shapeFillOpacity}
              stroke={element.stroke}
              strokeWidth="1.1"
            />
          ))}
          {['Input', 'Hidden', 'Latent', 'Output'].map((label, index) => {
            const labelPoint = point({ x: index * 1.65, y: -1.85 })
            return (
              <text key={label} {...smallLabelProps} x={labelPoint.x} y={labelPoint.y}>
                {label}
              </text>
            )
          })}
        </g>
      )
    }

    return null
  }

  const renderLibraryShape = (element, halo = false) => {
    const metrics = libraryMetrics(element)
    const { preset, config } = metrics
    const bounds = libraryBounds(element)
    const topLeft = worldToScreen({ x: bounds.minX, y: bounds.maxY })
    const bottomRight = worldToScreen({ x: bounds.maxX, y: bounds.minY })
    const width = bottomRight.x - topLeft.x
    const height = bottomRight.y - topLeft.y
    const totalWidth = metrics.leftExtra + metrics.baseWidth + metrics.rightExtra
    const totalHeight = metrics.upExtra + metrics.baseHeight + metrics.downExtra
    const baseLeft = topLeft.x + (metrics.leftExtra / totalWidth) * width
    const baseTop = topLeft.y + (metrics.upExtra / totalHeight) * height
    const baseWidth = (metrics.baseWidth / totalWidth) * width
    const baseHeight = (metrics.baseHeight / totalHeight) * height

    if (halo) {
      return (
        <rect
          x={topLeft.x - 4}
          y={topLeft.y - 4}
          width={width + 8}
          height={height + 8}
          rx="0"
          fill="none"
          opacity="0.7"
          stroke="#6b7280"
          strokeWidth="1"
          strokeDasharray="5 4"
          vectorEffect="non-scaling-stroke"
        />
      )
    }

    const sx = (x) => baseLeft + x * baseWidth
    const sy = (y) => baseTop + y * baseHeight
    const localToScreen = (point) => ({
      x: baseLeft + (point.x / metrics.baseWidth) * baseWidth,
      y: baseTop + (-point.y / metrics.baseHeight) * baseHeight,
    })
    const previewStroke = element.stroke
    const previewFill = element.fill && element.fill !== 'none' ? element.fill : '#ffffff'
    const previewFillOpacity = element.fill && element.fill !== 'none' ? element.fillOpacity ?? 0.18 : 1
    const shapeCommon = {
      fill: 'none',
      stroke: previewStroke,
      strokeWidth: 1.0,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      vectorEffect: 'non-scaling-stroke',
    }
    const filledShapeCommon = {
      ...shapeCommon,
      fill: previewFill,
      fillOpacity: previewFillOpacity,
    }

    const renderPreview = () => {
      if (preset.preview === 'resistor') {
        return (
          <g>
            <polyline {...shapeCommon} points={`${sx(0.08)},${sy(0.5)} ${sx(0.28)},${sy(0.5)} ${sx(0.34)},${sy(0.38)} ${sx(0.42)},${sy(0.62)} ${sx(0.5)},${sy(0.38)} ${sx(0.58)},${sy(0.62)} ${sx(0.66)},${sy(0.38)} ${sx(0.72)},${sy(0.5)} ${sx(0.92)},${sy(0.5)}`} />
            <text x={sx(0.5)} y={sy(0.22)} fill="#111111" fontSize="13" fontFamily='"Times New Roman", Georgia, serif' textAnchor="middle">
              R
            </text>
          </g>
        )
      }

      if (preset.preview === 'capacitor') {
        return (
          <g>
            <line {...shapeCommon} x1={sx(0.08)} y1={sy(0.5)} x2={sx(0.43)} y2={sy(0.5)} />
            <line {...shapeCommon} x1={sx(0.46)} y1={sy(0.28)} x2={sx(0.46)} y2={sy(0.72)} />
            <line {...shapeCommon} x1={sx(0.54)} y1={sy(0.28)} x2={sx(0.54)} y2={sy(0.72)} />
            <line {...shapeCommon} x1={sx(0.57)} y1={sy(0.5)} x2={sx(0.92)} y2={sy(0.5)} />
            <text x={sx(0.5)} y={sy(0.18)} fill="#111111" fontSize="13" fontFamily='"Times New Roman", Georgia, serif' textAnchor="middle">
              C
            </text>
          </g>
        )
      }

      if (preset.preview === 'inductor') {
        const coils = Array.from({ length: 4 }, (_, index) => {
          const x = 0.32 + index * 0.09
          return <path key={index} {...shapeCommon} d={`M ${sx(x)} ${sy(0.5)} q ${baseWidth * 0.045} ${-baseHeight * 0.28} ${baseWidth * 0.09} 0`} />
        })
        return (
          <g>
            <line {...shapeCommon} x1={sx(0.08)} y1={sy(0.5)} x2={sx(0.32)} y2={sy(0.5)} />
            {coils}
            <line {...shapeCommon} x1={sx(0.68)} y1={sy(0.5)} x2={sx(0.92)} y2={sy(0.5)} />
          </g>
        )
      }

      if (preset.preview === 'diode') {
        return (
          <g>
            <line {...shapeCommon} x1={sx(0.08)} y1={sy(0.5)} x2={sx(0.34)} y2={sy(0.5)} />
            <path {...shapeCommon} d={`M ${sx(0.34)} ${sy(0.28)} L ${sx(0.62)} ${sy(0.5)} L ${sx(0.34)} ${sy(0.72)} Z`} />
            <line {...shapeCommon} x1={sx(0.64)} y1={sy(0.28)} x2={sx(0.64)} y2={sy(0.72)} />
            <line {...shapeCommon} x1={sx(0.64)} y1={sy(0.5)} x2={sx(0.92)} y2={sy(0.5)} />
          </g>
        )
      }

      if (preset.preview === 'source') {
        return (
          <g>
            <circle
              cx={sx(0.28)}
              cy={sy(0.42)}
              r="14"
              fill={previewFill}
              fillOpacity={previewFillOpacity}
              stroke={previewStroke}
              strokeWidth="1"
            />
            <line {...shapeCommon} x1={sx(0.28)} y1={sy(0.62)} x2={sx(0.28)} y2={sy(0.78)} />
            <line {...shapeCommon} x1={sx(0.16)} y1={sy(0.78)} x2={sx(0.4)} y2={sy(0.78)} />
            <line {...shapeCommon} x1={sx(0.2)} y1={sy(0.84)} x2={sx(0.36)} y2={sy(0.84)} />
            <line {...shapeCommon} x1={sx(0.24)} y1={sy(0.9)} x2={sx(0.32)} y2={sy(0.9)} />
            <line {...shapeCommon} x1={sx(0.42)} y1={sy(0.42)} x2={sx(0.9)} y2={sy(0.42)} />
          </g>
        )
      }

      if (preset.preview === 'opamp') {
        return (
          <g>
            <path {...shapeCommon} d={`M ${sx(0.28)} ${sy(0.22)} L ${sx(0.28)} ${sy(0.78)} L ${sx(0.78)} ${sy(0.5)} Z`} />
            <line {...shapeCommon} x1={sx(0.08)} y1={sy(0.36)} x2={sx(0.28)} y2={sy(0.36)} />
            <line {...shapeCommon} x1={sx(0.08)} y1={sy(0.64)} x2={sx(0.28)} y2={sy(0.64)} />
            <line {...shapeCommon} x1={sx(0.78)} y1={sy(0.5)} x2={sx(0.94)} y2={sy(0.5)} />
          </g>
        )
      }

      if (preset.preview === 'gate') {
        return (
          <g>
            <rect {...filledShapeCommon} x={sx(0.32)} y={sy(0.28)} width={baseWidth * 0.34} height={baseHeight * 0.44} />
            <line {...shapeCommon} x1={sx(0.08)} y1={sy(0.4)} x2={sx(0.32)} y2={sy(0.4)} />
            <line {...shapeCommon} x1={sx(0.08)} y1={sy(0.6)} x2={sx(0.32)} y2={sy(0.6)} />
            <line {...shapeCommon} x1={sx(0.66)} y1={sy(0.5)} x2={sx(0.92)} y2={sy(0.5)} />
          </g>
        )
      }

      if (preset.preview === 'plot') {
        const points = Array.from({ length: 22 }, (_, index) => {
          const t = index / 21
          return `${sx(0.12 + t * 0.76)},${sy(0.62 - Math.sin(t * Math.PI * 2) * 0.18)}`
        }).join(' ')
        return (
          <g>
            <line {...shapeCommon} x1={sx(0.12)} y1={sy(0.72)} x2={sx(0.9)} y2={sy(0.72)} opacity="0.45" />
            <line {...shapeCommon} x1={sx(0.16)} y1={sy(0.18)} x2={sx(0.16)} y2={sy(0.82)} opacity="0.45" />
            <polyline {...shapeCommon} points={points} />
          </g>
        )
      }

      if (preset.preview === 'matrix') {
        return (
          <g>
            {[0, 1, 2].map((row) =>
              [0, 1, 2].map((col) => (
                <rect
                  key={`${row}-${col}`}
                  x={sx(0.18 + col * 0.2)}
                  y={sy(0.34 + row * 0.16)}
                  width={baseWidth * 0.13}
                  height={baseHeight * 0.11}
                  rx="3"
                  fill={previewFill}
                  fillOpacity={previewFillOpacity}
                  stroke={previewStroke}
                  strokeWidth="1"
                />
              )),
            )}
          </g>
        )
      }

      if (preset.preview === 'tree' || preset.preview === 'mindmap' || preset.preview === 'network' || preset.preview === 'automata') {
        const nodes = [
          [0.5, 0.28],
          [0.28, 0.6],
          [0.5, 0.66],
          [0.72, 0.6],
        ]
        return (
          <g>
            {nodes.slice(1).map((node, index) => (
              <line key={index} {...shapeCommon} x1={sx(nodes[0][0])} y1={sy(nodes[0][1])} x2={sx(node[0])} y2={sy(node[1])} opacity="0.45" />
            ))}
            {nodes.map((node, index) => (
              <circle
                key={index}
                cx={sx(node[0])}
                cy={sy(node[1])}
                r="8"
                fill={previewFill}
                fillOpacity={previewFillOpacity}
                stroke={previewStroke}
                strokeWidth="1.2"
              />
            ))}
          </g>
        )
      }

      if (preset.preview === 'circuit') {
        return (
          <g>
            <polyline {...shapeCommon} points={`${sx(0.12)},${sy(0.36)} ${sx(0.3)},${sy(0.36)} ${sx(0.34)},${sy(0.28)} ${sx(0.4)},${sy(0.44)} ${sx(0.46)},${sy(0.28)} ${sx(0.52)},${sy(0.44)} ${sx(0.58)},${sy(0.36)} ${sx(0.78)},${sy(0.36)} ${sx(0.78)},${sy(0.7)} ${sx(0.12)},${sy(0.7)} ${sx(0.12)},${sy(0.36)}`} />
            <line {...shapeCommon} x1={sx(0.72)} y1={sy(0.48)} x2={sx(0.84)} y2={sy(0.48)} />
            <line {...shapeCommon} x1={sx(0.72)} y1={sy(0.56)} x2={sx(0.84)} y2={sy(0.56)} />
          </g>
        )
      }

      if (preset.preview === 'cube') {
        return (
          <g>
            <rect {...filledShapeCommon} x={sx(0.28)} y={sy(0.38)} width={baseWidth * 0.28} height={baseHeight * 0.24} />
            <rect {...filledShapeCommon} x={sx(0.42)} y={sy(0.24)} width={baseWidth * 0.28} height={baseHeight * 0.24} opacity="0.75" />
            <line {...shapeCommon} x1={sx(0.28)} y1={sy(0.38)} x2={sx(0.42)} y2={sy(0.24)} />
            <line {...shapeCommon} x1={sx(0.56)} y1={sy(0.38)} x2={sx(0.7)} y2={sy(0.24)} />
            <line {...shapeCommon} x1={sx(0.56)} y1={sy(0.62)} x2={sx(0.7)} y2={sy(0.48)} />
          </g>
        )
      }

      return (
        <g>
          <rect {...filledShapeCommon} x={sx(0.18)} y={sy(0.36)} width={baseWidth * 0.18} height={baseHeight * 0.18} rx="4" />
          <rect {...filledShapeCommon} x={sx(0.44)} y={sy(0.36)} width={baseWidth * 0.18} height={baseHeight * 0.18} rx="4" />
          <rect {...filledShapeCommon} x={sx(0.7)} y={sy(0.36)} width={baseWidth * 0.18} height={baseHeight * 0.18} rx="4" />
          <line {...shapeCommon} x1={sx(0.36)} y1={sy(0.45)} x2={sx(0.44)} y2={sy(0.45)} />
          <line {...shapeCommon} x1={sx(0.62)} y1={sy(0.45)} x2={sx(0.7)} y2={sy(0.45)} />
        </g>
      )
    }

    const renderExtraNodePreview = () => {
      if (!config.extraNodes) return null

      const labels = splitNodeLabels(config.nodeLabels, config.extraNodes)
      const nodeWidth = Math.max(30, Math.min(74, baseWidth * 0.23))
      const nodeHeight = Math.max(22, Math.min(42, baseHeight * 0.25))
      const anchor =
        config.nodeDirection === 'left'
          ? localToScreen({ x: 0, y: -metrics.baseHeight / 2 })
          : config.nodeDirection === 'up'
            ? localToScreen({ x: metrics.baseWidth / 2, y: 0 })
            : config.nodeDirection === 'down'
              ? localToScreen({ x: metrics.baseWidth / 2, y: -metrics.baseHeight })
              : localToScreen({ x: metrics.baseWidth, y: -metrics.baseHeight / 2 })
      const nodes = labels.map((label, index) => ({
        label,
        point: localToScreen(extraNodeLocalPoint(metrics, index)),
      }))

      const renderNodeBody = (node, index) => {
        const commonNodeProps = {
          fill: previewFill,
          fillOpacity: previewFillOpacity,
          stroke: previewStroke,
          strokeWidth: 1,
          vectorEffect: 'non-scaling-stroke',
        }

        if (config.nodeShape === 'circle') {
          return <circle key={`node-${index}`} {...commonNodeProps} cx={node.point.x} cy={node.point.y} r={Math.min(nodeWidth, nodeHeight) / 2} />
        }

        if (config.nodeShape === 'ellipse') {
          return <ellipse key={`node-${index}`} {...commonNodeProps} cx={node.point.x} cy={node.point.y} rx={nodeWidth / 2} ry={nodeHeight / 2} />
        }

        if (config.nodeShape === 'diamond') {
          return (
            <path
              key={`node-${index}`}
              {...commonNodeProps}
              d={`M ${node.point.x} ${node.point.y - nodeHeight / 2} L ${node.point.x + nodeWidth / 2} ${node.point.y} L ${node.point.x} ${node.point.y + nodeHeight / 2} L ${node.point.x - nodeWidth / 2} ${node.point.y} Z`}
            />
          )
        }

        return (
          <rect
            key={`node-${index}`}
            {...commonNodeProps}
            x={node.point.x - nodeWidth / 2}
            y={node.point.y - nodeHeight / 2}
            width={nodeWidth}
            height={nodeHeight}
            rx={config.nodeShape === 'rounded' ? 5 : 0}
          />
        )
      }

      return (
        <g>
          {config.connectNodes &&
            nodes.map((node, index) => {
              const from = index === 0 ? anchor : nodes[index - 1].point
              return (
                <line
                  key={`link-${index}`}
                  {...shapeCommon}
                  x1={from.x}
                  y1={from.y}
                  x2={node.point.x}
                  y2={node.point.y}
                  opacity="0.55"
                />
              )
            })}
          {nodes.map(renderNodeBody)}
          {nodes.map((node, index) => (
            <text
              key={`label-${index}`}
              x={node.point.x}
              y={node.point.y + 4}
              fill="#111111"
              fontSize="11"
              fontFamily='"Times New Roman", Georgia, serif'
              textAnchor="middle"
            >
              {node.label}
            </text>
          ))}
        </g>
      )
    }

    return (
      <g>
        {renderPreview()}
        {renderExtraNodePreview()}
      </g>
    )
  }

  const renderArrowHead = (tip, tail, style, stroke, halo = false) => {
    if (style === 'none') return null

    const angle = Math.atan2(tip.y - tail.y, tip.x - tail.x)
    const length = style === 'triangle' ? 15 : 12
    const spread = style === 'triangle' ? 0.48 : 0.38
    const left = {
      x: tip.x - length * Math.cos(angle - spread),
      y: tip.y - length * Math.sin(angle - spread),
    }
    const right = {
      x: tip.x - length * Math.cos(angle + spread),
      y: tip.y - length * Math.sin(angle + spread),
    }

    if (style === 'plain' || style === 'latex') {
      return (
        <path
          d={`M ${left.x} ${left.y} L ${tip.x} ${tip.y} L ${right.x} ${right.y}`}
          fill="none"
          stroke={stroke}
          strokeWidth={halo ? 3 : 1.4}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={halo ? 0.35 : 1}
          vectorEffect="non-scaling-stroke"
        />
      )
    }

    return (
      <path
        d={`M ${tip.x} ${tip.y} L ${left.x} ${left.y} L ${right.x} ${right.y} Z`}
        fill={stroke}
        stroke={stroke}
        opacity={halo ? 0.3 : 1}
      />
    )
  }

  const renderElementHitTarget = (element) => {
    const hitProps = {
      className: 'canvas-hit-target',
      fill: 'transparent',
      stroke: 'transparent',
      pointerEvents: 'all',
      vectorEffect: 'non-scaling-stroke',
    }

    if (element.type === 'line' || element.type === 'arrow') {
      const start = worldToScreen(element.start)
      const end = worldToScreen(element.end)
      return <line {...hitProps} x1={start.x} y1={start.y} x2={end.x} y2={end.y} strokeWidth="18" />
    }

    if (element.type === 'path') {
      const points = element.points.map(worldToScreen).map((point) => `${point.x},${point.y}`).join(' ')
      return <polyline {...hitProps} points={points} strokeWidth="18" />
    }

    if (element.type === 'function') {
      const segments = splitDrawableSegments(
        sampleFunction(element).map((point) =>
          point ? { x: point.x, y: point.y + (Number(element.yOffset) || 0) } : null,
        ),
      )
      return (
        <g>
          {segments.map((segment, index) => (
            <polyline
              key={`${element.id}-hit-${index}`}
              {...hitProps}
              points={segment.map(worldToScreen).map((point) => `${point.x},${point.y}`).join(' ')}
              strokeWidth="18"
            />
          ))}
        </g>
      )
    }

    if (element.type === 'rect') {
      const start = worldToScreen(element.start)
      const end = worldToScreen(element.end)
      return (
        <rect
          {...hitProps}
          x={Math.min(start.x, end.x) - 8}
          y={Math.min(start.y, end.y) - 8}
          width={Math.abs(end.x - start.x) + 16}
          height={Math.abs(end.y - start.y) + 16}
        />
      )
    }

    if (element.type === 'ellipse') {
      const center = worldToScreen({
        x: (element.start.x + element.end.x) / 2,
        y: (element.start.y + element.end.y) / 2,
      })
      return (
        <ellipse
          {...hitProps}
          cx={center.x}
          cy={center.y}
          rx={(Math.abs(element.end.x - element.start.x) * CANVAS.scale) / 2 + 8}
          ry={(Math.abs(element.end.y - element.start.y) * CANVAS.scale) / 2 + 8}
        />
      )
    }

    if (element.type === 'text') {
      const position = worldToScreen(element.position)
      const box = labelBoxForText(element.text)
      return (
        <rect
          {...hitProps}
          x={position.x - box.width / 2 - 8}
          y={position.y - box.height / 2 - 8}
          width={box.width + 16}
          height={box.height + 16}
        />
      )
    }

    if (element.type === 'diagram' || element.type === 'library') {
      const bounds = element.type === 'diagram' ? diagramBounds(element) : libraryBounds(element)
      const topLeft = worldToScreen({ x: bounds.minX, y: bounds.maxY })
      const bottomRight = worldToScreen({ x: bounds.maxX, y: bounds.minY })
      return (
        <rect
          {...hitProps}
          x={topLeft.x - 10}
          y={topLeft.y - 10}
          width={bottomRight.x - topLeft.x + 20}
          height={bottomRight.y - topLeft.y + 20}
        />
      )
    }

    return null
  }

  const renderElementShape = (element, halo = false) => {
    const stroke = halo ? '#6b7280' : element.stroke
    const strokeWidth = (halo ? element.width + 3 : element.width) * 1.05
    const fill = !halo && element.fill && element.fill !== 'none' ? element.fill : 'none'
    const common = {
      fill,
      fillOpacity: fill === 'none' ? undefined : element.fillOpacity ?? 0.18,
      stroke,
      strokeWidth,
      strokeDasharray: element.dashed && !halo ? '8 8' : undefined,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      opacity: halo ? 0.32 : 1,
      vectorEffect: 'non-scaling-stroke',
    }

    if (element.type === 'line') {
      const start = worldToScreen(element.start)
      const end = worldToScreen(element.end)
      return <line {...common} fill="none" x1={start.x} y1={start.y} x2={end.x} y2={end.y} />
    }

    if (element.type === 'arrow') {
      const start = worldToScreen(element.start)
      const end = worldToScreen(element.end)
      const style = element.arrowStyle ?? settings.arrowStyle
      return (
        <g>
          <line {...common} fill="none" x1={start.x} y1={start.y} x2={end.x} y2={end.y} />
          {renderArrowHead(end, start, style, stroke, halo)}
          {style === 'both' && renderArrowHead(start, end, style, stroke, halo)}
        </g>
      )
    }

    if (element.type === 'rect') {
      const start = worldToScreen(element.start)
      const end = worldToScreen(element.end)
      return (
        <rect
          {...common}
          x={Math.min(start.x, end.x)}
          y={Math.min(start.y, end.y)}
          width={Math.abs(end.x - start.x)}
          height={Math.abs(end.y - start.y)}
        />
      )
    }

    if (element.type === 'ellipse') {
      const center = worldToScreen({
        x: (element.start.x + element.end.x) / 2,
        y: (element.start.y + element.end.y) / 2,
      })
      return (
        <ellipse
          {...common}
          cx={center.x}
          cy={center.y}
          rx={(Math.abs(element.end.x - element.start.x) * CANVAS.scale) / 2}
          ry={(Math.abs(element.end.y - element.start.y) * CANVAS.scale) / 2}
        />
      )
    }

    if (element.type === 'path') {
      return renderPolyline(element.points, 'drawn-path', element, halo)
    }

    if (element.type === 'function') {
      const segments = splitDrawableSegments(
        sampleFunction(element).map((point) =>
          point ? { x: point.x, y: point.y + (Number(element.yOffset) || 0) } : null,
        ),
      )

      return (
        <g>
          {segments.map((segment, index) => (
            <polyline
              key={`${element.id}-segment-${index}`}
              points={segment.map(worldToScreen).map((point) => `${point.x},${point.y}`).join(' ')}
              fill="none"
              stroke={stroke}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={halo ? 0.26 : 1}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </g>
      )
    }

    if (element.type === 'text') {
      const position = worldToScreen(element.position)
      const box = labelBoxForText(element.text)
      if (halo) {
        return (
          <rect
            x={position.x - box.width / 2}
            y={position.y - box.height / 2}
            width={box.width}
            height={box.height}
            rx="0"
            fill="#6b7280"
            opacity="0.16"
          />
        )
      }

      return (
        <foreignObject
          x={position.x - box.width / 2}
          y={position.y - box.height / 2}
          width={box.width}
          height={box.height}
          className="canvas-label-object"
        >
          <div
            xmlns="http://www.w3.org/1999/xhtml"
            className="canvas-label"
            style={{
              color: element.stroke,
              background: colorWithOpacity(element.fill, element.fillOpacity ?? 0.18),
              opacity: 1,
            }}
            dangerouslySetInnerHTML={{ __html: renderInlineLatexHtml(element.text) }}
          />
        </foreignObject>
      )
    }

    if (element.type === 'diagram') {
      return renderDiagramShape(element, halo)
    }

    if (element.type === 'library') {
      return renderLibraryShape(element, halo)
    }

    return null
  }

  const gridLines = useMemo(() => {
    const lines = []
    for (let x = Math.ceil(worldBounds.minX); x <= Math.floor(worldBounds.maxX); x += 1) {
      const start = worldToScreen({ x, y: worldBounds.minY })
      const end = worldToScreen({ x, y: worldBounds.maxY })
      lines.push({ id: `x-${x}`, x1: start.x, y1: start.y, x2: end.x, y2: end.y, axis: x === 0 })
    }
    for (let y = Math.ceil(worldBounds.minY); y <= Math.floor(worldBounds.maxY); y += 1) {
      const start = worldToScreen({ x: worldBounds.minX, y })
      const end = worldToScreen({ x: worldBounds.maxX, y })
      lines.push({ id: `y-${y}`, x1: start.x, y1: start.y, x2: end.x, y2: end.y, axis: y === 0 })
    }
    return lines
  }, [])

  return (
    <main className="app-shell">
      <aside className="tool-rail" aria-label="Herramientas de dibujo">
        <div className="rail-mark">TZ</div>
        <div className="tool-stack">
          {toolMeta.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                className={`tool-button ${tool === item.id ? 'is-active' : ''}`}
                type="button"
                title={item.label}
                aria-label={item.label}
                onClick={() => setTool(item.id)}
              >
                <Icon size={20} strokeWidth={2.1} />
              </button>
            )
          })}
        </div>
        <div className="rail-actions">
          <button type="button" className="tool-button subtle" title="Deshacer" aria-label="Deshacer" onClick={undo} disabled={!past.length}>
            <RotateCcw size={19} />
          </button>
          <button type="button" className="tool-button subtle" title="Rehacer" aria-label="Rehacer" onClick={redo} disabled={!future.length}>
            <RotateCw size={19} />
          </button>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <input
            ref={importInputRef}
            className="hidden-file-input"
            type="file"
            accept="application/json,.json,.txt"
            onChange={importBoardState}
          />
          <div>
            <h1>TikZ Sketch Converter</h1>
            <p>
              Editor visual para convertir bocetos, funciones y diagramas en TikZ limpio para papers.
              <span className="byline">Made by Guillem Moreno Garcia</span>
            </p>
          </div>
          <div className="topbar-actions">
            <a
              className="ghost-button repo-link"
              href="https://github.com/unworthyzeus/tikz-sketch-converter"
              target="_blank"
              rel="noreferrer"
            >
              <GitBranch size={17} />
              GitHub
            </a>
            <button
              type="button"
              className={`ghost-button ${tool === 'erase' ? 'is-active' : ''}`}
              onClick={() => setTool((current) => (current === 'erase' ? 'select' : 'erase'))}
            >
              <Eraser size={17} />
              Borrador
            </button>
            <button type="button" className="ghost-button danger-action" onClick={clearBoard} disabled={!elements.length}>
              <Trash2 size={17} />
              Limpiar tablero
            </button>
            <button type="button" className="ghost-button" onClick={() => setSettings((state) => ({ ...state, grid: !state.grid }))}>
              <Grid3X3 size={17} />
              {settings.grid ? 'Ocultar grid' : 'Mostrar grid'}
            </button>
            <button type="button" className="ghost-button" onClick={downloadTikz}>
              <Download size={17} />
              Exportar .TeX
            </button>
            <button type="button" className="ghost-button" onClick={downloadCanvasPng}>
              <Download size={17} />
              Exportar PNG
            </button>
            <button type="button" className="primary-button" onClick={copyTikz}>
              <Copy size={17} />
              {copyLabel}
            </button>
          </div>
        </header>

        <div className="canvas-shell">
          <div className="canvas-viewport">
            <svg
              ref={svgRef}
              className={`sketch-canvas tool-${tool}`}
              viewBox={`0 0 ${CANVAS.width} ${CANVAS.height}`}
              role="img"
              aria-label="Lienzo de dibujo con coordenadas"
              style={{
                width: `${CANVAS.width * zoom}px`,
                height: `${CANVAS.height * zoom}px`,
              }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onDragOver={(event) => event.preventDefault()}
              onDrop={handlePaletteDrop}
            >
              <rect width={CANVAS.width} height={CANVAS.height} fill="#ffffff" />
              {settings.grid && (
                <g className="grid-layer">
                  {gridLines.map((line) => (
                    <line
                      key={line.id}
                      x1={line.x1}
                      y1={line.y1}
                      x2={line.x2}
                      y2={line.y2}
                      className={line.axis ? 'axis-line' : 'grid-line'}
                      vectorEffect="non-scaling-stroke"
                    />
                  ))}
                </g>
              )}
              <g>
                {elements.map((element) => (
                  <g
                    key={element.id}
                    className={`canvas-element ${selectedId === element.id ? 'is-selected' : ''}`}
                    onPointerDown={(event) => handleElementPointerDown(event, element)}
                  >
                    {renderElementHitTarget(element)}
                    {selectedId === element.id && renderElementShape(element, true)}
                    {renderElementShape(element)}
                  </g>
                ))}
              </g>
              {draft && <g className="draft-layer">{renderElementShape(draft)}</g>}
            </svg>
          </div>
          <div className="canvas-zoom-controls" aria-label="Zoom de lienzo">
            <button type="button" className="zoom-button" title="Alejar" aria-label="Alejar" onClick={() => setCanvasZoom(zoom - 0.1)}>
              <ZoomOut size={16} />
            </button>
            <span className="zoom-readout">{Math.round(zoom * 100)}%</span>
            <button type="button" className="zoom-button" title="Acercar" aria-label="Acercar" onClick={() => setCanvasZoom(zoom + 0.1)}>
              <ZoomIn size={16} />
            </button>
            <button type="button" className="zoom-button" title="Restaurar zoom" aria-label="Restaurar zoom" onClick={() => setCanvasZoom(1)}>
              <Maximize2 size={16} />
            </button>
          </div>
        </div>

        <footer className="status-strip">
          <span>{elements.length} elementos</span>
          <span>{selectedElement ? elementLabel(selectedElement) : 'Sin seleccion'}</span>
          <span>x {formatNumber(mouseWorld.x)} - y {formatNumber(mouseWorld.y)}</span>
          <span>{settings.snap ? `Snap ${SNAP_STEP}` : 'Snap libre'}</span>
        </footer>
      </section>

      <aside className="inspector">
        <section className="panel-section compact">
          <div className="panel-title">
            <Layers size={18} />
            <h2>Estilo</h2>
          </div>
          <div className="color-group">
            <span className="color-label">Borde / trazo</span>
            <div className="color-row" aria-label="Color de trazo">
              {strokeColors.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  className={`swatch ${((selectedElement?.stroke ?? settings.stroke) === color.value) ? 'is-active' : ''}`}
                  title={color.label}
                  style={{ '--swatch': color.value }}
                  onClick={() => {
                    setSettings((state) => ({ ...state, stroke: color.value }))
                    updateSelected({ stroke: color.value })
                  }}
                />
              ))}
            </div>
          </div>
          <div className="color-group">
            <span className="color-label">Relleno</span>
            <div className="color-row" aria-label="Color de relleno">
              {fillColors.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  className={`swatch ${color.value === 'none' ? 'is-none' : ''} ${((selectedElement?.fill ?? settings.fill) === color.value) ? 'is-active' : ''}`}
                  title={color.label}
                  style={{ '--swatch': color.value === 'none' ? '#ffffff' : color.value }}
                  onClick={() => {
                    setSettings((state) => ({ ...state, fill: color.value }))
                    updateSelected({ fill: color.value })
                  }}
                />
              ))}
            </div>
          </div>
          <label className="field">
            <span>Opacidad relleno</span>
            <input
              type="range"
              min="0.05"
              max="1"
              step="0.05"
              value={selectedElement?.fillOpacity ?? settings.fillOpacity}
              onChange={(event) => {
                const fillOpacity = Number(event.target.value)
                setSettings((state) => ({ ...state, fillOpacity }))
                updateSelected({ fillOpacity })
              }}
            />
          </label>
          <label className="field">
            <span>Grosor</span>
            <input
              type="range"
              min="0.4"
              max="3"
              step="0.1"
              value={selectedElement?.width ?? settings.width}
              onChange={(event) => {
                const width = Number(event.target.value)
                setSettings((state) => ({ ...state, width }))
                updateSelected({ width })
              }}
            />
          </label>
          <label className="field">
            <span>Tipo de flecha</span>
            <select
              value={selectedElement?.type === 'arrow' ? selectedElement.arrowStyle ?? settings.arrowStyle : settings.arrowStyle}
              onChange={(event) => {
                setSettings((state) => ({ ...state, arrowStyle: event.target.value }))
                if (selectedElement?.type === 'arrow') updateSelected({ arrowStyle: event.target.value })
              }}
            >
              {arrowStyleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <button type="button" className="ghost-button full" onClick={() => setTool('arrow')}>
            <ArrowRight size={17} />
            Anadir flecha
          </button>
          <label className="field">
            <span>Escala objetos</span>
            <input
              type="range"
              min="0.4"
              max="2.2"
              step="0.05"
              value={selectedElement?.type === 'diagram' || selectedElement?.type === 'library' ? selectedElement.scale ?? 1 : settings.objectScale}
              onChange={(event) => {
                const objectScale = Number(event.target.value)
                setSettings((state) => ({ ...state, objectScale }))
                if (selectedElement?.type === 'diagram' || selectedElement?.type === 'library') {
                  updateSelected({ scale: objectScale })
                }
              }}
            />
          </label>
          <label className="field">
            <span>Opciones TikZ</span>
            <input
              type="text"
              value={selectedElement?.tikzOptions ?? settings.tikzOptions}
              onChange={(event) => {
                setSettings((state) => ({ ...state, tikzOptions: event.target.value }))
                updateSelected({ tikzOptions: event.target.value })
              }}
              placeholder="rounded corners=2pt, opacity=.9..."
            />
          </label>
          <div className="toggle-grid">
            <label className="toggle">
              <input
                type="checkbox"
                checked={selectedElement?.dashed ?? settings.dashed}
                onChange={(event) => {
                  setSettings((state) => ({ ...state, dashed: event.target.checked }))
                  updateSelected({ dashed: event.target.checked })
                }}
              />
              <span>Discontinua</span>
            </label>
            <label className="toggle">
              <input
                type="checkbox"
                checked={settings.snap}
                onChange={(event) => setSettings((state) => ({ ...state, snap: event.target.checked }))}
              />
              <span>Ajustar</span>
            </label>
          </div>
        </section>

        <section className="panel-section">
          <div className="panel-title">
            <Sigma size={18} />
            <h2>Funcion</h2>
          </div>
          <label className="field">
            <span>f(x)</span>
            <input
              type="text"
              value={functionDraft.expression}
              onChange={(event) => setFunctionDraft((state) => ({ ...state, expression: event.target.value }))}
              placeholder="sin(x), max(x,0), besselj0(x)"
            />
          </label>
          <div className="field-pair">
            <label className="field">
              <span>Desde</span>
              <input
                type="number"
                value={functionDraft.domainStart}
                onChange={(event) => setFunctionDraft((state) => ({ ...state, domainStart: event.target.value }))}
              />
            </label>
            <label className="field">
              <span>Hasta</span>
              <input
                type="number"
                value={functionDraft.domainEnd}
                onChange={(event) => setFunctionDraft((state) => ({ ...state, domainEnd: event.target.value }))}
              />
            </label>
          </div>
          <label className="field">
            <span>Muestras</span>
            <input
              type="number"
              min="8"
              max="400"
              value={functionDraft.samples}
              onChange={(event) => setFunctionDraft((state) => ({ ...state, samples: event.target.value }))}
            />
          </label>
          {functionError && <p className="form-error">{functionError}</p>}
          <div className="example-row">
            {['sin(x)', 'max(x, 0)', 'min(sin(x), 0.5)', 'besselj0(x)', 'sinc(x)', 'erf(x)'].map((expression) => (
              <button
                key={expression}
                type="button"
                className="chip-button"
                onClick={() => setFunctionDraft((state) => ({ ...state, expression }))}
              >
                {expression}
              </button>
            ))}
          </div>
          <button type="button" className="primary-button full" onClick={addFunction}>
            <Sigma size={17} />
            Anadir funcion
          </button>
        </section>

        <section className="panel-section symbol-section">
          <div className="panel-title">
            <Type size={18} />
            <h2>Etiqueta y simbolos</h2>
          </div>
          <label className="field">
            <span>{selectedElement?.type === 'text' ? 'Texto seleccionado' : 'Texto para nueva etiqueta'}</span>
            <input type="text" value={activeLabelText} onChange={(event) => updateLabelText(event.target.value)} />
          </label>
          <button type="button" className="ghost-button full" onClick={() => setSymbolsOpen((value) => !value)}>
            <Sigma size={17} />
            {symbolsOpen ? 'Cerrar simbolos LaTeX' : 'Abrir simbolos LaTeX'}
          </button>
          {symbolsOpen && (
            <div className="symbol-picker">
              <label className="field">
                <span>Buscar simbolo</span>
                <input
                  type="search"
                  value={symbolSearch}
                  onChange={(event) => setSymbolSearch(event.target.value)}
                  placeholder="alpha, subset, arrow, integral..."
                />
              </label>
              <div className="symbol-count">{visibleLatexSymbols.length} simbolos</div>
              <div className="symbol-grid">
                {visibleLatexSymbols.map((symbol) => (
                  <button
                    key={`${symbol.group}-${symbol.value}`}
                    type="button"
                    className="symbol-button"
                    title={`${symbol.label} ${symbol.value.replace('__BASE__', '□')}`}
                    onClick={() => insertLatexSymbol(symbol)}
                  >
                    <span>{symbol.label}</span>
                    <small>{symbol.value.replace('__BASE__', '□')}</small>
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="panel-section">
          <div className="panel-title">
            <CircuitBoard size={18} />
            <h2>Diagramas</h2>
          </div>
          <div className="preset-grid">
            {diagramPresets.map((preset) => {
              const Icon = preset.icon
              return (
                <button key={preset.kind} type="button" className="preset-button" onClick={() => addDiagramPreset(preset)}>
                  <Icon size={17} />
                  <span>
                    <strong>{preset.title}</strong>
                    <small>{preset.description}</small>
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        <section className="panel-section library-section">
          <div className="panel-title">
            <Code2 size={18} />
            <h2>Objetos TikZ</h2>
          </div>
          <label className="field">
            <span>Buscar objeto o simbolo</span>
            <input
              type="search"
              value={librarySearch}
              onChange={(event) => setLibrarySearch(event.target.value)}
              placeholder="resistor, axis, estado, matrix..."
            />
          </label>
          <div className="library-filter-row" aria-label="Filtrar objetos TikZ">
            {paletteGroups.map((group) => (
              <button
                key={group}
                type="button"
                className={`filter-chip ${libraryGroup === group ? 'is-active' : ''}`}
                onClick={() => setLibraryGroup(group)}
              >
                {group}
              </button>
            ))}
          </div>
          <div className="library-grid">
            {visiblePaletteItems.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className="library-button"
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.effectAllowed = 'copy'
                  event.dataTransfer.setData('application/x-tikz-palette-item', preset.id)
                }}
                onClick={() => addLibraryPreset(preset)}
              >
                <strong>{preset.title}</strong>
                <span>{preset.group}</span>
                <small>{preset.description}</small>
              </button>
            ))}
          </div>
          <details className="custom-snippet">
            <summary>Custom TikZ snippet</summary>
            <label className="field">
              <span>Titulo</span>
              <input
                type="text"
                value={customLibrary.title}
                onChange={(event) => setCustomLibrary((state) => ({ ...state, title: event.target.value }))}
              />
            </label>
            <label className="field">
              <span>Paquetes</span>
              <input
                type="text"
                value={customLibrary.packages}
                onChange={(event) => setCustomLibrary((state) => ({ ...state, packages: event.target.value }))}
              />
            </label>
            <label className="field">
              <span>Librerias TikZ</span>
              <input
                type="text"
                value={customLibrary.libraries}
                onChange={(event) => setCustomLibrary((state) => ({ ...state, libraries: event.target.value }))}
              />
            </label>
            <label className="field">
              <span>Snippet</span>
              <textarea
                className="snippet-input"
                value={customLibrary.snippet}
                onChange={(event) => setCustomLibrary((state) => ({ ...state, snippet: event.target.value }))}
                spellCheck="false"
              />
            </label>
            <button type="button" className="ghost-button full" onClick={addCustomLibrary}>
              Add custom block
            </button>
          </details>
        </section>

        <section className="panel-section grow">
          <div className="panel-title">
            <Sparkles size={18} />
            <h2>Seleccion</h2>
          </div>
          {!selectedElement && <p className="empty-state">Selecciona un elemento del lienzo para editarlo o convertir trazos a figuras.</p>}
          {selectedElement && (
            <div className="selection-editor">
              <div className="selected-heading">
                <span>{elementLabel(selectedElement)}</span>
                <button type="button" className="icon-danger" title="Eliminar" aria-label="Eliminar seleccionado" onClick={deleteSelected}>
                  <Trash2 size={17} />
                </button>
              </div>
              {selectedElement.type === 'text' && (
                <>
                  <label className="field">
                    <span>Texto</span>
                    <input type="text" value={selectedElement.text} onChange={(event) => updateSelected({ text: event.target.value })} />
                  </label>
                  <div className="field-pair">
                    <label className="field">
                      <span>Posicion x</span>
                      <input
                        type="number"
                        step="0.25"
                        value={selectedElement.position.x}
                        onChange={(event) => updateSelected({ position: { ...selectedElement.position, x: Number(event.target.value) } })}
                      />
                    </label>
                    <label className="field">
                      <span>Posicion y</span>
                      <input
                        type="number"
                        step="0.25"
                        value={selectedElement.position.y}
                        onChange={(event) => updateSelected({ position: { ...selectedElement.position, y: Number(event.target.value) } })}
                      />
                    </label>
                  </div>
                </>
              )}
              {['line', 'arrow', 'rect', 'ellipse'].includes(selectedElement.type) && (
                <>
                  <div className="field-pair">
                    <label className="field">
                      <span>Inicio x</span>
                      <input
                        type="number"
                        step="0.25"
                        value={selectedElement.start.x}
                        onChange={(event) => updateSelected({ start: { ...selectedElement.start, x: Number(event.target.value) } })}
                      />
                    </label>
                    <label className="field">
                      <span>Inicio y</span>
                      <input
                        type="number"
                        step="0.25"
                        value={selectedElement.start.y}
                        onChange={(event) => updateSelected({ start: { ...selectedElement.start, y: Number(event.target.value) } })}
                      />
                    </label>
                  </div>
                  <div className="field-pair">
                    <label className="field">
                      <span>Fin x</span>
                      <input
                        type="number"
                        step="0.25"
                        value={selectedElement.end.x}
                        onChange={(event) => updateSelected({ end: { ...selectedElement.end, x: Number(event.target.value) } })}
                      />
                    </label>
                    <label className="field">
                      <span>Fin y</span>
                      <input
                        type="number"
                        step="0.25"
                        value={selectedElement.end.y}
                        onChange={(event) => updateSelected({ end: { ...selectedElement.end, y: Number(event.target.value) } })}
                      />
                    </label>
                  </div>
                </>
              )}
              {selectedElement.type === 'function' && (
                <>
                  <label className="field">
                    <span>Expresion</span>
                    <input
                      type="text"
                      value={selectedElement.expression}
                      onChange={(event) => updateSelected({ expression: event.target.value })}
                    />
                  </label>
                  <div className="field-pair">
                    <label className="field">
                      <span>Dominio min</span>
                      <input
                        type="number"
                        value={selectedElement.domainStart}
                        onChange={(event) => updateSelected({ domainStart: Number(event.target.value) })}
                      />
                    </label>
                    <label className="field">
                      <span>Dominio max</span>
                      <input
                        type="number"
                        value={selectedElement.domainEnd}
                        onChange={(event) => updateSelected({ domainEnd: Number(event.target.value) })}
                      />
                    </label>
                  </div>
                  <label className="field">
                    <span>Desplazar y</span>
                    <input
                      type="number"
                      step="0.25"
                      value={selectedElement.yOffset ?? 0}
                      onChange={(event) => updateSelected({ yOffset: Number(event.target.value) })}
                    />
                  </label>
                  <label className="field">
                    <span>Muestras</span>
                    <input
                      type="number"
                      min="8"
                      max="400"
                      value={selectedElement.samples ?? 120}
                      onChange={(event) => updateSelected({ samples: Number(event.target.value) })}
                    />
                  </label>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={selectedElement.smooth ?? true}
                      onChange={(event) => updateSelected({ smooth: event.target.checked })}
                    />
                    <span>Suavizar curva</span>
                  </label>
                </>
              )}
              {(selectedElement.type === 'diagram' || selectedElement.type === 'library') && (
                <>
                  {selectedElement.type === 'library' && (
                    <p className="selection-note">
                      {getLibraryPreset(selectedElement).group} - {getLibraryPreset(selectedElement).packages?.join(', ') || '\\usepackage{tikz}'}
                    </p>
                  )}
                  <label className="field">
                    <span>Titulo</span>
                    <input type="text" value={selectedElement.title} onChange={(event) => updateSelected({ title: event.target.value })} />
                  </label>
                  <div className="field-pair">
                    <label className="field">
                      <span>Origen x</span>
                      <input
                        type="number"
                        step="0.25"
                        value={selectedElement.origin.x}
                        onChange={(event) =>
                          updateSelected({ origin: { ...selectedElement.origin, x: Number(event.target.value) } })
                        }
                      />
                    </label>
                    <label className="field">
                      <span>Origen y</span>
                      <input
                        type="number"
                        step="0.25"
                        value={selectedElement.origin.y}
                        onChange={(event) =>
                          updateSelected({ origin: { ...selectedElement.origin, y: Number(event.target.value) } })
                        }
                      />
                    </label>
                  </div>
                  <label className="field">
                    <span>Escala</span>
                    <input
                      type="number"
                      min="0.4"
                      max="2.2"
                      step="0.05"
                      value={selectedElement.scale ?? 1}
                      onChange={(event) => updateSelected({ scale: Number(event.target.value) })}
                    />
                  </label>
                  {selectedLibraryConfig && (
                    <div className="object-config">
                      <div className="field-pair">
                        <label className="field">
                          <span>Ancho</span>
                          <input
                            type="number"
                            min="0.35"
                            max="4"
                            step="0.05"
                            value={selectedLibraryConfig.stretchX}
                            onChange={(event) => updateSelectedLibraryConfig({ stretchX: Number(event.target.value) })}
                          />
                        </label>
                        <label className="field">
                          <span>Alto</span>
                          <input
                            type="number"
                            min="0.35"
                            max="4"
                            step="0.05"
                            value={selectedLibraryConfig.stretchY}
                            onChange={(event) => updateSelectedLibraryConfig({ stretchY: Number(event.target.value) })}
                          />
                        </label>
                      </div>
                      <label className="field">
                        <span>Etiqueta interna</span>
                        <input
                          type="text"
                          value={selectedLibraryConfig.label}
                          onChange={(event) => updateSelectedLibraryConfig({ label: event.target.value })}
                        />
                      </label>
                      <div className="field-pair">
                        <label className="field">
                          <span>Nodos extra</span>
                          <input
                            type="number"
                            min="0"
                            max="8"
                            step="1"
                            value={selectedLibraryConfig.extraNodes}
                            onChange={(event) => updateSelectedLibraryConfig({ extraNodes: Number(event.target.value) })}
                          />
                        </label>
                        <label className="field">
                          <span>Separacion</span>
                          <input
                            type="number"
                            min="0.25"
                            max="3"
                            step="0.05"
                            value={selectedLibraryConfig.nodeSpacing}
                            onChange={(event) => updateSelectedLibraryConfig({ nodeSpacing: Number(event.target.value) })}
                          />
                        </label>
                      </div>
                      <div className="field-pair">
                        <label className="field">
                          <span>Direccion</span>
                          <select
                            value={selectedLibraryConfig.nodeDirection}
                            onChange={(event) => updateSelectedLibraryConfig({ nodeDirection: event.target.value })}
                          >
                            <option value="right">Derecha</option>
                            <option value="left">Izquierda</option>
                            <option value="down">Abajo</option>
                            <option value="up">Arriba</option>
                          </select>
                        </label>
                        <label className="field">
                          <span>Forma nodo</span>
                          <select
                            value={selectedLibraryConfig.nodeShape}
                            onChange={(event) => updateSelectedLibraryConfig({ nodeShape: event.target.value })}
                          >
                            {libraryNodeShapeOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                      <label className="field">
                        <span>Textos nodos</span>
                        <input
                          type="text"
                          value={selectedLibraryConfig.nodeLabels}
                          onChange={(event) => updateSelectedLibraryConfig({ nodeLabels: event.target.value })}
                        />
                      </label>
                      <label className="toggle">
                        <input
                          type="checkbox"
                          checked={selectedLibraryConfig.connectNodes}
                          onChange={(event) => updateSelectedLibraryConfig({ connectNodes: event.target.checked })}
                        />
                        <span>Conectar nodos extra</span>
                      </label>
                      {getLibraryPreset(selectedElement).id.includes('callout') && (
                        <div className="field-pair">
                          <label className="field">
                            <span>Puntero x</span>
                            <input
                              type="number"
                              step="0.05"
                              value={selectedLibraryConfig.calloutPointerX}
                              onChange={(event) => updateSelectedLibraryConfig({ calloutPointerX: Number(event.target.value) })}
                            />
                          </label>
                          <label className="field">
                            <span>Puntero y</span>
                            <input
                              type="number"
                              step="0.05"
                              value={selectedLibraryConfig.calloutPointerY}
                              onChange={(event) => updateSelectedLibraryConfig({ calloutPointerY: Number(event.target.value) })}
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
              {selectedElement.type !== 'function' && (
                <label className="field">
                  <span>Opciones TikZ del objeto</span>
                  <input
                    type="text"
                    value={selectedElement.tikzOptions ?? ''}
                    onChange={(event) => updateSelected({ tikzOptions: event.target.value })}
                    placeholder="draw opacity=.8, rounded corners=1pt..."
                  />
                </label>
              )}
              {selectedElement.type === 'path' && (
                <button type="button" className="ghost-button full" onClick={recognizeSelectedPath}>
                  <Sparkles size={17} />
                  Reconocer trazo
                </button>
              )}
            </div>
          )}
        </section>

        <section className="panel-section export-section">
          <div className="panel-title">
            <Code2 size={18} />
            <h2>Codigo TikZ</h2>
          </div>
          <label className="toggle export-toggle">
            <input
              type="checkbox"
              checked={settings.exportGrid}
              onChange={(event) => setSettings((state) => ({ ...state, exportGrid: event.target.checked }))}
            />
            <span>Exportar ejes de referencia</span>
          </label>
          <label className="toggle export-toggle">
            <input
              type="checkbox"
              checked={settings.monochromeExport}
              onChange={(event) => setSettings((state) => ({ ...state, monochromeExport: event.target.checked }))}
            />
            <span>Salida monocroma</span>
          </label>
          <label className="toggle export-toggle">
            <input
              type="checkbox"
              checked={settings.wrapFigure}
              onChange={(event) => setSettings((state) => ({ ...state, wrapFigure: event.target.checked }))}
            />
            <span>Envolver en figure</span>
          </label>
          {settings.wrapFigure && (
            <div className="field-pair">
              <label className="field">
                <span>Caption</span>
                <input
                  type="text"
                  value={settings.caption}
                  onChange={(event) => setSettings((state) => ({ ...state, caption: event.target.value }))}
                />
              </label>
              <label className="field">
                <span>Label</span>
                <input
                  type="text"
                  value={settings.label}
                  onChange={(event) => setSettings((state) => ({ ...state, label: event.target.value }))}
                />
              </label>
            </div>
          )}
          <textarea className="code-output" value={tikzCode} readOnly spellCheck="false" />
          <div className="export-actions">
            <button type="button" className="ghost-button" onClick={restoreDemo}>
              Restaurar demo
            </button>
            <button type="button" className="ghost-button" onClick={() => importInputRef.current?.click()}>
              <Upload size={17} />
              Importar JSON
            </button>
            <button type="button" className="ghost-button" onClick={downloadBoardState}>
              <Download size={17} />
              Guardar JSON
            </button>
            <button type="button" className="ghost-button" onClick={downloadCanvasPng}>
              <Download size={17} />
              Exportar PNG
            </button>
            <button type="button" className="ghost-button danger-action" onClick={clearBoard} disabled={!elements.length}>
              <Trash2 size={17} />
              Limpiar tablero
            </button>
            <button type="button" className="primary-button" onClick={downloadTikz}>
              <Download size={17} />
              Exportar .TeX
            </button>
          </div>
        </section>
      </aside>
    </main>
  )
}

export default App
