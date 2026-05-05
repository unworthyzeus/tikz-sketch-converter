import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildPaperChecklist,
  buildPaperGuide,
  buildPaperWrapperPreview,
  figureWrapperControlsState,
  formatPaperSize,
  paperTargets,
  parseSubfigureLabels,
  resolvePaperComposer,
  validateFigureMetadata,
} from '../src/paperComposer.js'

const closeTo = (actual, expected) => assert.ok(Math.abs(actual - expected) < 0.0001, `${actual} ~= ${expected}`)

test('resolvePaperComposer exposes journal-sized targets with cm dimensions', () => {
  const ieeeColumn = resolvePaperComposer({ paperTarget: 'ieee-column' })
  const beamer = resolvePaperComposer({ paperTarget: 'beamer' })

  assert.equal(paperTargets.some((target) => target.id === 'ieee-wide'), true)
  assert.equal(ieeeColumn.label, 'IEEE column')
  assert.equal(ieeeColumn.widthCm, 8.9)
  assert.equal(ieeeColumn.heightCm, 6)
  assert.equal(ieeeColumn.journalStyle, 'ieee')
  assert.equal(beamer.exportPreset, 'beamer')
  assert.equal(beamer.widthCm, 12.8)
})

test('formatPaperSize includes cm and inch dimensions for fixed paper targets', () => {
  assert.equal(formatPaperSize(8.9, 6), '8.9 x 6 cm / 3.50 x 2.36 in')
  assert.equal(formatPaperSize(null, null), 'Content bounds')
})

test('resolvePaperComposer marks preset dimension overrides as custom size', () => {
  const composer = resolvePaperComposer({ paperTarget: 'ieee-column', paperWidthCm: 12.3, paperHeightCm: 6 })

  assert.equal(composer.id, 'ieee-column')
  assert.equal(composer.label, 'Custom size')
  assert.equal(composer.isCustomOverride, true)
  assert.equal(composer.displaySize, '12.3 x 6 cm / 4.84 x 2.36 in')
})

test('resolvePaperComposer allows an explicit zero safe margin', () => {
  const composer = resolvePaperComposer({ paperTarget: 'ieee-column', paperMarginCm: 0 })

  assert.equal(composer.marginCm, 0)
})

test('buildPaperGuide centers the paper frame and safe-area panels in canvas world units', () => {
  const composer = resolvePaperComposer({
    paperTarget: 'ieee-column',
    paperMarginCm: 0.3,
    subfigureLayout: 'row-2',
    subfigureLabels: 'a, b',
  })
  const guide = buildPaperGuide(composer)

  closeTo(guide.frame.minX, -4.45)
  closeTo(guide.frame.maxX, 4.45)
  closeTo(guide.frame.minY, -3)
  closeTo(guide.frame.maxY, 3)
  closeTo(guide.safe.minX, -4.15)
  closeTo(guide.safe.maxX, 4.15)
  assert.equal(guide.panels.length, 2)
  assert.equal(guide.panels[0].label, '(a)')
  assert.equal(guide.panels[1].label, '(b)')
  assert.equal(guide.displaySize, '8.9 x 6 cm / 3.50 x 2.36 in')
  closeTo(guide.panels[0].maxX, -0.125)
  closeTo(guide.panels[1].minX, 0.125)
})

test('parseSubfigureLabels normalizes custom labels and fills missing panel names', () => {
  assert.deepEqual(parseSubfigureLabels('left; middle', 4), ['(left)', '(middle)', '(c)', '(d)'])
  assert.deepEqual(parseSubfigureLabels('(i), (ii)', 2), ['(i)', '(ii)'])
})

test('validateFigureMetadata catches labels and captions that are not paper-ready', () => {
  const warnings = validateFigureMetadata({
    wrapFigure: true,
    exportPreset: 'figure',
    caption: 'x'.repeat(190),
    label: 'bad label',
  })

  assert.equal(warnings.some((item) => item.id === 'caption-long'), true)
  assert.equal(warnings.some((item) => item.id === 'label-format'), true)
  assert.deepEqual(validateFigureMetadata({ wrapFigure: false, exportPreset: 'snippet', caption: '', label: '' }), [])
  assert.deepEqual(validateFigureMetadata({ wrapFigure: true, exportPreset: 'beamer', caption: '', label: '' }), [])
})

test('buildPaperChecklist summarizes export readiness with hidden objects and guide context', () => {
  const checklist = buildPaperChecklist({
    settings: {
      paperTarget: 'nature-compact',
      paperMarginCm: 0.25,
      wrapFigure: true,
      exportPreset: 'figure',
      caption: '',
      label: 'fig:ok',
      exportGrid: false,
      monochromeExport: true,
      exportCrop: true,
      exportMargin: 18,
    },
    elements: [{ id: 'visible' }, { id: 'hidden', hidden: true }],
    tikzWarnings: ['Custom block puede necesitar librerias TikZ extra.'],
  })

  assert.equal(checklist.some((item) => item.level === 'warn' && item.id === 'hidden-elements'), true)
  assert.equal(checklist.some((item) => item.level === 'warn' && item.id === 'caption-empty'), true)
  assert.equal(checklist.some((item) => item.level === 'ok' && item.id === 'paper-target'), true)
  assert.equal(checklist.some((item) => item.level === 'ok' && item.id === 'grid-excluded'), true)
  assert.equal(checklist.some((item) => item.level === 'info' && item.id === 'crop-enabled'), true)
})

test('buildPaperWrapperPreview mirrors the active export wrapper', () => {
  assert.deepEqual(buildPaperWrapperPreview({ exportPreset: 'figure', wrapFigure: true, caption: 'Result', label: 'fig:result' }), [
    '\\begin{figure}[htbp]',
    '  \\centering',
    '  \\begin{tikzpicture} ...',
    '  \\end{tikzpicture}',
    '  \\caption{Result}',
    '  \\label{fig:result}',
    '\\end{figure}',
  ])
  assert.deepEqual(buildPaperWrapperPreview({ exportPreset: 'beamer' }), [
    '\\begin{frame}{TikZ sketch}',
    '  \\centering',
    '  \\begin{tikzpicture} ...',
    '  \\end{tikzpicture}',
    '\\end{frame}',
  ])
  assert.deepEqual(buildPaperWrapperPreview({ exportPreset: 'standalone' }), [
    '\\documentclass[tikz,border=4pt]{standalone}',
    '\\begin{document}',
    '  \\begin{tikzpicture} ...',
    '  \\end{tikzpicture}',
    '\\end{document}',
  ])
  assert.deepEqual(buildPaperWrapperPreview({ exportPreset: 'snippet' }), ['\\begin{tikzpicture} ...', '\\end{tikzpicture}'])
})

test('figureWrapperControlsState hides figure-only metadata outside figure exports', () => {
  assert.deepEqual(figureWrapperControlsState({ exportPreset: 'figure', wrapFigure: true }), {
    showWrapToggle: true,
    showMetadataFields: true,
  })
  assert.deepEqual(figureWrapperControlsState({ exportPreset: 'beamer', wrapFigure: true }), {
    showWrapToggle: false,
    showMetadataFields: false,
  })
  assert.deepEqual(figureWrapperControlsState({ exportPreset: 'figure', wrapFigure: false }), {
    showWrapToggle: true,
    showMetadataFields: false,
  })
})
