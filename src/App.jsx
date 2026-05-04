import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowRight,
  BookOpen,
  BrainCircuit,
  CalendarDays,
  Circle,
  Code2,
  Copy,
  CopyPlus,
  CircuitBoard,
  Download,
  Eraser,
  Files,
  Grid3X3,
  GitBranch,
  Layers,
  Link,
  Minus,
  Moon,
  MousePointer2,
  Move,
  PenLine,
  RotateCcw,
  RotateCw,
  Settings,
  Sigma,
  Sparkles,
  Square,
  Sun,
  Trash2,
  Type,
  Upload,
  Workflow,
  X,
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
  { id: 'pan', label: 'Mover lienzo', icon: Move },
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

const defaultEditorSettings = {
  stroke: '#111111',
  fill: 'none',
  fillOpacity: 0.18,
  width: 0.8,
  dashed: false,
  smooth: true,
  snap: true,
  terminalSnap: true,
  routeWires: true,
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
  exportPreset: 'figure',
  exportScale: 2,
  exportTransparent: false,
  exportCrop: false,
  exportMargin: 24,
  paperSize: 'content',
  journalStyle: 'ieee',
  routeMode: 'manhattan',
  autosave: true,
  warnMissingLibraries: true,
}

const defaultFunctionOptions = {
  showXIntercepts: false,
  showYIntercept: false,
  showExtrema: false,
  showSamples: false,
  showTangent: false,
  showAsymptotes: false,
  usePgfplots: false,
  axisType: 'axis',
  xLabel: '$x$',
  yLabel: '$f(x)$',
  legend: '',
  markerStyle: 'none',
  gridStyle: 'major',
  xTicks: '',
  yTicks: '',
  tickLabelStyle: 'font=\\scriptsize',
  legendPos: 'north east',
  colormap: '',
  errorBars: false,
  errorBarOptions: '/pgfplots/error bars/y dir=both, /pgfplots/error bars/y explicit',
  clip: true,
  logX: false,
  logY: false,
  dataTable: '',
  axisOptions: '',
  plotOptions: 'line width=0.75pt',
}

const exportPresetOptions = [
  { value: 'figure', label: 'Figure environment' },
  { value: 'standalone', label: 'Standalone LaTeX' },
  { value: 'beamer', label: 'Beamer frame' },
  { value: 'snippet', label: 'Clipboard snippet' },
]

const journalStyleOptions = [
  { value: 'ieee', label: 'IEEE compact' },
  { value: 'nature', label: 'Nature monochrome' },
  { value: 'thesis', label: 'Thesis' },
  { value: 'slides', label: 'Slides' },
]

const routeModeOptions = [
  { value: 'straight', label: 'Straight' },
  { value: 'manhattan', label: 'Manhattan' },
  { value: 'stepped', label: 'Stepped' },
  { value: 'bus', label: 'Bus' },
  { value: 'avoid', label: 'Avoid objects' },
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

const circuitAutoPrefixes = {
  'current source': 'I',
  ammeter: 'A',
  voltmeter: 'V',
  resistor: 'R',
  capacitor: 'C',
  inductor: 'L',
  diode: 'D',
  led: 'D',
  zener: 'D',
  battery: 'V',
  source: 'V',
  opamp: 'U',
  transistor: 'Q',
  mos: 'M',
}

function circuitAutoPrefix(preset = {}) {
  if (preset.group !== 'Circuit') return ''
  const key = `${preset.id ?? ''} ${preset.title ?? ''}`.toLowerCase()
  return Object.entries(circuitAutoPrefixes).find(([needle]) => key.includes(needle))?.[1] ?? 'X'
}

function circuitTikzComponent(preset = {}, config = {}) {
  const key = `${preset.id ?? ''} ${preset.title ?? ''}`.toLowerCase()
  const style = config.circuitStyle
  if (key.includes('resistor')) return style === 'american' ? 'R' : 'R'
  if (key.includes('capacitor')) return 'C'
  if (key.includes('inductor')) return 'L'
  if (key.includes('zener')) return 'zD'
  if (key.includes('led')) return 'led'
  if (key.includes('diode')) return 'D'
  if (key.includes('controlled voltage') || key.includes('vcvs')) return 'cV'
  if (key.includes('current source')) return 'I'
  if (key.includes('battery')) return 'battery1'
  if (key.includes('voltmeter')) return 'voltmeter'
  if (key.includes('ammeter')) return 'ammeter'
  if (key.includes('switch')) return key.includes('spst') ? 'ospst' : 'normal open switch'
  if (key.includes('transmission')) return 'tline'
  if (key.includes('port')) return 'generic'
  if (key.includes('lamp')) return 'lamp'
  if (key.includes('source')) return 'V'
  return ''
}

function circuitPreviewKind(preset = {}) {
  if (preset.group !== 'Circuit') return ''
  const key = `${preset.id ?? ''} ${preset.title ?? ''} ${preset.description ?? ''}`.toLowerCase()
  if (key.includes('differential-pair') || key.includes('differential pair')) return 'differential-pair'
  if (key.includes('nmos')) return 'nmos'
  if (key.includes('pmos')) return 'pmos'
  if (key.includes('pnp')) return 'pnp'
  if (key.includes('npn') || key.includes('bjt')) return 'npn'
  if (key.includes('op-amp') || key.includes('op amp') || key.includes('opamp')) return 'opamp'
  if (key.includes('transformer')) return 'transformer'
  if (key.includes('transmission') || key.includes('tline')) return 'transmission-line'
  if (key.includes('switch')) return 'switch'
  if (key.includes('voltmeter')) return 'voltmeter'
  if (key.includes('ammeter')) return 'ammeter'
  if (key.includes('differential probe')) return 'diff-probe'
  if (key.includes('controlled') || key.includes('vcvs')) return 'controlled-source'
  if (key.includes('current source')) return 'current-source'
  if (key.includes('battery')) return 'battery'
  if (key.includes('port')) return 'port'
  if (key.includes('lamp')) return 'lamp'
  if (key.includes('zener')) return 'zener'
  if (key.includes('led')) return 'led'
  if (key.includes('diode')) return 'diode'
  if (key.includes('capacitor')) return 'capacitor'
  if (key.includes('inductor')) return 'inductor'
  if (key.includes('resistor')) return 'resistor'
  return preset.preview === 'circuit' ? 'circuit' : ''
}

function circuitEndPoint(config = {}) {
  const length = Math.max(0.55, Math.min(5, Number(config.terminalLength) || 2.2))
  const vectors = {
    right: { x: length, y: 0 },
    left: { x: -length, y: 0 },
    up: { x: 0, y: length },
    down: { x: 0, y: -length },
  }
  return vectors[config.circuitOrientation] ?? vectors.right
}

function circuitTerminalOption(style) {
  const options = {
    filled: '*-*',
    open: 'o-o',
    mixed: 'o-*',
  }
  return options[style] ?? ''
}

function renumberCircuitLabels(elements) {
  const counts = new Map()
  return elements.map((element) => {
    if (element.type !== 'library') return element
    const preset = getLibraryPreset(element)
    const prefix = circuitAutoPrefix(preset)
    const config = getLibraryConfig(element, preset)
    if (!prefix || !config.autoLabel) return element
    const nextCount = (counts.get(prefix) ?? 0) + 1
    counts.set(prefix, nextCount)
    return {
      ...element,
      config: {
        ...element.config,
        circuitLabel: `${prefix}_${nextCount}`,
      },
    }
  })
}

function defaultLibraryConfig(preset = {}) {
  const circuitPrefix = circuitAutoPrefix(preset)
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
    circuitValue: '',
    circuitLabel: circuitPrefix ? `${circuitPrefix}_1` : preset.title ?? 'Object',
    circuitOrientation: 'right',
    circuitStyle: 'auto',
    terminalStyle: 'none',
    terminalLength: 2.2,
    autoLabel: Boolean(circuitPrefix),
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
    circuitOrientation: ['right', 'left', 'up', 'down'].includes(config.circuitOrientation)
      ? config.circuitOrientation
      : 'right',
    circuitStyle: ['auto', 'iec', 'american'].includes(config.circuitStyle) ? config.circuitStyle : 'auto',
    terminalStyle: ['none', 'filled', 'open', 'mixed'].includes(config.terminalStyle) ? config.terminalStyle : 'none',
    terminalLength: Math.max(0.55, Math.min(5, Number(config.terminalLength) || 2.2)),
    autoLabel: Boolean(config.autoLabel),
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

function crc32(bytes) {
  let crc = 0xffffffff
  for (const byte of bytes) {
    crc ^= byte
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0)
    }
  }
  return (crc ^ 0xffffffff) >>> 0
}

function createZipBlob(files) {
  const encoder = new TextEncoder()
  const chunks = []
  const centralDirectory = []
  let offset = 0
  const pushNumber = (target, value, bytes) => {
    for (let index = 0; index < bytes; index += 1) target.push((value >>> (index * 8)) & 0xff)
  }
  const pushBytes = (target, bytes) => {
    bytes.forEach((byte) => target.push(byte))
  }

  files.forEach((file) => {
    const nameBytes = encoder.encode(file.name.replace(/\\/g, '/'))
    const contentBytes = typeof file.content === 'string' ? encoder.encode(file.content) : file.content
    const checksum = crc32(contentBytes)
    const localHeader = []
    pushNumber(localHeader, 0x04034b50, 4)
    pushNumber(localHeader, 20, 2)
    pushNumber(localHeader, 0x0800, 2)
    pushNumber(localHeader, 0, 2)
    pushNumber(localHeader, 0, 2)
    pushNumber(localHeader, 0x5a21, 2)
    pushNumber(localHeader, checksum, 4)
    pushNumber(localHeader, contentBytes.length, 4)
    pushNumber(localHeader, contentBytes.length, 4)
    pushNumber(localHeader, nameBytes.length, 2)
    pushNumber(localHeader, 0, 2)
    pushBytes(localHeader, nameBytes)

    const centralHeader = []
    pushNumber(centralHeader, 0x02014b50, 4)
    pushNumber(centralHeader, 20, 2)
    pushNumber(centralHeader, 20, 2)
    pushNumber(centralHeader, 0x0800, 2)
    pushNumber(centralHeader, 0, 2)
    pushNumber(centralHeader, 0, 2)
    pushNumber(centralHeader, 0x5a21, 2)
    pushNumber(centralHeader, checksum, 4)
    pushNumber(centralHeader, contentBytes.length, 4)
    pushNumber(centralHeader, contentBytes.length, 4)
    pushNumber(centralHeader, nameBytes.length, 2)
    pushNumber(centralHeader, 0, 2)
    pushNumber(centralHeader, 0, 2)
    pushNumber(centralHeader, 0, 2)
    pushNumber(centralHeader, 0, 2)
    pushNumber(centralHeader, 0, 4)
    pushNumber(centralHeader, offset, 4)
    pushBytes(centralHeader, nameBytes)

    chunks.push(Uint8Array.from(localHeader), contentBytes)
    centralDirectory.push(Uint8Array.from(centralHeader))
    offset += localHeader.length + contentBytes.length
  })

  const centralStart = offset
  centralDirectory.forEach((chunk) => {
    chunks.push(chunk)
    offset += chunk.length
  })

  const end = []
  pushNumber(end, 0x06054b50, 4)
  pushNumber(end, 0, 2)
  pushNumber(end, 0, 2)
  pushNumber(end, files.length, 2)
  pushNumber(end, files.length, 2)
  pushNumber(end, offset - centralStart, 4)
  pushNumber(end, centralStart, 4)
  pushNumber(end, 0, 2)
  chunks.push(Uint8Array.from(end))

  return new Blob(chunks, { type: 'application/zip' })
}

function encodeBoardPayload(payload) {
  const bytes = new TextEncoder().encode(JSON.stringify(payload))
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function decodeBoardPayload(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
  const binary = atob(padded)
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  return JSON.parse(new TextDecoder().decode(bytes))
}

function readInitialSharedBoard() {
  if (typeof window === 'undefined') return null
  const encoded = window.location.hash.match(/^#board=(.+)$/)?.[1]
  if (!encoded) return null

  try {
    const payload = decodeBoardPayload(encoded)
    const nextElements = Array.isArray(payload) ? payload : payload.elements
    if (!Array.isArray(nextElements)) return null
    return {
      elements: nextElements,
      settings: payload.settings && typeof payload.settings === 'object' ? payload.settings : null,
      theme: payload.theme === 'dark' || payload.theme === 'light' ? payload.theme : 'light',
      viewport: payload.viewport && typeof payload.viewport === 'object' ? payload.viewport : null,
    }
  } catch {
    return null
  }
}

function cloneElementForPaste(element, offset = { x: 0.6, y: -0.6 }) {
  const clone = JSON.parse(JSON.stringify(element))
  clone.id = createId()
  return moveElement(clone, offset.x, offset.y)
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

function functionOptionsFor(element) {
  return { ...defaultFunctionOptions, ...(element.functionOptions ?? {}) }
}

function parsedDataTablePoints(value = '') {
  return `${value}`
    .split(/\n|;/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [x, y] = line.split(/[,\s]+/).map(Number)
      return Number.isFinite(x) && Number.isFinite(y) ? { x, y } : null
    })
    .filter(Boolean)
}

function functionDisplayPoints(element) {
  const dataPoints = parsedDataTablePoints(functionOptionsFor(element).dataTable)
  if (dataPoints.length) return dataPoints
  return sampleFunction(element)
    .filter(Boolean)
    .map((point) => ({ x: point.x, y: point.y + (Number(element.yOffset) || 0) }))
}

function functionFeaturePoints(element) {
  const points = functionDisplayPoints(element)
  const features = {
    xIntercepts: [],
    yIntercept: null,
    extrema: [],
    samples: [],
    asymptotes: [],
    tangent: null,
  }
  if (!points.length) return features

  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1]
    const current = points[index]
    if (previous.y === 0) features.xIntercepts.push(previous)
    if (previous.y * current.y < 0) {
      const t = Math.abs(previous.y) / (Math.abs(previous.y) + Math.abs(current.y))
      features.xIntercepts.push({
        x: previous.x + (current.x - previous.x) * t,
        y: 0,
      })
    }
    if (Math.abs(current.y - previous.y) > 8) {
      features.asymptotes.push({ x: current.x, y: 0 })
    }
  }

  const yCross = points.reduce((best, point) => (Math.abs(point.x) < Math.abs(best.x) ? point : best), points[0])
  features.yIntercept = { x: 0, y: yCross.y }

  for (let index = 1; index < points.length - 1; index += 1) {
    const previous = points[index - 1]
    const current = points[index]
    const next = points[index + 1]
    if ((current.y >= previous.y && current.y >= next.y) || (current.y <= previous.y && current.y <= next.y)) {
      if (!features.extrema.some((point) => distance(point, current) < 0.35)) features.extrema.push(current)
    }
  }

  const sampleStep = Math.max(1, Math.floor(points.length / 10))
  features.samples = points.filter((_, index) => index % sampleStep === 0).slice(0, 12)
  const mid = points[Math.floor(points.length / 2)]
  const before = points[Math.max(0, Math.floor(points.length / 2) - 1)]
  const after = points[Math.min(points.length - 1, Math.floor(points.length / 2) + 1)]
  if (mid && before && after) {
    const slope = (after.y - before.y) / Math.max(0.001, after.x - before.x)
    features.tangent = {
      start: { x: mid.x - 1, y: mid.y - slope },
      end: { x: mid.x + 1, y: mid.y + slope },
    }
  }

  return features
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

function elementDisplayName(element) {
  return element.displayName?.trim() || element.title || element.text || element.expression || elementLabel(element)
}

function elementBounds(element) {
  if (element.type === 'line' || element.type === 'arrow' || element.type === 'rect' || element.type === 'ellipse') {
    return normalBounds(element.start, element.end)
  }

  if (element.type === 'path') {
    const xs = element.points.map((point) => point.x)
    const ys = element.points.map((point) => point.y)
    return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) }
  }

  if (element.type === 'function') {
    const points = sampleFunction(element)
      .filter(Boolean)
      .map((point) => ({ x: point.x, y: point.y + (Number(element.yOffset) || 0) }))
    if (!points.length) return { minX: element.domainStart, maxX: element.domainEnd, minY: -1, maxY: 1 }
    const xs = points.map((point) => point.x)
    const ys = points.map((point) => point.y)
    return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) }
  }

  if (element.type === 'text') {
    const box = labelBoxForText(element.text)
    const halfWidth = box.width / CANVAS.scale / 2
    const halfHeight = box.height / CANVAS.scale / 2
    return {
      minX: element.position.x - halfWidth,
      maxX: element.position.x + halfWidth,
      minY: element.position.y - halfHeight,
      maxY: element.position.y + halfHeight,
    }
  }

  if (element.type === 'diagram') return diagramBounds(element)
  if (element.type === 'library') return libraryBounds(element)
  return { minX: 0, maxX: 0, minY: 0, maxY: 0 }
}

function mergeBounds(boundsList) {
  return boundsList.reduce(
    (result, bounds) => ({
      minX: Math.min(result.minX, bounds.minX),
      maxX: Math.max(result.maxX, bounds.maxX),
      minY: Math.min(result.minY, bounds.minY),
      maxY: Math.max(result.maxY, bounds.maxY),
    }),
    { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity },
  )
}

function boundsCenter(bounds) {
  return { x: (bounds.minX + bounds.maxX) / 2, y: (bounds.minY + bounds.maxY) / 2 }
}

function resizeElementToBounds(element, nextBounds) {
  const current = elementBounds(element)
  const currentWidth = Math.max(0.001, current.maxX - current.minX)
  const currentHeight = Math.max(0.001, current.maxY - current.minY)
  const nextWidth = Math.max(0.05, nextBounds.maxX - nextBounds.minX)
  const nextHeight = Math.max(0.05, nextBounds.maxY - nextBounds.minY)
  const mapPoint = (point) => ({
    x: nextBounds.minX + ((point.x - current.minX) / currentWidth) * nextWidth,
    y: nextBounds.minY + ((point.y - current.minY) / currentHeight) * nextHeight,
  })

  if (element.type === 'line' || element.type === 'arrow' || element.type === 'rect' || element.type === 'ellipse') {
    return { ...element, start: mapPoint(element.start), end: mapPoint(element.end) }
  }

  if (element.type === 'path') return { ...element, points: element.points.map(mapPoint) }
  if (element.type === 'text') return { ...element, position: boundsCenter(nextBounds) }
  if (element.type === 'function') {
    return {
      ...element,
      domainStart: nextBounds.minX,
      domainEnd: nextBounds.maxX,
      yOffset: (Number(element.yOffset) || 0) + (boundsCenter(nextBounds).y - boundsCenter(current).y),
    }
  }
  if (element.type === 'diagram' || element.type === 'library') {
    const scale = Number(element.scale) || 1
    const ratio = Math.max(0.25, Math.min(4, Math.min(nextWidth / currentWidth, nextHeight / currentHeight)))
    return { ...element, origin: boundsCenter(nextBounds), scale: scale * ratio }
  }
  return element
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
  const circuitEnd = circuitTikzComponent(metrics.preset, metrics.config) ? circuitEndPoint(metrics.config) : null
  if (circuitEnd) {
    const end = {
      x: element.origin.x + circuitEnd.x * scale,
      y: element.origin.y + circuitEnd.y * scale,
    }
    return {
      minX: Math.min(element.origin.x, end.x) - 0.35 * scale,
      maxX: Math.max(element.origin.x, end.x) + 0.35 * scale,
      minY: Math.min(element.origin.y, end.y) - 0.35 * scale,
      maxY: Math.max(element.origin.y, end.y) + 0.35 * scale,
    }
  }

  return {
    minX: element.origin.x - metrics.leftExtra * scale,
    maxX: element.origin.x + (metrics.baseWidth + metrics.rightExtra) * scale,
    minY: element.origin.y - (metrics.baseHeight + metrics.downExtra) * scale,
    maxY: element.origin.y + metrics.upExtra * scale,
  }
}

function terminalPointsForElement(element) {
  if (element.type === 'line' || element.type === 'arrow') {
    return [element.start, element.end]
  }

  if (element.type === 'path') {
    return [element.points[0], element.points.at(-1)].filter(Boolean)
  }

  if (element.type === 'library') {
    const preset = getLibraryPreset(element)
    const config = getLibraryConfig(element, preset)
    const component = circuitTikzComponent(preset, config)
    if (!component) return []

    const scale = Number(element.scale) || 1
    const end = circuitEndPoint(config)
    return [
      element.origin,
      {
        x: element.origin.x + end.x * scale,
        y: element.origin.y + end.y * scale,
      },
    ]
  }

  return []
}

function inferCircuitNets(elements) {
  const terminals = elements.flatMap((element) =>
    terminalPointsForElement(element).map((point, index) => ({
      elementId: element.id,
      index,
      point,
    })),
  )
  const nets = []
  terminals.forEach((terminal) => {
    const match = nets.find((net) => net.terminals.some((candidate) => distance(candidate.point, terminal.point) < 0.08))
    if (match) {
      match.terminals.push(terminal)
    } else {
      nets.push({ name: `N${nets.length + 1}`, terminals: [terminal] })
    }
  })
  return nets.filter((net) => net.terminals.length > 1)
}

function makeOrthogonalRoute(start, end) {
  if (Math.abs(start.x - end.x) < 0.001 || Math.abs(start.y - end.y) < 0.001) {
    return [start, end]
  }

  const horizontalFirst = Math.abs(end.x - start.x) >= Math.abs(end.y - start.y)
  const corner = horizontalFirst ? { x: end.x, y: start.y } : { x: start.x, y: end.y }
  return [start, corner, end]
}

function makeRoutedPoints(start, end, mode = 'manhattan') {
  if (mode === 'straight') return [start, end]
  if (Math.abs(start.x - end.x) < 0.001 || Math.abs(start.y - end.y) < 0.001) return [start, end]

  if (mode === 'stepped') {
    const midX = (start.x + end.x) / 2
    return [start, { x: midX, y: start.y }, { x: midX, y: end.y }, end]
  }

  if (mode === 'bus') {
    const offset = end.y >= start.y ? 0.35 : -0.35
    return [start, { x: start.x, y: start.y + offset }, { x: end.x, y: start.y + offset }, end]
  }

  if (mode === 'avoid') {
    const offset = end.x >= start.x ? 0.45 : -0.45
    return [start, { x: start.x + offset, y: start.y }, { x: start.x + offset, y: end.y }, end]
  }

  return makeOrthogonalRoute(start, end)
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
  const circuitComponent = circuitTikzComponent(preset, config)

  if (circuitComponent) {
    const end = circuitEndPoint(config)
    const terminals = circuitTerminalOption(config.terminalStyle)
    const componentOptions = [circuitComponent]
    if (terminals) componentOptions.push(terminals)
    const printedLabel = config.autoLabel ? config.circuitLabel : config.label
    const value = `${config.circuitValue ?? ''}`.trim()
    const circuitLabel = value ? `${printedLabel}=${value}` : printedLabel
    if (circuitLabel.trim()) componentOptions.push(`l={${formatTikzNodeText(circuitLabel)}}`)

    return [
      `\\draw[draw=__COLOR__, line width=0.65pt] (0,0) to[${componentOptions.join(',')}] (${formatNumber(
        end.x,
      )},${formatNumber(end.y)});`,
    ]
  }

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

    if (element.type === 'function' && functionOptionsFor(element).usePgfplots) {
      packages.add('\\usepackage{pgfplots}')
      afterPreamble.add('\\pgfplotsset{compat=1.18}')
      if (functionOptionsFor(element).colormap?.trim()) pgfplotsLibraries.add('colormaps')
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
  const exportPreset = exportOptions.exportPreset ?? 'figure'
  const wrapFigure = exportPreset === 'snippet' ? false : exportOptions.wrapFigure ?? false
  const figureCaption = exportOptions.caption?.trim() ?? ''
  const figureLabel = safeLatexLabel(exportOptions.label ?? '')
  const drawableElements = elements.filter((element) => !element.hidden)
  const requirements = collectRequirements(drawableElements)
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

  drawableElements.forEach((element) => {
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
  const journalStyle = exportOptions.journalStyle ?? 'ieee'
  const journalOptions = {
    ieee: 'font=\\small',
    nature: 'font=\\small',
    thesis: 'font=\\normalsize',
    slides: 'font=\\large',
  }[journalStyle]
  const pictureLines = [
    `\\begin{tikzpicture}[x=1cm, y=1cm, line cap=round, line join=round, >=Stealth, every node/.style={${journalOptions}}]`,
  ]

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

  drawableElements.forEach((element) => {
    const rotation = Number(element.rotation) || 0
    if (rotation) {
      const center = boundsCenter(elementBounds(element))
      pictureLines.push(`  \\begin{scope}[rotate around={${formatNumber(rotation)}:(${formatNumber(center.x)},${formatNumber(center.y)})}]`)
    }
    const linePrefix = rotation ? '    ' : '  '

    if (element.type === 'line') {
      pictureLines.push(
        `${linePrefix}\\draw${optionsFor(element)} (${formatNumber(element.start.x)},${formatNumber(
          element.start.y,
        )}) -- (${formatNumber(element.end.x)},${formatNumber(element.end.y)});`,
      )
    }

    if (element.type === 'arrow') {
      pictureLines.push(
        `${linePrefix}\\draw${optionsFor(element, [tikzArrowStyle(element.arrowStyle)])} (${formatNumber(element.start.x)},${formatNumber(
          element.start.y,
        )}) -- (${formatNumber(element.end.x)},${formatNumber(element.end.y)});`,
      )
    }

    if (element.type === 'rect') {
      pictureLines.push(
        `${linePrefix}\\draw${optionsFor(element, [], true)} (${formatNumber(element.start.x)},${formatNumber(
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
        `${linePrefix}\\draw${optionsFor(element, [], true)} (${formatNumber(center.x)},${formatNumber(
          center.y,
        )}) ellipse [x radius=${formatNumber(radiusX)}, y radius=${formatNumber(radiusY)}];`,
      )
    }

    if (element.type === 'path') {
      const points = simplifyPoints(element.points, element.smooth ? 0.05 : 0.03)
      if (points.length > 1) {
        const coords = points.map((point) => `(${formatNumber(point.x)},${formatNumber(point.y)})`).join(' ')
        if (element.smooth) {
          pictureLines.push(`${linePrefix}\\draw${optionsFor(element, ['smooth'])} plot coordinates { ${coords} };`)
        } else {
          pictureLines.push(`${linePrefix}\\draw${optionsFor(element)} ${coords.replaceAll(') (', ') -- (')};`)
        }
      }
    }

    if (element.type === 'function') {
      const functionOptions = functionOptionsFor(element)
      const segments = splitDrawableSegments(
        functionDisplayPoints(element).map((point) => (point ? { x: point.x, y: point.y } : null)),
      )
      if (functionOptions.usePgfplots) {
        const axisOptions = [
          `width=${functionOptions.axisWidth ?? '7cm'}`,
          `height=${functionOptions.axisHeight ?? '4.5cm'}`,
          functionOptions.axisType === 'semilogxaxis' || functionOptions.logX ? 'xmode=log' : '',
          functionOptions.axisType === 'semilogyaxis' || functionOptions.logY ? 'ymode=log' : '',
          `xlabel={${formatTikzNodeText(functionOptions.xLabel)}}`,
          `ylabel={${formatTikzNodeText(functionOptions.yLabel)}}`,
          functionOptions.gridStyle !== 'none' ? `grid=${functionOptions.gridStyle}` : '',
          functionOptions.xTicks?.trim() ? `xtick={${functionOptions.xTicks.trim()}}` : '',
          functionOptions.yTicks?.trim() ? `ytick={${functionOptions.yTicks.trim()}}` : '',
          functionOptions.tickLabelStyle?.trim() ? `tick label style={${functionOptions.tickLabelStyle.trim()}}` : '',
          functionOptions.legend ? `legend pos=${functionOptions.legendPos || 'north east'}` : '',
          functionOptions.colormap?.trim() ? `colormap/${functionOptions.colormap.trim()}` : '',
          functionOptions.clip ? 'clip=true' : 'clip=false',
          functionOptions.axisOptions?.trim() ?? '',
        ].filter(Boolean)
        pictureLines.push(`${linePrefix}\\begin{axis}[${axisOptions.join(', ')}]`)
        const makeAddplotOptions = () =>
          [
            `draw=${ensureColor(element.stroke)}`,
            functionOptions.markerStyle === 'none' ? 'no markers' : `mark=${functionOptions.markerStyle}`,
            functionOptions.errorBars ? functionOptions.errorBarOptions || '/pgfplots/error bars/y dir=both, /pgfplots/error bars/y explicit' : '',
            functionOptions.plotOptions,
          ].filter(Boolean)
        const dataPoints = parsedDataTablePoints(functionOptions.dataTable)
        if (dataPoints.length) {
          const tableRows = ['x y', ...dataPoints.map((point) => `${formatNumber(point.x)} ${formatNumber(point.y)}`)]
          const legend = functionOptions.legend ? `\n${linePrefix}  \\addlegendentry{${formatTikzNodeText(functionOptions.legend)}}` : ''
          pictureLines.push(`${linePrefix}  \\addplot[${makeAddplotOptions().join(', ')}] table[row sep=\\\\] {`)
          tableRows.forEach((row) => pictureLines.push(`${linePrefix}    ${row}\\\\`))
          pictureLines.push(`${linePrefix}  };${legend}`)
        } else {
          segments.forEach((segment, index) => {
            const coords = segment.map((point) => `(${formatNumber(point.x)},${formatNumber(point.y)})`).join(' ')
            const legend = functionOptions.legend && index === 0 ? `\n${linePrefix}  \\addlegendentry{${formatTikzNodeText(functionOptions.legend)}}` : ''
            pictureLines.push(`${linePrefix}  \\addplot[${makeAddplotOptions().join(', ')}] coordinates { ${coords} };${legend}`)
          })
        }
        pictureLines.push(`${linePrefix}\\end{axis}`)
      } else {
        segments.forEach((segment, index) => {
          const coords = segment.map((point) => `(${formatNumber(point.x)},${formatNumber(point.y)})`).join(' ')
          const comment = index === 0 ? ` % f(x) = ${element.expression}` : ''
          pictureLines.push(`${linePrefix}\\draw${optionsFor(element, element.smooth === false ? [] : ['smooth'])} plot coordinates { ${coords} };${comment}`)
        })
        const features = functionFeaturePoints(element)
        const markPoint = (point, label) =>
          `${linePrefix}\\filldraw[fill=white, draw=${ensureColor(element.stroke)}, line width=0.45pt] (${formatNumber(point.x)},${formatNumber(
            point.y,
          )}) circle (1.7pt) node[above right, font=\\scriptsize] {${label}};`
        if (functionOptions.showXIntercepts) features.xIntercepts.slice(0, 8).forEach((point) => pictureLines.push(markPoint(point, '$x_0$')))
        if (functionOptions.showYIntercept && features.yIntercept) pictureLines.push(markPoint(features.yIntercept, '$y_0$'))
        if (functionOptions.showExtrema) features.extrema.slice(0, 8).forEach((point) => pictureLines.push(markPoint(point, 'ext')))
        if (functionOptions.showSamples) features.samples.forEach((point) => pictureLines.push(markPoint(point, '')))
        if (functionOptions.showTangent && features.tangent) {
          pictureLines.push(
            `${linePrefix}\\draw[dashed, draw=${ensureColor(element.stroke)}!65, line width=0.4pt] (${formatNumber(features.tangent.start.x)},${formatNumber(
              features.tangent.start.y,
            )}) -- (${formatNumber(features.tangent.end.x)},${formatNumber(features.tangent.end.y)});`,
          )
        }
        if (functionOptions.showAsymptotes) {
          features.asymptotes.slice(0, 6).forEach((point) => {
            pictureLines.push(`${linePrefix}\\draw[densely dashed, color=gray!55] (${formatNumber(point.x)},${formatNumber(worldBounds.minY)}) -- (${formatNumber(point.x)},${formatNumber(worldBounds.maxY)});`)
          })
        }
        if (functionOptions.legend) {
          const bounds = elementBounds(element)
          pictureLines.push(`${linePrefix}\\node[anchor=west, font=\\scriptsize] at (${formatNumber(bounds.maxX + 0.2)},${formatNumber(bounds.maxY)}) {${formatTikzNodeText(functionOptions.legend)}};`)
        }
      }
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
        `${linePrefix}\\node[${nodeOptions.join(', ')}] at (${formatNumber(element.position.x)},${formatNumber(
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

    if (rotation) pictureLines.push('  \\end{scope}')
  })

  pictureLines.push('\\end{tikzpicture}')
  if (standaloneSnippets.length) {
    pictureLines.push('', '% Standalone library environments', ...standaloneSnippets)
  }

  if (exportPreset === 'standalone') {
    return [
      '\\documentclass[tikz,border=4pt]{standalone}',
      ...requirements.packages,
      ...(requirements.libraries.length ? [`\\usetikzlibrary{${requirements.libraries.join(',')}}`] : []),
      ...(requirements.pgfplotsLibraries.length ? [`\\usepgfplotslibrary{${requirements.pgfplotsLibraries.join(',')}}`] : []),
      ...requirements.afterPreamble,
      ...definitions,
      '\\begin{document}',
      ...pictureLines,
      '\\end{document}',
    ].join('\n')
  }

  if (exportPreset === 'beamer') {
    return [
      '\\begin{frame}{TikZ sketch}',
      '  \\centering',
      ...indentLatex(pictureLines),
      '\\end{frame}',
    ].join('\n')
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
  const [initialSharedBoard] = useState(readInitialSharedBoard)
  const initialElements = initialSharedBoard?.elements ?? seedElements
  const initialSelectedId = initialElements[0]?.id ?? null
  const svgRef = useRef(null)
  const importInputRef = useRef(null)
  const [tool, setTool] = useState('select')
  const [zoom, setZoom] = useState(initialSharedBoard?.viewport?.zoom ?? 1)
  const [canvasPan, setCanvasPan] = useState(initialSharedBoard?.viewport?.canvasPan ?? { x: 0, y: 0 })
  const [elements, setElements] = useState(initialElements)
  const [selectedId, setSelectedId] = useState(initialSelectedId)
  const [selectedIds, setSelectedIds] = useState(initialSelectedId ? [initialSelectedId] : [])
  const [clipboardElements, setClipboardElements] = useState([])
  const [draft, setDraft] = useState(null)
  const [interaction, setInteraction] = useState(null)
  const [past, setPast] = useState([])
  const [future, setFuture] = useState([])
  const [copyLabel, setCopyLabel] = useState('Copy .TeX code')
  const [shareLabel, setShareLabel] = useState('Copiar URL')
  const [theme, setTheme] = useState(initialSharedBoard?.theme ?? 'light')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [helpTab, setHelpTab] = useState('tutorial')
  const [contextMenu, setContextMenu] = useState(null)
  const [overlapCandidates, setOverlapCandidates] = useState(null)
  const [mouseWorld, setMouseWorld] = useState({ x: 0, y: 0 })
  const [settings, setSettings] = useState({ ...defaultEditorSettings, ...(initialSharedBoard?.settings ?? {}) })
  const [layerSearch, setLayerSearch] = useState('')
  const [recentBoards] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('tikz-sketch-recent') ?? '[]')
    } catch {
      return []
    }
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

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  useEffect(() => {
    if (!settings.autosave) return
    const payload = {
      version: 2,
      savedAt: new Date().toISOString(),
      elements,
      settings,
      theme,
      viewport: { canvasPan, zoom },
    }
    localStorage.setItem('tikz-sketch-autosave', JSON.stringify(payload))
    localStorage.setItem(
      'tikz-sketch-recent',
      JSON.stringify([{ name: 'Autosave', savedAt: payload.savedAt, count: elements.length }, ...recentBoards.slice(0, 4)]),
    )
  }, [canvasPan, elements, recentBoards, settings, theme, zoom])

  const selectedElement = elements.find((element) => element.id === selectedId)
  const selectedElements = elements.filter((element) => selectedIds.includes(element.id))
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
        exportPreset: settings.exportPreset,
        journalStyle: settings.journalStyle,
      }),
    [
      elements,
      settings.caption,
      settings.exportGrid,
      settings.exportPreset,
      settings.journalStyle,
      settings.label,
      settings.monochromeExport,
      settings.wrapFigure,
    ],
  )
  const tikzWarnings = useMemo(() => {
    if (!settings.warnMissingLibraries) return []
    const warnings = []
    elements.forEach((element) => {
      if (element.type !== 'library') return
      const preset = getLibraryPreset(element)
      const snippet = preset.snippet?.join('\n') ?? ''
      if (/\\begin\{axis}|\\addplot/.test(snippet) && !preset.packages?.some((item) => item.includes('pgfplots'))) {
        warnings.push(`${elementDisplayName(element)} parece necesitar pgfplots.`)
      }
      if (/op amp|npn|nmos|to\[/.test(snippet) && !preset.packages?.some((item) => item.includes('circuitikz'))) {
        warnings.push(`${elementDisplayName(element)} parece necesitar circuitikz.`)
      }
      if (/Stealth|bend left|positioning|right=/.test(snippet) && !(preset.libraries?.length || preset.packages?.some((item) => item.includes('tikz')))) {
        warnings.push(`${elementDisplayName(element)} puede necesitar librerias TikZ extra.`)
      }
    })
    return warnings.slice(0, 5)
  }, [elements, settings.warnMissingLibraries])
  const inferredNets = useMemo(() => inferCircuitNets(elements.filter((element) => !element.hidden)), [elements])
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
  const visibleLayerElements = useMemo(() => {
    const query = layerSearch.trim().toLowerCase()
    return [...elements]
      .reverse()
      .filter((element) => !query || elementDisplayName(element).toLowerCase().includes(query) || element.type.includes(query))
  }, [elements, layerSearch])
  const selectionBounds = useMemo(
    () => (selectedElements.length ? mergeBounds(selectedElements.map(elementBounds)) : null),
    [selectedElements],
  )

  const setCanvasZoom = (nextZoom) => {
    const value = Number(nextZoom)
    setZoom(Math.min(2.25, Math.max(0.55, Number.isFinite(value) ? value : 1)))
  }

  const pushHistory = (snapshot = elements) => {
    setPast((items) => [...items, snapshot].slice(-50))
    setFuture([])
  }

  const commitElements = (nextElements, nextSelectedId = selectedId) => {
    const normalizedElements = renumberCircuitLabels(nextElements)
    pushHistory(elements)
    setElements(normalizedElements)
    setSelectedId(nextSelectedId)
    setSelectedIds(nextSelectedId ? [nextSelectedId] : [])
  }

  const commitElementsWithSelection = (nextElements, nextSelectedIds = []) => {
    const normalizedElements = renumberCircuitLabels(nextElements)
    pushHistory(elements)
    setElements(normalizedElements)
    setSelectedIds(nextSelectedIds)
    setSelectedId(nextSelectedIds.at(-1) ?? null)
  }

  const selectOnly = (id) => {
    setSelectedId(id)
    setSelectedIds(id ? [id] : [])
  }

  const snapToTerminal = (point, ignoreIds = []) => {
    if (!settings.terminalSnap) return point

    const ignored = new Set(ignoreIds)
    const terminals = elements
      .filter((element) => !ignored.has(element.id))
      .flatMap((element) => terminalPointsForElement(element).map((terminal) => ({ ...terminal, elementId: element.id })))
    const nearest = terminals.reduce(
      (best, terminal) => {
        const candidateDistance = distance(point, terminal)
        return candidateDistance < best.distance ? { terminal, distance: candidateDistance } : best
      },
      { terminal: null, distance: 0.28 },
    )

    return nearest.terminal ? { x: nearest.terminal.x, y: nearest.terminal.y } : point
  }

  const getWorldPointFromClient = (clientX, clientY) => {
    const rect = svgRef.current.getBoundingClientRect()
    const screenPoint = {
      x: canvasPan.x + ((clientX - rect.left) / rect.width) * CANVAS.width,
      y: canvasPan.y + ((clientY - rect.top) / rect.height) * CANVAS.height,
    }
    const worldPoint = screenToWorld(screenPoint)
    const snappedPoint = settings.snap ? snapPoint(worldPoint) : worldPoint
    return snapToTerminal(snappedPoint)
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
    hidden: false,
    locked: false,
    rotation: 0,
  })

  const eraseIds = (ids, snapshot = elements) => {
    if (!ids.length) return
    const idSet = new Set(ids)
    pushHistory(snapshot)
    setElements((current) => current.filter((element) => !idSet.has(element.id)))
    setSelectedId(null)
    setSelectedIds([])
  }

  const findEraserHits = (point, sourceElements = elements) =>
    sourceElements.filter((element) => !element.hidden && !element.locked && elementIntersectsEraser(element, point)).map((element) => element.id)

  const findSelectableHits = (point, sourceElements = elements) =>
    sourceElements
      .map((element, index) => ({ element, index }))
      .filter(({ element }) => !element.hidden && !element.locked && elementIntersectsEraser(element, point, 0.34))
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
    setContextMenu(null)
    setOverlapCandidates(null)

    if (tool === 'pan') {
      svgRef.current?.setPointerCapture?.(event.pointerId)
      setInteraction({
        mode: 'pan',
        startClient: { x: event.clientX, y: event.clientY },
        startPan: canvasPan,
      })
      return
    }

    if (tool === 'select') {
      selectOnly(null)
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
        selectOnly(null)
        setInteraction({
          ...interaction,
          hasErased: true,
          erasedIds: [...interaction.erasedIds, ...hitIds],
        })
      }

      return
    }

    if (interaction?.mode === 'pan') {
      const rect = svgRef.current.getBoundingClientRect()
      const dx = ((event.clientX - interaction.startClient.x) / rect.width) * CANVAS.width
      const dy = ((event.clientY - interaction.startClient.y) / rect.height) * CANVAS.height
      setCanvasPan({
        x: interaction.startPan.x - dx,
        y: interaction.startPan.y - dy,
      })
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

    if (interaction?.mode === 'move-selection') {
      const deltaX = point.x - interaction.origin.x
      const deltaY = point.y - interaction.origin.y
      const originals = new Map(interaction.originals.map((element) => [element.id, element]))

      if (!interaction.moved) {
        setPast((items) => [...items, interaction.snapshot].slice(-50))
        setFuture([])
      }

      setInteraction({ ...interaction, moved: true })
      setElements((current) =>
        current.map((element) => (originals.has(element.id) ? moveElement(originals.get(element.id), deltaX, deltaY) : element)),
      )
      return
    }

    if (interaction?.mode === 'resize-selection') {
      const originalBounds = interaction.bounds
      const nextBounds = {
        minX: originalBounds.minX,
        minY: originalBounds.minY,
        maxX: Math.max(originalBounds.minX + 0.1, point.x),
        maxY: Math.max(originalBounds.minY + 0.1, point.y),
      }
      const originals = new Map(interaction.originals.map((element) => [element.id, element]))

      if (!interaction.moved) {
        setPast((items) => [...items, interaction.snapshot].slice(-50))
        setFuture([])
      }

      setInteraction({ ...interaction, moved: true })
      setElements((current) =>
        current.map((element) => {
          const original = originals.get(element.id)
          if (!original) return element
          const originalElementBounds = elementBounds(original)
          const relBounds = {
            minX:
              nextBounds.minX +
              ((originalElementBounds.minX - originalBounds.minX) / Math.max(0.001, originalBounds.maxX - originalBounds.minX)) *
                (nextBounds.maxX - nextBounds.minX),
            maxX:
              nextBounds.minX +
              ((originalElementBounds.maxX - originalBounds.minX) / Math.max(0.001, originalBounds.maxX - originalBounds.minX)) *
                (nextBounds.maxX - nextBounds.minX),
            minY:
              nextBounds.minY +
              ((originalElementBounds.minY - originalBounds.minY) / Math.max(0.001, originalBounds.maxY - originalBounds.minY)) *
                (nextBounds.maxY - nextBounds.minY),
            maxY:
              nextBounds.minY +
              ((originalElementBounds.maxY - originalBounds.minY) / Math.max(0.001, originalBounds.maxY - originalBounds.minY)) *
                (nextBounds.maxY - nextBounds.minY),
          }
          return resizeElementToBounds(original, relBounds)
        }),
      )
      return
    }

    if (interaction?.mode === 'rotate-selection') {
      const center = boundsCenter(interaction.bounds)
      const angle = (Math.atan2(point.y - center.y, point.x - center.x) * 180) / Math.PI
      const delta = angle - interaction.startAngle
      const originals = new Map(interaction.originals.map((element) => [element.id, element]))

      if (!interaction.moved) {
        setPast((items) => [...items, interaction.snapshot].slice(-50))
        setFuture([])
      }

      setInteraction({ ...interaction, moved: true })
      setElements((current) =>
        current.map((element) =>
          originals.has(element.id)
            ? { ...element, rotation: Math.round(((Number(originals.get(element.id).rotation) || 0) + delta) * 10) / 10 }
            : element,
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
      if (settings.routeWires && draft.type === 'line') {
        const routedPoints = makeRoutedPoints(draft.start, draft.end, settings.routeMode)
        const routedDraft =
          routedPoints.length > 2
            ? {
                ...draft,
                type: 'path',
                points: routedPoints,
                smooth: false,
                title: 'Wire route',
              }
            : draft
        commitElements([...elements, routedDraft], routedDraft.id)
      } else {
        commitElements([...elements, draft], draft.id)
      }
    }

    setDraft(null)
  }

  const handleElementPointerDown = (event, element) => {
    event.stopPropagation()
    setContextMenu(null)

    if (tool === 'erase') {
      beginErase(event, element)
      return
    }

    const point = getWorldPoint(event)
    const hitElements = tool === 'select' ? findSelectableHits(point) : [element]
    if (tool === 'select' && hitElements.length > 1) {
      setOverlapCandidates({ x: event.clientX, y: event.clientY, ids: hitElements.map((hit) => hit.id) })
    } else {
      setOverlapCandidates(null)
    }
    const selectedHitIndex = hitElements.findIndex((hit) => hit.id === selectedId)
    const targetElement =
      tool === 'select' && hitElements.length > 1 && selectedHitIndex >= 0
        ? hitElements[(selectedHitIndex + 1) % hitElements.length]
        : hitElements[0] ?? element

    if (tool !== 'select') return

    if (event.shiftKey) {
      const nextSelectedIds = selectedIds.includes(targetElement.id)
        ? selectedIds.filter((id) => id !== targetElement.id)
        : [...selectedIds, targetElement.id]
      setSelectedIds(nextSelectedIds)
      setSelectedId(nextSelectedIds.at(-1) ?? null)
      return
    }

    const activeSelectionIds = selectedIds.includes(targetElement.id) ? selectedIds : [targetElement.id]
    setSelectedId(targetElement.id)
    setSelectedIds(activeSelectionIds)

    svgRef.current?.setPointerCapture?.(event.pointerId)
    if (activeSelectionIds.length > 1) {
      setInteraction({
        mode: 'move-selection',
        ids: activeSelectionIds,
        origin: point,
        originals: elements.filter((candidate) => activeSelectionIds.includes(candidate.id)),
        snapshot: elements,
        moved: false,
      })
    } else {
      setInteraction({
        mode: 'move',
        id: targetElement.id,
        origin: point,
        original: targetElement,
        snapshot: elements,
        moved: false,
      })
    }
  }

  const handleElementContextMenu = (event, element) => {
    event.preventDefault()
    event.stopPropagation()
    selectOnly(element.id)
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      elementId: element.id,
    })
  }

  const updateSelected = (patch) => {
    if (!selectedElement) return
    const styleKeys = new Set(['stroke', 'fill', 'fillOpacity', 'width', 'dashed', 'tikzOptions'])
    const canApplyToSelection = selectedIds.length > 1 && Object.keys(patch).every((key) => styleKeys.has(key))
    const targetIds = canApplyToSelection ? new Set(selectedIds) : new Set([selectedElement.id])
    setElements((current) =>
      current.map((element) => (targetIds.has(element.id) ? { ...element, ...patch } : element)),
    )
  }

  const updateSelectedLibraryConfig = (patch) => {
    if (selectedElement?.type !== 'library') return
    updateSelected({ config: { ...getLibraryConfig(selectedElement), ...patch } })
  }

  const updateSelectedFunctionOptions = (patch) => {
    if (selectedElement?.type !== 'function') return
    updateSelected({ functionOptions: { ...functionOptionsFor(selectedElement), ...patch } })
  }

  const updateElementById = (id, patch) => {
    setElements((current) => current.map((element) => (element.id === id ? { ...element, ...patch } : element)))
  }

  const reorderElement = (id, direction) => {
    const index = elements.findIndex((element) => element.id === id)
    if (index < 0) return
    const nextIndex =
      direction === 'front'
        ? elements.length - 1
        : direction === 'back'
          ? 0
          : Math.max(0, Math.min(elements.length - 1, index + direction))
    if (nextIndex === index) return
    const nextElements = [...elements]
    const [item] = nextElements.splice(index, 1)
    nextElements.splice(nextIndex, 0, item)
    commitElementsWithSelection(nextElements, selectedIds)
  }

  const groupSelected = () => {
    if (selectedIds.length < 2) return
    const groupId = `group-${createId().slice(0, 8)}`
    commitElementsWithSelection(
      elements.map((element) => (selectedIds.includes(element.id) ? { ...element, groupId } : element)),
      selectedIds,
    )
  }

  const ungroupSelected = () => {
    if (!selectedIds.length) return
    commitElementsWithSelection(
      elements.map((element) => (selectedIds.includes(element.id) ? { ...element, groupId: '' } : element)),
      selectedIds,
    )
  }

  const alignSelected = (mode) => {
    if (selectedElements.length < 2) return
    const selection = mergeBounds(selectedElements.map(elementBounds))
    const nextElements = elements.map((element) => {
      if (!selectedIds.includes(element.id)) return element
      const bounds = elementBounds(element)
      const delta =
        mode === 'left'
          ? { x: selection.minX - bounds.minX, y: 0 }
          : mode === 'right'
            ? { x: selection.maxX - bounds.maxX, y: 0 }
            : mode === 'hcenter'
              ? { x: boundsCenter(selection).x - boundsCenter(bounds).x, y: 0 }
              : mode === 'top'
                ? { x: 0, y: selection.maxY - bounds.maxY }
                : mode === 'bottom'
                  ? { x: 0, y: selection.minY - bounds.minY }
                  : { x: 0, y: boundsCenter(selection).y - boundsCenter(bounds).y }
      return moveElement(element, delta.x, delta.y)
    })
    commitElementsWithSelection(nextElements, selectedIds)
  }

  const distributeSelected = (axis) => {
    if (selectedElements.length < 3) return
    const sorted = [...selectedElements].sort((a, b) => boundsCenter(elementBounds(a))[axis] - boundsCenter(elementBounds(b))[axis])
    const first = boundsCenter(elementBounds(sorted[0]))[axis]
    const last = boundsCenter(elementBounds(sorted.at(-1)))[axis]
    const step = (last - first) / Math.max(1, sorted.length - 1)
    const target = new Map(sorted.map((element, index) => [element.id, first + step * index]))
    const nextElements = elements.map((element) => {
      if (!target.has(element.id)) return element
      const bounds = elementBounds(element)
      const delta = target.get(element.id) - boundsCenter(bounds)[axis]
      return axis === 'x' ? moveElement(element, delta, 0) : moveElement(element, 0, delta)
    })
    commitElementsWithSelection(nextElements, selectedIds)
  }

  const makeSelectedSameSize = () => {
    if (selectedElements.length < 2) return
    const sourceBounds = elementBounds(selectedElements.at(-1))
    const sourceWidth = sourceBounds.maxX - sourceBounds.minX
    const sourceHeight = sourceBounds.maxY - sourceBounds.minY
    const nextElements = elements.map((element) => {
      if (!selectedIds.includes(element.id)) return element
      const center = boundsCenter(elementBounds(element))
      return resizeElementToBounds(element, {
        minX: center.x - sourceWidth / 2,
        maxX: center.x + sourceWidth / 2,
        minY: center.y - sourceHeight / 2,
        maxY: center.y + sourceHeight / 2,
      })
    })
    commitElementsWithSelection(nextElements, selectedIds)
  }

  const resizeElementToSelection = (nextBounds) => {
    if (!selectionBounds || !selectedIds.length) return
    const originalBounds = selectionBounds
    const nextElements = elements.map((element) => {
      if (!selectedIds.includes(element.id)) return element
      const current = elementBounds(element)
      const relBounds = {
        minX:
          nextBounds.minX +
          ((current.minX - originalBounds.minX) / Math.max(0.001, originalBounds.maxX - originalBounds.minX)) *
            (nextBounds.maxX - nextBounds.minX),
        maxX:
          nextBounds.minX +
          ((current.maxX - originalBounds.minX) / Math.max(0.001, originalBounds.maxX - originalBounds.minX)) *
            (nextBounds.maxX - nextBounds.minX),
        minY:
          nextBounds.minY +
          ((current.minY - originalBounds.minY) / Math.max(0.001, originalBounds.maxY - originalBounds.minY)) *
            (nextBounds.maxY - nextBounds.minY),
        maxY:
          nextBounds.minY +
          ((current.maxY - originalBounds.minY) / Math.max(0.001, originalBounds.maxY - originalBounds.minY)) *
            (nextBounds.maxY - nextBounds.minY),
      }
      return resizeElementToBounds(element, relBounds)
    })
    commitElementsWithSelection(nextElements, selectedIds)
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
    if (!selectedIds.length) return
    const selectedSet = new Set(selectedIds)
    commitElements(
      elements.filter((element) => !selectedSet.has(element.id)),
      null,
    )
    setContextMenu(null)
  }

  const clearBoard = () => {
    if (!elements.length) return
    commitElements([], null)
    setContextMenu(null)
    setTool('select')
  }

  const restoreDemo = () => {
    commitElements(seedElements, 'seed-function')
    setSelectedIds(['seed-function'])
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
        functionOptions: { ...defaultFunctionOptions },
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
    const prefix = circuitAutoPrefix(preset)
    const matchingCircuitCount = prefix
      ? elements.filter((element) => {
          const candidatePreset = element.type === 'library' ? getLibraryPreset(element) : null
          return candidatePreset && circuitAutoPrefix(candidatePreset) === prefix
        }).length
      : 0
    const nextElement = {
      ...makeLibraryElement(preset, origin),
      stroke: settings.stroke,
      fill: settings.fill,
      fillOpacity: settings.fillOpacity,
      scale: settings.objectScale,
      tikzOptions: settings.tikzOptions,
    }
    if (prefix) {
      nextElement.config = {
        ...nextElement.config,
        circuitLabel: `${prefix}_${matchingCircuitCount + 1}`,
      }
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

  const importEditableTikzSnippet = () => {
    const snippet = customLibrary.snippet
    const pointPattern = '\\((-?\\d+(?:\\.\\d+)?),\\s*(-?\\d+(?:\\.\\d+)?)\\)'
    const lineMatch = snippet.match(new RegExp(`${pointPattern}\\s*--\\s*${pointPattern}`))
    const rectMatch = snippet.match(new RegExp(`${pointPattern}\\s*rectangle\\s*${pointPattern}`))
    const nodeMatch = snippet.match(/\\node(?:\[[^\]]*])?\s*at\s*\((-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)\)\s*\{([^}]*)}/)
    let nextElement = null

    if (rectMatch) {
      nextElement = {
        ...makeBaseElement(),
        type: 'rect',
        start: { x: Number(rectMatch[1]), y: Number(rectMatch[2]) },
        end: { x: Number(rectMatch[3]), y: Number(rectMatch[4]) },
      }
    } else if (lineMatch) {
      nextElement = {
        ...makeBaseElement(),
        type: snippet.includes('->') || snippet.includes('Stealth') ? 'arrow' : 'line',
        start: { x: Number(lineMatch[1]), y: Number(lineMatch[2]) },
        end: { x: Number(lineMatch[3]), y: Number(lineMatch[4]) },
      }
    } else if (nodeMatch) {
      nextElement = {
        ...makeBaseElement(),
        type: 'text',
        position: { x: Number(nodeMatch[1]), y: Number(nodeMatch[2]) },
        text: nodeMatch[3],
      }
    }

    if (!nextElement) {
      window.alert('Solo puedo convertir automaticamente nodos, lineas y rectangulos TikZ simples por ahora.')
      return
    }

    commitElements([...elements, nextElement], nextElement.id)
    setTool('select')
  }

  const loadGalleryExample = (kind) => {
    const presetIds = {
      qpsk: ['telecom-random-bits', 'telecom-qpsk-mod', 'telecom-channel', 'telecom-qpsk-demod', 'plot-constellation'],
      ofdm: ['telecom-bits', 'telecom-ifft', 'telecom-cp', 'telecom-channel', 'telecom-fft', 'plot-spectrum'],
      mimo: ['telecom-mimo-tx', 'telecom-mimo-channel', 'telecom-mimo-rx', 'plot-ber'],
      superhet: ['telecom-antenna', 'rf-amplifier', 'telecom-superhet', 'telecom-filter', 'plot-spectrum'],
      matched: ['telecom-qpsk-mod', 'telecom-channel', 'telecom-matched-filter', 'telecom-delay-block', 'plot-eye'],
      rf: ['rf-waveguide', 'rf-coupler', 'rf-splitter', 'rf-circulator', 'rf-sparameter'],
    }[kind] ?? ['telecom-transmitter-chain', 'telecom-channel', 'telecom-receiver-chain']
    const nextElements = presetIds
      .map((id, index) => {
        const preset = libraryPaletteItems.find((item) => item.id === id)
        if (!preset) return null
        return makeLibraryElement(preset, { x: -7 + index * 3, y: 2 - (index % 2) * 2.2 })
      })
      .filter(Boolean)
    if (!nextElements.length) return
    commitElementsWithSelection(nextElements, nextElements.map((element) => element.id))
    setTool('select')
  }

  const undo = () => {
    setPast((items) => {
      if (!items.length) return items
      const previous = items.at(-1)
      setFuture((redoItems) => [elements, ...redoItems].slice(0, 50))
      setElements(previous)
      setSelectedId(null)
      setSelectedIds([])
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
      setSelectedIds([])
      return items.slice(1)
    })
  }

  const copyTikz = async () => {
    await navigator.clipboard.writeText(tikzCode)
    setCopyLabel('Copiado')
    window.setTimeout(() => setCopyLabel('Copy .TeX code'), 1200)
  }

  const downloadTikz = () => {
    downloadBlob(new Blob([tikzCode], { type: 'text/plain;charset=utf-8' }), 'sketch-tikz.tex')
  }

  const copySelection = async () => {
    if (!selectedElements.length) return
    setClipboardElements(selectedElements)
    await navigator.clipboard.writeText(JSON.stringify({ version: 1, elements: selectedElements }, null, 2))
  }

  const pasteSelection = (sourceElements = clipboardElements) => {
    if (!sourceElements.length) return
    const clones = sourceElements.map((element) => cloneElementForPaste(element))
    commitElementsWithSelection([...elements, ...clones], clones.map((element) => element.id))
    setTool('select')
  }

  const duplicateSelection = () => {
    if (!selectedElements.length) return
    pasteSelection(selectedElements)
  }

  const replaceSelectedWithPreset = (presetId) => {
    if (!selectedElement) return
    const preset = libraryPaletteItems.find((item) => item.id === presetId)
    if (!preset) return
    const prefix = circuitAutoPrefix(preset)
    const matchingCircuitCount = prefix
      ? elements.filter((element) => {
          const candidatePreset = element.type === 'library' ? getLibraryPreset(element) : null
          return candidatePreset && circuitAutoPrefix(candidatePreset) === prefix
        }).length
      : 0

    const origin =
      selectedElement.origin ??
      selectedElement.position ??
      {
        x: ((selectedElement.start?.x ?? 0) + (selectedElement.end?.x ?? 0)) / 2,
        y: ((selectedElement.start?.y ?? 0) + (selectedElement.end?.y ?? 0)) / 2,
      }
    const replacement = {
      ...makeLibraryElement(preset, origin),
      id: createId(),
      stroke: selectedElement.stroke ?? settings.stroke,
      fill: selectedElement.fill ?? settings.fill,
      fillOpacity: selectedElement.fillOpacity ?? settings.fillOpacity,
      scale: selectedElement.scale ?? settings.objectScale,
      tikzOptions: selectedElement.tikzOptions ?? settings.tikzOptions,
    }
    if (prefix) {
      replacement.config = {
        ...replacement.config,
        circuitLabel: `${prefix}_${matchingCircuitCount + 1}`,
      }
    }
    commitElements(
      elements.map((element) => (element.id === selectedElement.id ? replacement : element)),
      replacement.id,
    )
    setContextMenu(null)
  }

  const currentBoardPayload = () => ({
    version: 1,
    exportedAt: new Date().toISOString(),
    elements,
    settings,
    theme,
    viewport: { canvasPan, zoom },
  })

  const downloadBoardState = () => {
    const payload = currentBoardPayload()
    downloadBlob(
      new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' }),
      'tikz-sketch-board.json',
    )
  }

  const downloadOverleafZip = () => {
    const payload = currentBoardPayload()
    const mainTex = buildTikz(elements, {
      ...settings,
      includeGrid: settings.exportGrid,
      monochrome: settings.monochromeExport,
      wrapFigure: false,
      exportPreset: 'standalone',
      journalStyle: settings.journalStyle,
    })
    const readme = [
      '# TikZ Sketch Converter export',
      '',
      'Upload this zip to Overleaf or unzip it locally.',
      '',
      '- `main.tex` is a standalone compilable figure.',
      '- `board.json` keeps the editable board state for TikZ Sketch Converter.',
      '',
      'Made by Guillem Moreno Garcia.',
    ].join('\n')
    const zip = createZipBlob([
      { name: 'main.tex', content: mainTex },
      { name: 'board.json', content: JSON.stringify(payload, null, 2) },
      { name: 'README.md', content: readme },
    ])
    downloadBlob(zip, 'tikz-sketch-overleaf.zip')
  }

  const copyShareUrl = async () => {
    const payload = currentBoardPayload()
    const encoded = encodeBoardPayload(payload)
    const nextUrl = `${window.location.origin}${window.location.pathname}${window.location.search}#board=${encoded}`
    await navigator.clipboard.writeText(nextUrl)
    window.history.replaceState(null, '', nextUrl)
    setShareLabel('URL copiada')
    window.setTimeout(() => setShareLabel('Copiar URL'), 1400)
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
      setSelectedIds(nextElements[0]?.id ? [nextElements[0].id] : [])
      setFuture([])
      if (payload.settings && typeof payload.settings === 'object') {
        setSettings((state) => ({ ...state, ...payload.settings }))
      }
      if (payload.theme === 'dark' || payload.theme === 'light') setTheme(payload.theme)
      if (payload.viewport && typeof payload.viewport === 'object') {
        if (payload.viewport.canvasPan) setCanvasPan(payload.viewport.canvasPan)
        if (payload.viewport.zoom) setCanvasZoom(payload.viewport.zoom)
      }
      setTool('select')
    } catch (error) {
      window.alert(`No pude importar ese archivo: ${error.message}`)
    } finally {
      event.target.value = ''
    }
  }

  const serializeCanvasSvg = () => {
    if (!svgRef.current) return
    const clone = svgRef.current.cloneNode(true)
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    clone.setAttribute('width', `${CANVAS.width}`)
    clone.setAttribute('height', `${CANVAS.height}`)
    if (settings.exportTransparent) {
      clone.querySelector('rect')?.setAttribute('fill', 'transparent')
    }
    if (settings.exportCrop && elements.some((element) => !element.hidden)) {
      const bounds = mergeBounds(elements.filter((element) => !element.hidden).map(elementBounds))
      const topLeft = worldToScreen({ x: bounds.minX, y: bounds.maxY })
      const bottomRight = worldToScreen({ x: bounds.maxX, y: bounds.minY })
      const margin = Number(settings.exportMargin) || 0
      const crop = {
        x: Math.max(0, Math.min(topLeft.x, bottomRight.x) - margin),
        y: Math.max(0, Math.min(topLeft.y, bottomRight.y) - margin),
        width: Math.min(CANVAS.width, Math.abs(bottomRight.x - topLeft.x) + margin * 2),
        height: Math.min(CANVAS.height, Math.abs(bottomRight.y - topLeft.y) + margin * 2),
      }
      clone.setAttribute('viewBox', `${formatNumber(crop.x)} ${formatNumber(crop.y)} ${formatNumber(crop.width)} ${formatNumber(crop.height)}`)
      clone.setAttribute('width', `${Math.max(1, Math.round(crop.width))}`)
      clone.setAttribute('height', `${Math.max(1, Math.round(crop.height))}`)
    }

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

    return new XMLSerializer().serializeToString(clone)
  }

  const downloadCanvasSvg = () => {
    const svgText = serializeCanvasSvg()
    if (!svgText) return
    downloadBlob(new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' }), 'tikz-sketch-board.svg')
  }

  const downloadCanvasPng = async () => {
    const svgText = serializeCanvasSvg()
    if (!svgText) return
    const svgBlob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)

    try {
      const image = new Image()
      await new Promise((resolve, reject) => {
        image.onload = resolve
        image.onerror = reject
        image.src = url
      })

      const pixelRatio = Math.max(1, Math.min(6, Number(settings.exportScale) || 2))
      const canvas = document.createElement('canvas')
      canvas.width = CANVAS.width * pixelRatio
      canvas.height = CANVAS.height * pixelRatio
      const context = canvas.getContext('2d')
      if (!settings.exportTransparent) {
        context.fillStyle = '#ffffff'
        context.fillRect(0, 0, canvas.width, canvas.height)
      }
      context.scale(pixelRatio, pixelRatio)
      context.drawImage(image, 0, 0, CANVAS.width, CANVAS.height)

      const pngBlob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png', 1))
      if (pngBlob) downloadBlob(pngBlob, 'tikz-sketch-board.png')
    } finally {
      URL.revokeObjectURL(url)
    }
  }

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLSelectElement) return
      const key = event.key.toLowerCase()
      const modifier = event.ctrlKey || event.metaKey

      if (modifier && key === 'z') {
        event.preventDefault()
        if (event.shiftKey) redo()
        else undo()
      } else if (modifier && key === 'y') {
        event.preventDefault()
        redo()
      } else if (modifier && key === 'c') {
        event.preventDefault()
        copySelection()
      } else if (modifier && key === 'v') {
        event.preventDefault()
        pasteSelection()
      } else if (modifier && key === 'd') {
        event.preventDefault()
        duplicateSelection()
      } else if (modifier && key === 'e') {
        event.preventDefault()
        downloadTikz()
      } else if (key === 'delete' || key === 'backspace') {
        event.preventDefault()
        deleteSelected()
      } else if (key === 'v') {
        setTool('select')
      } else if (key === 'h') {
        setTool('pan')
      } else if (key === 'l') {
        setTool('line')
      } else if (key === 'a') {
        setTool('arrow')
      } else if (key === 'p') {
        setTool('pen')
      } else if (key === 'g') {
        setSettings((state) => ({ ...state, snap: !state.snap }))
      } else if (key === 't') {
        setSettings((state) => ({ ...state, terminalSnap: !state.terminalSnap }))
      } else if (key === '+') {
        setCanvasZoom(zoom + 0.1)
      } else if (key === '-') {
        setCanvasZoom(zoom - 0.1)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
    // Keyboard bindings intentionally track the latest render state; keeping this local avoids a wide useCallback refactor.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom])

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
    const labelStyle = {
      fill: previewStroke,
      fontSize: 11,
      fontFamily: '"Times New Roman", Georgia, serif',
      textAnchor: 'middle',
    }
    const terminalLabel = (x, y, text) => (
      <text x={sx(x)} y={sy(y)} {...labelStyle}>
        {text}
      </text>
    )
    const renderMosPreview = (kind) => {
      const isPmos = kind === 'pmos'
      return (
        <g>
          <line {...shapeCommon} x1={sx(0.18)} y1={sy(0.5)} x2={sx(0.38)} y2={sy(0.5)} />
          <line {...shapeCommon} x1={sx(0.38)} y1={sy(0.28)} x2={sx(0.38)} y2={sy(0.72)} />
          {isPmos && <circle {...shapeCommon} cx={sx(0.46)} cy={sy(0.5)} r={Math.max(3, Math.min(baseWidth, baseHeight) * 0.04)} />}
          <line {...shapeCommon} x1={sx(0.52)} y1={sy(0.3)} x2={sx(0.52)} y2={sy(0.7)} />
          <line {...shapeCommon} x1={sx(0.52)} y1={sy(0.3)} x2={sx(0.78)} y2={sy(0.16)} />
          <line {...shapeCommon} x1={sx(0.52)} y1={sy(0.7)} x2={sx(0.78)} y2={sy(0.84)} />
          <line {...shapeCommon} x1={sx(0.78)} y1={sy(0.16)} x2={sx(0.9)} y2={sy(0.16)} />
          <line {...shapeCommon} x1={sx(0.78)} y1={sy(0.84)} x2={sx(0.9)} y2={sy(0.84)} />
          <path
            {...shapeCommon}
            d={
              isPmos
                ? `M ${sx(0.64)} ${sy(0.61)} l ${baseWidth * 0.08} ${baseHeight * 0.06} m ${-baseWidth * 0.01} ${-baseHeight * 0.1} l ${baseWidth * 0.01} ${baseHeight * 0.1} l ${-baseWidth * 0.09} ${baseHeight * 0.01}`
                : `M ${sx(0.72)} ${sy(0.61)} l ${-baseWidth * 0.08} ${-baseHeight * 0.06} m ${baseWidth * 0.01} ${baseHeight * 0.1} l ${-baseWidth * 0.01} ${-baseHeight * 0.1} l ${baseWidth * 0.09} ${-baseHeight * 0.01}`
            }
          />
          {terminalLabel(0.2, 0.4, 'G')}
          {terminalLabel(0.9, 0.11, 'D')}
          {terminalLabel(0.9, 0.95, 'S')}
        </g>
      )
    }
    const renderBjtPreview = (kind) => {
      const isPnp = kind === 'pnp'
      return (
        <g>
          <circle {...shapeCommon} cx={sx(0.55)} cy={sy(0.5)} r={Math.max(14, Math.min(baseWidth, baseHeight) * 0.18)} />
          <line {...shapeCommon} x1={sx(0.2)} y1={sy(0.5)} x2={sx(0.44)} y2={sy(0.5)} />
          <line {...shapeCommon} x1={sx(0.44)} y1={sy(0.3)} x2={sx(0.44)} y2={sy(0.7)} />
          <line {...shapeCommon} x1={sx(0.44)} y1={sy(0.36)} x2={sx(0.78)} y2={sy(0.18)} />
          <line {...shapeCommon} x1={sx(0.44)} y1={sy(0.64)} x2={sx(0.78)} y2={sy(0.82)} />
          <line {...shapeCommon} x1={sx(0.78)} y1={sy(0.18)} x2={sx(0.9)} y2={sy(0.18)} />
          <line {...shapeCommon} x1={sx(0.78)} y1={sy(0.82)} x2={sx(0.9)} y2={sy(0.82)} />
          <path
            {...shapeCommon}
            d={
              isPnp
                ? `M ${sx(0.55)} ${sy(0.58)} l ${baseWidth * 0.11} ${-baseHeight * 0.02} l ${-baseWidth * 0.06} ${-baseHeight * 0.1}`
                : `M ${sx(0.66)} ${sy(0.73)} l ${-baseWidth * 0.1} ${-baseHeight * 0.02} l ${baseWidth * 0.05} ${baseHeight * 0.1}`
            }
          />
          {terminalLabel(0.2, 0.4, 'B')}
          {terminalLabel(0.9, 0.12, 'C')}
          {terminalLabel(0.9, 0.96, 'E')}
        </g>
      )
    }
    const renderCircuitPreview = (kind) => {
      if (kind === 'nmos' || kind === 'pmos') return renderMosPreview(kind)
      if (kind === 'npn' || kind === 'pnp') return renderBjtPreview(kind)

      if (kind === 'differential-pair') {
        return (
          <g>
            {[0.36, 0.64].map((cx, index) => (
              <g key={index}>
                <circle {...shapeCommon} cx={sx(cx)} cy={sy(0.46)} r={Math.max(8, Math.min(baseWidth, baseHeight) * 0.1)} />
                <line {...shapeCommon} x1={sx(cx - 0.18)} y1={sy(0.46)} x2={sx(cx - 0.06)} y2={sy(0.46)} />
                <line {...shapeCommon} x1={sx(cx - 0.06)} y1={sy(0.36)} x2={sx(cx - 0.06)} y2={sy(0.58)} />
                <line {...shapeCommon} x1={sx(cx - 0.06)} y1={sy(0.38)} x2={sx(cx + 0.1)} y2={sy(0.24)} />
                <line {...shapeCommon} x1={sx(cx - 0.06)} y1={sy(0.56)} x2={sx(cx + 0.1)} y2={sy(0.72)} />
              </g>
            ))}
            <line {...shapeCommon} x1={sx(0.46)} y1={sy(0.72)} x2={sx(0.5)} y2={sy(0.88)} />
            <line {...shapeCommon} x1={sx(0.74)} y1={sy(0.72)} x2={sx(0.5)} y2={sy(0.88)} />
            <line {...shapeCommon} x1={sx(0.5)} y1={sy(0.88)} x2={sx(0.5)} y2={sy(0.96)} />
          </g>
        )
      }

      if (kind === 'switch') {
        return (
          <g>
            <line {...shapeCommon} x1={sx(0.08)} y1={sy(0.5)} x2={sx(0.38)} y2={sy(0.5)} />
            <line {...shapeCommon} x1={sx(0.5)} y1={sy(0.42)} x2={sx(0.7)} y2={sy(0.26)} />
            <circle {...shapeCommon} cx={sx(0.4)} cy={sy(0.5)} r="3" />
            <circle {...shapeCommon} cx={sx(0.72)} cy={sy(0.5)} r="3" />
            <line {...shapeCommon} x1={sx(0.72)} y1={sy(0.5)} x2={sx(0.92)} y2={sy(0.5)} />
          </g>
        )
      }

      if (kind === 'transformer') {
        return (
          <g>
            {[0, 1, 2].map((index) => (
              <path key={`l-${index}`} {...shapeCommon} d={`M ${sx(0.18 + index * 0.055)} ${sy(0.32)} q ${baseWidth * 0.055} ${baseHeight * 0.18} 0 ${baseHeight * 0.36}`} />
            ))}
            {[0, 1, 2].map((index) => (
              <path key={`r-${index}`} {...shapeCommon} d={`M ${sx(0.68 + index * 0.055)} ${sy(0.32)} q ${baseWidth * 0.055} ${baseHeight * 0.18} 0 ${baseHeight * 0.36}`} />
            ))}
            <line {...shapeCommon} x1={sx(0.48)} y1={sy(0.24)} x2={sx(0.48)} y2={sy(0.76)} opacity="0.55" />
            <line {...shapeCommon} x1={sx(0.53)} y1={sy(0.24)} x2={sx(0.53)} y2={sy(0.76)} opacity="0.55" />
          </g>
        )
      }

      if (kind === 'transmission-line') {
        return (
          <g>
            <line {...shapeCommon} x1={sx(0.08)} y1={sy(0.42)} x2={sx(0.92)} y2={sy(0.42)} />
            <line {...shapeCommon} x1={sx(0.08)} y1={sy(0.58)} x2={sx(0.92)} y2={sy(0.58)} />
            <text x={sx(0.5)} y={sy(0.24)} {...labelStyle}>
              Z0
            </text>
          </g>
        )
      }

      if (kind === 'port') {
        return (
          <g>
            <circle {...shapeCommon} cx={sx(0.24)} cy={sy(0.5)} r={Math.max(8, Math.min(baseWidth, baseHeight) * 0.11)} />
            <line {...shapeCommon} x1={sx(0.32)} y1={sy(0.5)} x2={sx(0.88)} y2={sy(0.5)} />
            {terminalLabel(0.6, 0.32, 'Z0')}
          </g>
        )
      }

      if (kind === 'voltmeter' || kind === 'ammeter') {
        const label = kind === 'voltmeter' ? 'V' : 'A'
        return (
          <g>
            <line {...shapeCommon} x1={sx(0.08)} y1={sy(0.5)} x2={sx(0.34)} y2={sy(0.5)} />
            <circle {...shapeCommon} cx={sx(0.5)} cy={sy(0.5)} r={Math.max(12, Math.min(baseWidth, baseHeight) * 0.16)} />
            <text x={sx(0.5)} y={sy(0.55)} {...labelStyle}>
              {label}
            </text>
            <line {...shapeCommon} x1={sx(0.66)} y1={sy(0.5)} x2={sx(0.92)} y2={sy(0.5)} />
          </g>
        )
      }

      if (kind === 'controlled-source') {
        return (
          <g>
            <line {...shapeCommon} x1={sx(0.08)} y1={sy(0.5)} x2={sx(0.34)} y2={sy(0.5)} />
            <path {...shapeCommon} d={`M ${sx(0.5)} ${sy(0.25)} L ${sx(0.68)} ${sy(0.5)} L ${sx(0.5)} ${sy(0.75)} L ${sx(0.32)} ${sy(0.5)} Z`} />
            <text x={sx(0.5)} y={sy(0.55)} {...labelStyle}>
              +
            </text>
            <line {...shapeCommon} x1={sx(0.68)} y1={sy(0.5)} x2={sx(0.92)} y2={sy(0.5)} />
          </g>
        )
      }

      if (kind === 'current-source') {
        return (
          <g>
            <line {...shapeCommon} x1={sx(0.08)} y1={sy(0.5)} x2={sx(0.34)} y2={sy(0.5)} />
            <circle {...shapeCommon} cx={sx(0.5)} cy={sy(0.5)} r={Math.max(12, Math.min(baseWidth, baseHeight) * 0.16)} />
            <line {...shapeCommon} x1={sx(0.5)} y1={sy(0.66)} x2={sx(0.5)} y2={sy(0.35)} />
            <path {...shapeCommon} d={`M ${sx(0.5)} ${sy(0.35)} l ${-baseWidth * 0.035} ${baseHeight * 0.06} m ${baseWidth * 0.035} ${-baseHeight * 0.06} l ${baseWidth * 0.035} ${baseHeight * 0.06}`} />
            <line {...shapeCommon} x1={sx(0.66)} y1={sy(0.5)} x2={sx(0.92)} y2={sy(0.5)} />
          </g>
        )
      }

      if (kind === 'battery') {
        return (
          <g>
            <line {...shapeCommon} x1={sx(0.08)} y1={sy(0.5)} x2={sx(0.4)} y2={sy(0.5)} />
            <line {...shapeCommon} x1={sx(0.43)} y1={sy(0.32)} x2={sx(0.43)} y2={sy(0.68)} />
            <line {...shapeCommon} x1={sx(0.55)} y1={sy(0.4)} x2={sx(0.55)} y2={sy(0.6)} />
            <line {...shapeCommon} x1={sx(0.58)} y1={sy(0.5)} x2={sx(0.92)} y2={sy(0.5)} />
          </g>
        )
      }

      if (kind === 'lamp') {
        return (
          <g>
            <line {...shapeCommon} x1={sx(0.08)} y1={sy(0.5)} x2={sx(0.34)} y2={sy(0.5)} />
            <circle {...shapeCommon} cx={sx(0.5)} cy={sy(0.5)} r={Math.max(12, Math.min(baseWidth, baseHeight) * 0.16)} />
            <line {...shapeCommon} x1={sx(0.4)} y1={sy(0.38)} x2={sx(0.6)} y2={sy(0.62)} />
            <line {...shapeCommon} x1={sx(0.6)} y1={sy(0.38)} x2={sx(0.4)} y2={sy(0.62)} />
            <line {...shapeCommon} x1={sx(0.66)} y1={sy(0.5)} x2={sx(0.92)} y2={sy(0.5)} />
          </g>
        )
      }

      if (kind === 'led' || kind === 'zener') {
        return (
          <g>
            <line {...shapeCommon} x1={sx(0.08)} y1={sy(0.5)} x2={sx(0.34)} y2={sy(0.5)} />
            <path {...shapeCommon} d={`M ${sx(0.34)} ${sy(0.28)} L ${sx(0.62)} ${sy(0.5)} L ${sx(0.34)} ${sy(0.72)} Z`} />
            <path {...shapeCommon} d={kind === 'zener' ? `M ${sx(0.64)} ${sy(0.28)} l ${baseWidth * 0.04} ${baseHeight * 0.06} v ${baseHeight * 0.34} l ${-baseWidth * 0.04} ${baseHeight * 0.06}` : `M ${sx(0.64)} ${sy(0.28)} v ${baseHeight * 0.44}`} />
            <line {...shapeCommon} x1={sx(0.64)} y1={sy(0.5)} x2={sx(0.92)} y2={sy(0.5)} />
            {kind === 'led' && (
              <>
                <line {...shapeCommon} x1={sx(0.7)} y1={sy(0.24)} x2={sx(0.84)} y2={sy(0.1)} />
                <line {...shapeCommon} x1={sx(0.62)} y1={sy(0.2)} x2={sx(0.76)} y2={sy(0.06)} />
              </>
            )}
          </g>
        )
      }

      if (kind === 'diff-probe') {
        return (
          <g>
            <line {...shapeCommon} x1={sx(0.08)} y1={sy(0.5)} x2={sx(0.32)} y2={sy(0.5)} />
            <circle {...shapeCommon} cx={sx(0.43)} cy={sy(0.5)} r="9" />
            <text x={sx(0.43)} y={sy(0.56)} {...labelStyle}>
              +
            </text>
            <circle {...shapeCommon} cx={sx(0.61)} cy={sy(0.5)} r="9" />
            <text x={sx(0.61)} y={sy(0.55)} {...labelStyle}>
              -
            </text>
            <line {...shapeCommon} x1={sx(0.7)} y1={sy(0.5)} x2={sx(0.92)} y2={sy(0.5)} />
          </g>
        )
      }

      return null
    }

    const renderPreview = () => {
      const circuitPreview = renderCircuitPreview(circuitPreviewKind(preset))
      if (circuitPreview) return circuitPreview

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

  const renderSelectionHandles = (bounds) => {
    const topLeft = worldToScreen({ x: bounds.minX, y: bounds.maxY })
    const bottomRight = worldToScreen({ x: bounds.maxX, y: bounds.minY })
    const rotatePoint = { x: bottomRight.x + 22, y: topLeft.y - 22 }
    const startResize = (event) => {
      event.stopPropagation()
      const point = getWorldPoint(event)
      svgRef.current?.setPointerCapture?.(event.pointerId)
      setInteraction({
        mode: 'resize-selection',
        origin: point,
        bounds,
        originals: selectedElements,
        snapshot: elements,
        moved: false,
      })
    }
    const startRotate = (event) => {
      event.stopPropagation()
      const point = getWorldPoint(event)
      const center = boundsCenter(bounds)
      svgRef.current?.setPointerCapture?.(event.pointerId)
      setInteraction({
        mode: 'rotate-selection',
        startAngle: (Math.atan2(point.y - center.y, point.x - center.x) * 180) / Math.PI,
        bounds,
        originals: selectedElements,
        snapshot: elements,
        moved: false,
      })
    }

    return (
      <>
        <rect
          x={topLeft.x}
          y={topLeft.y}
          width={bottomRight.x - topLeft.x}
          height={bottomRight.y - topLeft.y}
          fill="none"
          stroke="#111111"
          strokeDasharray="3 3"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
          pointerEvents="none"
        />
        <rect
          x={bottomRight.x - 5}
          y={bottomRight.y - 5}
          width="10"
          height="10"
          className="resize-handle"
          onPointerDown={startResize}
        />
        <line x1={bottomRight.x} y1={topLeft.y} x2={rotatePoint.x} y2={rotatePoint.y} stroke="#111111" strokeWidth="1" />
        <circle cx={rotatePoint.x} cy={rotatePoint.y} r="6" className="rotate-handle" onPointerDown={startRotate} />
      </>
    )
  }

  const gridLines = useMemo(() => {
    const lines = []
    const minX = Math.ceil(worldBounds.minX) - 24
    const maxX = Math.floor(worldBounds.maxX) + 24
    const minY = Math.ceil(worldBounds.minY) - 18
    const maxY = Math.floor(worldBounds.maxY) + 18
    for (let x = minX; x <= maxX; x += 1) {
      const start = worldToScreen({ x, y: minY })
      const end = worldToScreen({ x, y: maxY })
      lines.push({ id: `x-${x}`, x1: start.x, y1: start.y, x2: end.x, y2: end.y, axis: x === 0 })
    }
    for (let y = minY; y <= maxY; y += 1) {
      const start = worldToScreen({ x: minX, y })
      const end = worldToScreen({ x: maxX, y })
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
            <button type="button" className="ghost-button" onClick={downloadOverleafZip}>
              <Download size={17} />
              Overleaf ZIP
            </button>
            <button type="button" className="ghost-button" onClick={downloadCanvasPng}>
              <Download size={17} />
              Exportar PNG
            </button>
            <button type="button" className="ghost-button" onClick={downloadCanvasSvg}>
              <Download size={17} />
              Exportar SVG
            </button>
            <button type="button" className="ghost-button" onClick={copyShareUrl}>
              <Link size={17} />
              {shareLabel}
            </button>
            <button type="button" className="ghost-button" onClick={() => setHelpOpen(true)}>
              <BookOpen size={17} />
              Ayuda
            </button>
            <button type="button" className="ghost-button" onClick={() => setSettingsOpen(true)}>
              <Settings size={17} />
              Ajustes
            </button>
            <button type="button" className="ghost-button icon-only" onClick={() => setTheme((value) => (value === 'dark' ? 'light' : 'dark'))} title="Cambiar tema" aria-label="Cambiar tema">
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
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
              viewBox={`${formatNumber(canvasPan.x)} ${formatNumber(canvasPan.y)} ${CANVAS.width} ${CANVAS.height}`}
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
              onContextMenu={(event) => event.preventDefault()}
            >
              <rect x={canvasPan.x} y={canvasPan.y} width={CANVAS.width} height={CANVAS.height} fill="#ffffff" />
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
                {elements
                  .filter((element) => !element.hidden)
                  .map((element) => {
                    const center = worldToScreen(boundsCenter(elementBounds(element)))
                    const rotation = Number(element.rotation) || 0
                    return (
                      <g
                        key={element.id}
                        className={`canvas-element ${selectedIds.includes(element.id) ? 'is-selected' : ''} ${element.locked ? 'is-locked' : ''}`}
                        transform={rotation ? `rotate(${-rotation} ${center.x} ${center.y})` : undefined}
                        onPointerDown={(event) => handleElementPointerDown(event, element)}
                        onContextMenu={(event) => handleElementContextMenu(event, element)}
                      >
                        {renderElementHitTarget(element)}
                        {selectedIds.includes(element.id) && renderElementShape(element, true)}
                        {renderElementShape(element)}
                      </g>
                    )
                  })}
              </g>
              {draft && <g className="draft-layer">{renderElementShape(draft)}</g>}
              {selectionBounds && (
                <g className="selection-handles">
                  {renderSelectionHandles(selectionBounds)}
                </g>
              )}
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
          <span>
            {selectedIds.length > 1
              ? `${selectedIds.length} seleccionados`
              : selectedElement
                ? elementLabel(selectedElement)
                : 'Sin seleccion'}
          </span>
          <span>x {formatNumber(mouseWorld.x)} - y {formatNumber(mouseWorld.y)}</span>
          <span>{settings.snap ? `Grid ${SNAP_STEP}` : 'Grid libre'} - {settings.terminalSnap ? 'terminales' : 'sin terminales'}</span>
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
              <span>Grid snap</span>
            </label>
            <label className="toggle">
              <input
                type="checkbox"
                checked={settings.terminalSnap}
                onChange={(event) => setSettings((state) => ({ ...state, terminalSnap: event.target.checked }))}
              />
              <span>Terminales</span>
            </label>
            <label className="toggle">
              <input
                type="checkbox"
                checked={settings.routeWires}
                onChange={(event) => setSettings((state) => ({ ...state, routeWires: event.target.checked }))}
              />
              <span>Cable 90°</span>
            </label>
          </div>
        </section>

        <section className="panel-section layers-section">
          <div className="panel-title">
            <Layers size={18} />
            <h2>Capas y layout</h2>
          </div>
          <label className="field">
            <span>Buscar capa</span>
            <input value={layerSearch} onChange={(event) => setLayerSearch(event.target.value)} placeholder="nombre, tipo, formula..." />
          </label>
          <div className="layer-action-grid">
            <button type="button" className="ghost-button" onClick={() => alignSelected('left')} disabled={selectedIds.length < 2}>
              Align L
            </button>
            <button type="button" className="ghost-button" onClick={() => alignSelected('hcenter')} disabled={selectedIds.length < 2}>
              Center X
            </button>
            <button type="button" className="ghost-button" onClick={() => alignSelected('right')} disabled={selectedIds.length < 2}>
              Align R
            </button>
            <button type="button" className="ghost-button" onClick={() => alignSelected('top')} disabled={selectedIds.length < 2}>
              Top
            </button>
            <button type="button" className="ghost-button" onClick={() => alignSelected('vcenter')} disabled={selectedIds.length < 2}>
              Center Y
            </button>
            <button type="button" className="ghost-button" onClick={() => alignSelected('bottom')} disabled={selectedIds.length < 2}>
              Bottom
            </button>
            <button type="button" className="ghost-button" onClick={() => distributeSelected('x')} disabled={selectedIds.length < 3}>
              Space X
            </button>
            <button type="button" className="ghost-button" onClick={() => distributeSelected('y')} disabled={selectedIds.length < 3}>
              Space Y
            </button>
            <button type="button" className="ghost-button" onClick={makeSelectedSameSize} disabled={selectedIds.length < 2}>
              Same size
            </button>
            <button type="button" className="ghost-button" onClick={groupSelected} disabled={selectedIds.length < 2}>
              Group
            </button>
            <button type="button" className="ghost-button" onClick={ungroupSelected} disabled={!selectedIds.length}>
              Ungroup
            </button>
          </div>
          <div className="layer-list">
            {visibleLayerElements.map((element) => (
              <div key={element.id} className={`layer-row ${selectedIds.includes(element.id) ? 'is-active' : ''}`}>
                <button type="button" className="layer-name" onClick={() => selectOnly(element.id)}>
                  <strong>{elementDisplayName(element)}</strong>
                  <small>
                    {element.type}
                    {element.groupId ? ` · ${element.groupId}` : ''}
                  </small>
                </button>
                <button type="button" title="Visible" onClick={() => updateElementById(element.id, { hidden: !element.hidden })}>
                  {element.hidden ? 'H' : 'V'}
                </button>
                <button type="button" title="Lock" onClick={() => updateElementById(element.id, { locked: !element.locked })}>
                  {element.locked ? 'L' : 'U'}
                </button>
                <button type="button" title="Back" onClick={() => reorderElement(element.id, -1)}>
                  ↓
                </button>
                <button type="button" title="Front" onClick={() => reorderElement(element.id, 1)}>
                  ↑
                </button>
              </div>
            ))}
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
            <button type="button" className="ghost-button full" onClick={importEditableTikzSnippet}>
              Importar como objeto editable
            </button>
          </details>
        </section>

        <section className="panel-section grow">
          <div className="panel-title">
            <Sparkles size={18} />
          <h2>Seleccion</h2>
          </div>
          {!selectedElement && (
            <>
              <p className="empty-state">Selecciona un elemento del lienzo para editarlo o convertir trazos a figuras.</p>
              <button type="button" className="ghost-button full" onClick={() => pasteSelection()} disabled={!clipboardElements.length}>
                <Files size={17} />
                Pegar seleccion
              </button>
            </>
          )}
          {selectedElement && (
            <div className="selection-editor">
              <div className="selected-heading">
                <span>{selectedIds.length > 1 ? `${selectedIds.length} elementos` : elementLabel(selectedElement)}</span>
                <button type="button" className="icon-danger" title="Eliminar" aria-label="Eliminar seleccionado" onClick={deleteSelected}>
                  <Trash2 size={17} />
                </button>
              </div>
              <div className="selection-actions">
                <button type="button" className="ghost-button" onClick={copySelection}>
                  <Copy size={16} />
                  Copiar sel.
                </button>
                <button type="button" className="ghost-button" onClick={() => pasteSelection()} disabled={!clipboardElements.length}>
                  <Files size={16} />
                  Pegar
                </button>
                <button type="button" className="ghost-button" onClick={duplicateSelection}>
                  <CopyPlus size={16} />
                  Duplicar
                </button>
              </div>
              {selectedIds.length > 1 && (
                <p className="selection-note">
                  Edicion multiple activa: colores, grosor, discontinuidad y opciones TikZ se aplican a todos los objetos seleccionados.
                </p>
              )}
              <label className="field">
                <span>Nombre en capas</span>
                <input
                  type="text"
                  value={selectedElement.displayName ?? ''}
                  placeholder={elementDisplayName(selectedElement)}
                  onChange={(event) => updateSelected({ displayName: event.target.value })}
                />
              </label>
              <div className="field-pair">
                <label className="field">
                  <span>Rotacion</span>
                  <input
                    type="number"
                    step="1"
                    value={selectedElement.rotation ?? 0}
                    onChange={(event) => updateSelected({ rotation: Number(event.target.value) })}
                  />
                </label>
                <label className="field">
                  <span>Grupo</span>
                  <input
                    type="text"
                    value={selectedElement.groupId ?? ''}
                    onChange={(event) => updateSelected({ groupId: event.target.value })}
                  />
                </label>
              </div>
              {selectionBounds && (
                <div className="field-pair">
                  <label className="field">
                    <span>Ancho cm</span>
                    <input
                      type="number"
                      step="0.05"
                      value={formatNumber(selectionBounds.maxX - selectionBounds.minX)}
                      onChange={(event) => {
                        const width = Math.max(0.05, Number(event.target.value))
                        const center = boundsCenter(selectionBounds)
                        resizeElementToSelection({ minX: center.x - width / 2, maxX: center.x + width / 2, minY: selectionBounds.minY, maxY: selectionBounds.maxY })
                      }}
                    />
                  </label>
                  <label className="field">
                    <span>Alto cm</span>
                    <input
                      type="number"
                      step="0.05"
                      value={formatNumber(selectionBounds.maxY - selectionBounds.minY)}
                      onChange={(event) => {
                        const height = Math.max(0.05, Number(event.target.value))
                        const center = boundsCenter(selectionBounds)
                        resizeElementToSelection({ minX: selectionBounds.minX, maxX: selectionBounds.maxX, minY: center.y - height / 2, maxY: center.y + height / 2 })
                      }}
                    />
                  </label>
                </div>
              )}
              <div className="toggle-grid">
                <label className="toggle">
                  <input type="checkbox" checked={selectedElement.hidden ?? false} onChange={(event) => updateSelected({ hidden: event.target.checked })} />
                  <span>Oculto</span>
                </label>
                <label className="toggle">
                  <input type="checkbox" checked={selectedElement.locked ?? false} onChange={(event) => updateSelected({ locked: event.target.checked })} />
                  <span>Bloqueado</span>
                </label>
              </div>
              <label className="field">
                <span>Reemplazar por objeto TikZ</span>
                <select value="" onChange={(event) => replaceSelectedWithPreset(event.target.value)}>
                  <option value="" disabled>
                    Escoge un preset...
                  </option>
                  {libraryPaletteItems.slice(0, 80).map((preset) => (
                    <option key={preset.id} value={preset.id}>
                      {preset.group} - {preset.title}
                    </option>
                  ))}
                </select>
              </label>
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
                  <div className="object-config">
                    <div className="toggle-grid">
                      {[
                        ['showXIntercepts', 'Cortes X'],
                        ['showYIntercept', 'Corte Y'],
                        ['showExtrema', 'Extremos'],
                        ['showSamples', 'Muestras'],
                        ['showTangent', 'Tangente'],
                        ['showAsymptotes', 'Asintotas'],
                        ['usePgfplots', 'PGFPlots'],
                      ].map(([key, label]) => (
                        <label key={key} className="toggle">
                          <input
                            type="checkbox"
                            checked={functionOptionsFor(selectedElement)[key]}
                            onChange={(event) => updateSelectedFunctionOptions({ [key]: event.target.checked })}
                          />
                          <span>{label}</span>
                        </label>
                      ))}
                    </div>
                    <div className="field-pair">
                      <label className="field">
                        <span>Tipo eje</span>
                        <select
                          value={functionOptionsFor(selectedElement).axisType}
                          onChange={(event) => updateSelectedFunctionOptions({ axisType: event.target.value })}
                        >
                          <option value="axis">axis</option>
                          <option value="semilogxaxis">semilog x</option>
                          <option value="semilogyaxis">semilog y</option>
                        </select>
                      </label>
                      <label className="field">
                        <span>Marcador</span>
                        <select
                          value={functionOptionsFor(selectedElement).markerStyle}
                          onChange={(event) => updateSelectedFunctionOptions({ markerStyle: event.target.value })}
                        >
                          <option value="none">Sin marcador</option>
                          <option value="*">*</option>
                          <option value="square*">square</option>
                          <option value="triangle*">triangle</option>
                          <option value="x">x</option>
                        </select>
                      </label>
                    </div>
                    <div className="toggle-grid">
                      {[
                        ['logX', 'Log X'],
                        ['logY', 'Log Y'],
                        ['clip', 'Clip axis'],
                        ['errorBars', 'Error bars'],
                      ].map(([key, label]) => (
                        <label key={key} className="toggle">
                          <input
                            type="checkbox"
                            checked={functionOptionsFor(selectedElement)[key]}
                            onChange={(event) => updateSelectedFunctionOptions({ [key]: event.target.checked })}
                          />
                          <span>{label}</span>
                        </label>
                      ))}
                    </div>
                    <div className="field-pair">
                      <label className="field">
                        <span>xlabel</span>
                        <input
                          value={functionOptionsFor(selectedElement).xLabel}
                          onChange={(event) => updateSelectedFunctionOptions({ xLabel: event.target.value })}
                        />
                      </label>
                      <label className="field">
                        <span>ylabel</span>
                        <input
                          value={functionOptionsFor(selectedElement).yLabel}
                          onChange={(event) => updateSelectedFunctionOptions({ yLabel: event.target.value })}
                        />
                      </label>
                    </div>
                    <div className="field-pair">
                      <label className="field">
                        <span>Ticks X</span>
                        <input
                          value={functionOptionsFor(selectedElement).xTicks}
                          onChange={(event) => updateSelectedFunctionOptions({ xTicks: event.target.value })}
                          placeholder="-2,0,2"
                        />
                      </label>
                      <label className="field">
                        <span>Ticks Y</span>
                        <input
                          value={functionOptionsFor(selectedElement).yTicks}
                          onChange={(event) => updateSelectedFunctionOptions({ yTicks: event.target.value })}
                          placeholder="0,0.5,1"
                        />
                      </label>
                    </div>
                    <div className="field-pair">
                      <label className="field">
                        <span>Legend pos</span>
                        <select
                          value={functionOptionsFor(selectedElement).legendPos}
                          onChange={(event) => updateSelectedFunctionOptions({ legendPos: event.target.value })}
                        >
                          <option value="north east">north east</option>
                          <option value="north west">north west</option>
                          <option value="south east">south east</option>
                          <option value="south west">south west</option>
                          <option value="outer north east">outer north east</option>
                        </select>
                      </label>
                      <label className="field">
                        <span>Colormap</span>
                        <select
                          value={functionOptionsFor(selectedElement).colormap}
                          onChange={(event) => updateSelectedFunctionOptions({ colormap: event.target.value })}
                        >
                          <option value="">Sin colormap</option>
                          <option value="viridis">viridis</option>
                          <option value="hot">hot</option>
                          <option value="cool">cool</option>
                          <option value="blackwhite">blackwhite</option>
                        </select>
                      </label>
                    </div>
                    <label className="field">
                      <span>Leyenda</span>
                      <input
                        value={functionOptionsFor(selectedElement).legend}
                        onChange={(event) => updateSelectedFunctionOptions({ legend: event.target.value })}
                      />
                    </label>
                    <label className="field">
                      <span>Estilo tick labels</span>
                      <input
                        value={functionOptionsFor(selectedElement).tickLabelStyle}
                        onChange={(event) => updateSelectedFunctionOptions({ tickLabelStyle: event.target.value })}
                      />
                    </label>
                    {functionOptionsFor(selectedElement).errorBars && (
                      <label className="field">
                        <span>Opciones error bars</span>
                        <input
                          value={functionOptionsFor(selectedElement).errorBarOptions}
                          onChange={(event) => updateSelectedFunctionOptions({ errorBarOptions: event.target.value })}
                        />
                      </label>
                    )}
                    <label className="field">
                      <span>Coordenadas CSV/tabla</span>
                      <textarea
                        className="snippet-input"
                        value={functionOptionsFor(selectedElement).dataTable}
                        onChange={(event) => updateSelectedFunctionOptions({ dataTable: event.target.value })}
                        placeholder={'0,0\n1,0.8\n2,0.4'}
                      />
                    </label>
                    <label className="field">
                      <span>Opciones addplot</span>
                      <input
                        value={functionOptionsFor(selectedElement).plotOptions}
                        onChange={(event) => updateSelectedFunctionOptions({ plotOptions: event.target.value })}
                      />
                    </label>
                    <label className="field">
                      <span>Opciones axis extra</span>
                      <input
                        value={functionOptionsFor(selectedElement).axisOptions}
                        onChange={(event) => updateSelectedFunctionOptions({ axisOptions: event.target.value })}
                        placeholder="minor tick num=1, ymin=-1..."
                      />
                    </label>
                  </div>
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
                      {circuitTikzComponent(getLibraryPreset(selectedElement), selectedLibraryConfig) && (
                        <div className="circuit-config">
                          <label className="toggle">
                            <input
                              type="checkbox"
                              checked={selectedLibraryConfig.autoLabel}
                              onChange={(event) => updateSelectedLibraryConfig({ autoLabel: event.target.checked })}
                            />
                            <span>Auto etiqueta CircuitikZ</span>
                          </label>
                          <div className="field-pair">
                            <label className="field">
                              <span>Etiqueta</span>
                              <input
                                type="text"
                                value={selectedLibraryConfig.circuitLabel}
                                onChange={(event) => updateSelectedLibraryConfig({ circuitLabel: event.target.value })}
                              />
                            </label>
                            <label className="field">
                              <span>Valor</span>
                              <input
                                type="text"
                                value={selectedLibraryConfig.circuitValue}
                                onChange={(event) => updateSelectedLibraryConfig({ circuitValue: event.target.value })}
                                placeholder="10 k\\Omega"
                              />
                            </label>
                          </div>
                          <div className="field-pair">
                            <label className="field">
                              <span>Orientacion</span>
                              <select
                                value={selectedLibraryConfig.circuitOrientation}
                                onChange={(event) => updateSelectedLibraryConfig({ circuitOrientation: event.target.value })}
                              >
                                <option value="right">Derecha</option>
                                <option value="left">Izquierda</option>
                                <option value="up">Arriba</option>
                                <option value="down">Abajo</option>
                              </select>
                            </label>
                            <label className="field">
                              <span>IEC / American</span>
                              <select
                                value={selectedLibraryConfig.circuitStyle}
                                onChange={(event) => updateSelectedLibraryConfig({ circuitStyle: event.target.value })}
                              >
                                <option value="auto">Auto</option>
                                <option value="iec">IEC</option>
                                <option value="american">American</option>
                              </select>
                            </label>
                          </div>
                          <div className="field-pair">
                            <label className="field">
                              <span>Terminales</span>
                              <select
                                value={selectedLibraryConfig.terminalStyle}
                                onChange={(event) => updateSelectedLibraryConfig({ terminalStyle: event.target.value })}
                              >
                                <option value="none">Sin nodos</option>
                                <option value="filled">Rellenos</option>
                                <option value="open">Abiertos</option>
                                <option value="mixed">Mixto</option>
                              </select>
                            </label>
                            <label className="field">
                              <span>Longitud</span>
                              <input
                                type="number"
                                min="0.55"
                                max="5"
                                step="0.05"
                                value={selectedLibraryConfig.terminalLength}
                                onChange={(event) => updateSelectedLibraryConfig({ terminalLength: Number(event.target.value) })}
                              />
                            </label>
                          </div>
                          <div className="net-summary">
                            <strong>Topologia inferida</strong>
                            <span>{inferredNets.length} nets con conexiones compartidas</span>
                          </div>
                        </div>
                      )}
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
          <div className="field-pair">
            <label className="field">
              <span>Preset export</span>
              <select value={settings.exportPreset} onChange={(event) => setSettings((state) => ({ ...state, exportPreset: event.target.value }))}>
                {exportPresetOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Estilo paper</span>
              <select value={settings.journalStyle} onChange={(event) => setSettings((state) => ({ ...state, journalStyle: event.target.value }))}>
                {journalStyleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="field-pair">
            <label className="field">
              <span>Escala PNG/SVG</span>
              <input
                type="number"
                min="1"
                max="6"
                step="0.5"
                value={settings.exportScale}
                onChange={(event) => setSettings((state) => ({ ...state, exportScale: Number(event.target.value) }))}
              />
            </label>
            <label className="field">
              <span>Margen export</span>
              <input
                type="number"
                min="0"
                max="120"
                value={settings.exportMargin}
                onChange={(event) => setSettings((state) => ({ ...state, exportMargin: Number(event.target.value) }))}
              />
            </label>
          </div>
          <div className="toggle-grid">
            <label className="toggle">
              <input
                type="checkbox"
                checked={settings.exportTransparent}
                onChange={(event) => setSettings((state) => ({ ...state, exportTransparent: event.target.checked }))}
              />
              <span>Fondo transparente</span>
            </label>
            <label className="toggle">
              <input
                type="checkbox"
                checked={settings.exportCrop}
                onChange={(event) => setSettings((state) => ({ ...state, exportCrop: event.target.checked }))}
              />
              <span>Crop contenido</span>
            </label>
          </div>
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
          {tikzWarnings.length > 0 && (
            <div className="warning-list">
              {tikzWarnings.map((warning) => (
                <span key={warning}>{warning}</span>
              ))}
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
            <button type="button" className="ghost-button" onClick={downloadCanvasSvg}>
              <Download size={17} />
              Exportar SVG
            </button>
            <button type="button" className="ghost-button" onClick={downloadOverleafZip}>
              <Download size={17} />
              Overleaf ZIP
            </button>
            <button type="button" className="ghost-button" onClick={copyShareUrl}>
              <Link size={17} />
              {shareLabel}
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

      {contextMenu && (
        <div className="context-menu" style={{ left: contextMenu.x, top: contextMenu.y }} role="menu">
          <button type="button" onClick={copySelection}>
            <Copy size={15} />
            Copiar seleccion
          </button>
          <button type="button" onClick={duplicateSelection}>
            <CopyPlus size={15} />
            Duplicar
          </button>
          <button type="button" onClick={deleteSelected}>
            <Trash2 size={15} />
            Eliminar
          </button>
          <label>
            <span>Reemplazar</span>
            <select value="" onChange={(event) => replaceSelectedWithPreset(event.target.value)}>
              <option value="" disabled>
                Preset...
              </option>
              {libraryPaletteItems.slice(0, 80).map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.group} - {preset.title}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {overlapCandidates && (
        <div className="overlap-menu" style={{ left: overlapCandidates.x, top: overlapCandidates.y + 12 }}>
          <span>{overlapCandidates.ids.length} objetos bajo el cursor</span>
          {overlapCandidates.ids.map((id) => {
            const element = elements.find((candidate) => candidate.id === id)
            if (!element) return null
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  selectOnly(id)
                  setOverlapCandidates(null)
                }}
              >
                {elementDisplayName(element)}
              </button>
            )
          })}
        </div>
      )}

      {settingsOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setSettingsOpen(false)}>
          <section className="modal-panel" role="dialog" aria-modal="true" aria-label="Ajustes" onMouseDown={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h2>Ajustes</h2>
              <button type="button" className="tool-button subtle" aria-label="Cerrar ajustes" onClick={() => setSettingsOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="settings-grid">
              <label className="toggle">
                <input type="checkbox" checked={theme === 'dark'} onChange={(event) => setTheme(event.target.checked ? 'dark' : 'light')} />
                <span>Modo oscuro</span>
              </label>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={settings.terminalSnap}
                  onChange={(event) => setSettings((state) => ({ ...state, terminalSnap: event.target.checked }))}
                />
                <span>Snap a terminales</span>
              </label>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={settings.routeWires}
                  onChange={(event) => setSettings((state) => ({ ...state, routeWires: event.target.checked }))}
                />
                <span>Rutar cables en angulos rectos</span>
              </label>
              <label className="field">
                <span>Modo de cable</span>
                <select value={settings.routeMode} onChange={(event) => setSettings((state) => ({ ...state, routeMode: event.target.value }))}>
                  {routeModeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={settings.exportGrid}
                  onChange={(event) => setSettings((state) => ({ ...state, exportGrid: event.target.checked }))}
                />
                <span>Incluir grid/ejes en TikZ</span>
              </label>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={settings.autosave}
                  onChange={(event) => setSettings((state) => ({ ...state, autosave: event.target.checked }))}
                />
                <span>Autosave local</span>
              </label>
            </div>
            <div className="recent-list">
              <strong>Recent local boards</strong>
              {recentBoards.length ? recentBoards.map((item, index) => <span key={`${item.savedAt}-${index}`}>{item.name} · {item.count} objetos</span>) : <span>No hay recientes todavia</span>}
            </div>
          </section>
        </div>
      )}

      {helpOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setHelpOpen(false)}>
          <section className="modal-panel help-modal" role="dialog" aria-modal="true" aria-label="Ayuda" onMouseDown={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h2>Ayuda y estado</h2>
              <button type="button" className="tool-button subtle" aria-label="Cerrar ayuda" onClick={() => setHelpOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="help-tabs" role="tablist">
              {[
                ['tutorial', 'Tutorial'],
                ['updates', 'Updates'],
                ['bugs', 'Known bugs'],
              ].map(([id, label]) => (
                <button key={id} type="button" className={helpTab === id ? 'is-active' : ''} onClick={() => setHelpTab(id)}>
                  {label}
                </button>
              ))}
            </div>
            {helpTab === 'tutorial' && (
              <div className="help-copy">
                <p>Arrastra objetos TikZ al lienzo, usa Shift+clic para seleccionar varios, y clic repetido sobre objetos superpuestos para ciclar la seleccion.</p>
                <p>Para circuitos, activa snap a terminales, dibuja lineas con ruteo 90 grados y edita etiqueta, valor, terminales y orientacion desde Seleccion.</p>
                <p>El resultado se puede copiar como codigo `.TeX`, exportar como `.tex`, PNG, SVG, JSON editable o URL compartible.</p>
                <div className="gallery-actions">
                  <button type="button" className="ghost-button" onClick={() => loadGalleryExample('qpsk')}>
                    QPSK chain
                  </button>
                  <button type="button" className="ghost-button" onClick={() => loadGalleryExample('ofdm')}>
                    OFDM chain
                  </button>
                  <button type="button" className="ghost-button" onClick={() => loadGalleryExample('mimo')}>
                    MIMO link
                  </button>
                  <button type="button" className="ghost-button" onClick={() => loadGalleryExample('superhet')}>
                    Superhet RX
                  </button>
                  <button type="button" className="ghost-button" onClick={() => loadGalleryExample('matched')}>
                    Matched filter
                  </button>
                  <button type="button" className="ghost-button" onClick={() => loadGalleryExample('rf')}>
                    RF two-port
                  </button>
                </div>
              </div>
            )}
            {helpTab === 'updates' && (
              <div className="help-copy">
                <p>Ultimos cambios: panel de circuitos, modo pan independiente, dark mode, SVG export, URLs compartibles y seleccion multiple.</p>
                <p>Los objetos TikZ ahora aceptan nodos extra, escalado, relleno, opciones TikZ y reemplazo desde menu contextual.</p>
              </div>
            )}
            {helpTab === 'bugs' && (
              <div className="help-copy">
                <p>Limitacion conocida: el snap infiere terminales por geometria local; no valida redes electricas completas como un simulador.</p>
                <p>Los snippets standalone como PGFPlots o tikz-cd se exportan correctamente, pero su miniatura en canvas sigue siendo aproximada.</p>
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  )
}

export default App
