export const paperTargets = [
  {
    id: 'content',
    label: 'Content bounds',
    description: 'Usa el tamano del contenido exportado.',
    widthCm: null,
    heightCm: null,
    marginCm: 0,
    journalStyle: 'ieee',
    exportPreset: 'figure',
  },
  {
    id: 'ieee-column',
    label: 'IEEE column',
    description: 'Una columna IEEE, aprox. 3.5 in.',
    widthCm: 8.9,
    heightCm: 6,
    marginCm: 0.3,
    journalStyle: 'ieee',
    exportPreset: 'figure',
  },
  {
    id: 'ieee-wide',
    label: 'IEEE double',
    description: 'Ancho de doble columna IEEE.',
    widthCm: 18.2,
    heightCm: 7.2,
    marginCm: 0.35,
    journalStyle: 'ieee',
    exportPreset: 'figure',
  },
  {
    id: 'nature-compact',
    label: 'Nature compact',
    description: 'Figura compacta estilo Nature.',
    widthCm: 8.6,
    heightCm: 5.8,
    marginCm: 0.25,
    journalStyle: 'nature',
    exportPreset: 'figure',
  },
  {
    id: 'thesis',
    label: 'Thesis',
    description: 'Figura amplia para memoria o tesis.',
    widthCm: 14,
    heightCm: 8.5,
    marginCm: 0.4,
    journalStyle: 'thesis',
    exportPreset: 'figure',
  },
  {
    id: 'beamer',
    label: 'Beamer 16:9',
    description: 'Frame panoramico para slides.',
    widthCm: 12.8,
    heightCm: 7.2,
    marginCm: 0.35,
    journalStyle: 'slides',
    exportPreset: 'beamer',
  },
  {
    id: 'custom',
    label: 'Custom size',
    description: 'Dimensiones manuales en cm.',
    widthCm: 10,
    heightCm: 6,
    marginCm: 0.3,
    journalStyle: 'ieee',
    exportPreset: 'figure',
  },
]

export const subfigureLayouts = [
  { id: 'single', label: '1 panel', columns: 1, rows: 1, panelCount: 1 },
  { id: 'row-2', label: '1 x 2', columns: 2, rows: 1, panelCount: 2 },
  { id: 'column-2', label: '2 x 1', columns: 1, rows: 2, panelCount: 2 },
  { id: 'grid-2x2', label: '2 x 2', columns: 2, rows: 2, panelCount: 4 },
]

const defaultPanelLabels = ['(a)', '(b)', '(c)', '(d)', '(e)', '(f)']

const finiteNumber = (value) => {
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

const positiveNumber = (value, fallback) => {
  const number = finiteNumber(value)
  return number && number > 0 ? number : fallback
}

const roundCm = (value) => Number(value.toFixed(4))

const paperTargetById = (id) => paperTargets.find((target) => target.id === id) ?? paperTargets[0]

const subfigureLayoutById = (id) => subfigureLayouts.find((layout) => layout.id === id) ?? subfigureLayouts[0]

const cmToIn = (value) => value / 2.54

const closeCm = (left, right) => Math.abs((Number(left) || 0) - (Number(right) || 0)) < 0.001

const normalizePanelLabel = (label) => {
  const text = String(label ?? '').trim()
  if (!text) return ''
  if (/^\(.+\)$/.test(text)) return text
  return `(${text.replace(/[()]/g, '').trim()})`
}

export function parseSubfigureLabels(value, count = 1) {
  const labels = String(value ?? '')
    .split(/[,;\n]+/)
    .map(normalizePanelLabel)
    .filter(Boolean)

  return Array.from({ length: Math.max(0, count) }, (_, index) => labels[index] ?? defaultPanelLabels[index] ?? `(${index + 1})`)
}

export function formatPaperSize(widthCm, heightCm) {
  if (!widthCm || !heightCm) return 'Content bounds'
  return `${roundCm(widthCm)} x ${roundCm(heightCm)} cm / ${cmToIn(widthCm).toFixed(2)} x ${cmToIn(heightCm).toFixed(2)} in`
}

export function resolvePaperComposer(settings = {}) {
  const target = paperTargetById(settings.paperTarget ?? settings.paperSize)
  const layout = subfigureLayoutById(settings.subfigureLayout)
  const hasFixedSize = target.id !== 'content'
  const widthCm = hasFixedSize ? positiveNumber(settings.paperWidthCm, target.widthCm) : null
  const heightCm = hasFixedSize ? positiveNumber(settings.paperHeightCm, target.heightCm) : null
  const rawMarginCm = positiveNumber(settings.paperMarginCm, target.marginCm ?? 0.25)
  const maxMargin = widthCm && heightCm ? Math.max(0, Math.min(widthCm, heightCm) / 2 - 0.05) : rawMarginCm
  const marginCm = hasFixedSize ? roundCm(Math.min(rawMarginCm, maxMargin)) : 0
  const isCustomOverride =
    hasFixedSize &&
    target.id !== 'custom' &&
    target.id !== 'content' &&
    (!closeCm(widthCm, target.widthCm) || !closeCm(heightCm, target.heightCm))

  return {
    id: target.id,
    label: isCustomOverride ? 'Custom size' : target.label,
    description: target.description,
    widthCm,
    heightCm,
    marginCm,
    isCustomOverride,
    hasFixedSize,
    showGuides: settings.showPaperGuides ?? true,
    layout,
    labels: parseSubfigureLabels(settings.subfigureLabels, layout.panelCount),
    panelGapCm: positiveNumber(settings.subfigureGapCm, 0.25),
    journalStyle: target.journalStyle,
    exportPreset: target.exportPreset,
    displaySize: formatPaperSize(widthCm, heightCm),
  }
}

export function figureWrapperControlsState(settings = {}) {
  const exportPreset = settings.exportPreset ?? 'figure'
  const showWrapToggle = exportPreset === 'figure'
  return {
    showWrapToggle,
    showMetadataFields: showWrapToggle && settings.wrapFigure !== false,
  }
}

const rectWidth = (rect) => Math.max(0, rect.maxX - rect.minX)
const rectHeight = (rect) => Math.max(0, rect.maxY - rect.minY)

function buildSubfigurePanels(safe, layout, labels, gapCm) {
  const columns = Math.max(1, layout.columns)
  const rows = Math.max(1, layout.rows)
  const gapX = columns > 1 ? Math.min(gapCm, rectWidth(safe) / 4) : 0
  const gapY = rows > 1 ? Math.min(gapCm, rectHeight(safe) / 4) : 0
  const panelWidth = (rectWidth(safe) - gapX * (columns - 1)) / columns
  const panelHeight = (rectHeight(safe) - gapY * (rows - 1)) / rows
  const panels = []

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const index = row * columns + column
      const minX = safe.minX + column * (panelWidth + gapX)
      const maxY = safe.maxY - row * (panelHeight + gapY)
      const maxX = minX + panelWidth
      const minY = maxY - panelHeight
      panels.push({
        id: `${layout.id}-${index}`,
        label: labels[index] ?? defaultPanelLabels[index] ?? `(${index + 1})`,
        minX: roundCm(minX),
        minY: roundCm(minY),
        maxX: roundCm(maxX),
        maxY: roundCm(maxY),
        labelPoint: {
          x: roundCm(minX + 0.14),
          y: roundCm(maxY - 0.14),
        },
      })
    }
  }

  return panels
}

export function buildPaperGuide(composerOrSettings = {}) {
  const composer = composerOrSettings.layout ? composerOrSettings : resolvePaperComposer(composerOrSettings)
  if (!composer.hasFixedSize || !composer.showGuides || !composer.widthCm || !composer.heightCm) return null

  const halfWidth = composer.widthCm / 2
  const halfHeight = composer.heightCm / 2
  const frame = {
    minX: roundCm(-halfWidth),
    minY: roundCm(-halfHeight),
    maxX: roundCm(halfWidth),
    maxY: roundCm(halfHeight),
  }
  const safe = {
    minX: roundCm(frame.minX + composer.marginCm),
    minY: roundCm(frame.minY + composer.marginCm),
    maxX: roundCm(frame.maxX - composer.marginCm),
    maxY: roundCm(frame.maxY - composer.marginCm),
  }

  return {
    targetId: composer.id,
    label: composer.label,
    widthCm: composer.widthCm,
    heightCm: composer.heightCm,
    displaySize: composer.displaySize,
    marginCm: composer.marginCm,
    frame,
    safe,
    panels: buildSubfigurePanels(safe, composer.layout, composer.labels, composer.panelGapCm),
  }
}

export function validateFigureMetadata(settings = {}) {
  const exportPreset = settings.exportPreset ?? 'figure'
  const figureLike = exportPreset === 'figure' && settings.wrapFigure !== false
  if (!figureLike) return []

  const caption = String(settings.caption ?? '').trim()
  const label = String(settings.label ?? '').trim()
  const warnings = []

  if (!caption) {
    warnings.push({ id: 'caption-empty', level: 'warn', text: 'Caption vacia para el wrapper de figura.' })
  } else if (caption.length > 180) {
    warnings.push({ id: 'caption-long', level: 'warn', text: 'Caption larga: conviene acortarla antes del paper.' })
  }

  if (!label) {
    warnings.push({ id: 'label-empty', level: 'warn', text: 'Falta label; usa algo como fig:main-result.' })
  } else if (!/^fig:[A-Za-z0-9][A-Za-z0-9:._-]*$/.test(label)) {
    warnings.push({ id: 'label-format', level: 'warn', text: 'El label deberia empezar por fig: y no contener espacios.' })
  }

  return warnings
}

export function buildPaperWrapperPreview(settings = {}) {
  const exportPreset = settings.exportPreset ?? 'figure'
  const caption = String(settings.caption ?? '').trim() || '...'
  const label = String(settings.label ?? '').trim() || 'fig:...'

  if (exportPreset === 'standalone') {
    return ['\\documentclass[tikz,border=4pt]{standalone}', '\\begin{document}', '  \\begin{tikzpicture} ...', '\\end{document}']
  }

  if (exportPreset === 'beamer') {
    return ['\\begin{frame}{TikZ sketch}', '  \\centering', '  \\begin{tikzpicture} ...', '\\end{frame}']
  }

  if (exportPreset === 'snippet' || settings.wrapFigure === false) {
    return ['\\begin{tikzpicture} ...', '\\end{tikzpicture}']
  }

  return [
    '\\begin{figure}[htbp]',
    '  \\centering',
    '  \\begin{tikzpicture} ...',
    `  \\caption{${caption}}`,
    `  \\label{${label}}`,
    '\\end{figure}',
  ]
}

export function buildPaperChecklist({ settings = {}, elements = [], tikzWarnings = [] } = {}) {
  const composer = resolvePaperComposer(settings)
  const hiddenCount = elements.filter((element) => element.hidden).length
  const checklist = []

  if (composer.hasFixedSize) {
    checklist.push({
      id: 'paper-target',
      level: 'ok',
      text: `${composer.label}: ${composer.displaySize}, margen seguro ${composer.marginCm} cm.`,
    })
  } else {
    checklist.push({ id: 'paper-target-content', level: 'info', text: 'Target por contenido: no hay caja fija de revista.' })
  }

  validateFigureMetadata(settings).forEach((item) => checklist.push(item))

  if (hiddenCount > 0) {
    checklist.push({ id: 'hidden-elements', level: 'warn', text: `${hiddenCount} objeto(s) ocultos no saldran en TikZ.` })
  } else {
    checklist.push({ id: 'visible-elements', level: 'ok', text: 'No hay objetos ocultos pendientes.' })
  }

  tikzWarnings.forEach((warning, index) => {
    checklist.push({ id: `tikz-warning-${index}`, level: 'warn', text: warning })
  })

  if (settings.exportGrid) {
    checklist.push({ id: 'grid-exported', level: 'warn', text: 'Los ejes de referencia se exportaran en TikZ.' })
  } else {
    checklist.push({ id: 'grid-excluded', level: 'ok', text: 'Grid y ejes de referencia excluidos del export.' })
  }

  if (settings.monochromeExport) {
    checklist.push({ id: 'monochrome', level: 'ok', text: 'Salida monocroma activa para paper.' })
  } else {
    checklist.push({ id: 'color-export', level: 'info', text: 'Salida en color activa; revisa version B/N si la revista lo pide.' })
  }

  if (settings.exportCrop) {
    checklist.push({ id: 'crop-enabled', level: 'info', text: `Crop PNG/SVG activo con margen ${settings.exportMargin ?? 0}px.` })
  } else {
    checklist.push({ id: 'crop-disabled', level: 'info', text: 'PNG/SVG exporta el lienzo completo.' })
  }

  return checklist
}
