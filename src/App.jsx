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
import 'katex/dist/katex.min.css'
import './App.css'
import { circuitDrawTikzOptions } from './circuitOptions'
import { writeClipboardText } from './clipboard'
import { moveElementBy } from './elementTransforms'
import { createEditorKeydownHandler } from './editorKeyboard'
import { functionFrameBoundsForDataBounds, mapFunctionPointToFrame, resizeFunctionPlotToBounds } from './functionLayout'
import { curveMarkerPoints, functionLegendEntries, functionSeriesIsRenderable, markerGlyphParts } from './functionPreview'
import { functionDataTableRows, functionDataTableUsesYError, parseFunctionDataTable } from './functionDataTable'
import { latexSymbolGroups } from './latexSymbols'
import { configDrivenRequirements } from './libraryRequirements'
import {
  libraryObjectProfileForPreset,
  libraryProfileDefaultConfig,
  libraryProfileFieldKeysForPreset,
  libraryProfileSectionSpecsForPreset,
} from './libraryObjectProfiles'
import {
  applyLibraryPlotDataTable,
  applyLibraryPlotModulation,
  applyPgfplotsAxisMode,
  functionPgfplotsAxisSettings,
  libraryAddPlotTikzOptions,
} from './libraryPlotOptions'
import {
  buildBarChartSnippet,
  buildGanttChartSnippet,
  buildModularDiagramSnippet,
  diagramSemanticConfigChanged,
  formatMatrixEntryRows,
  shouldUseConfiguredLibrarySnippet,
} from './librarySnippetConfig'
import {
  circuitLabelsForConfig,
  defaultDiagramConfigForKind,
  diagramConfigFieldSpecs,
  diagramConfigForElement,
  dlLayersForConfig,
  ganttMetricsForTasks,
  ganttTasksForConfig,
  mlStepsForConfig,
} from './diagramConfig'
import { connectorLabelTikz, splitNodeLabels } from './nodeConnectorOptions'
import { objectPreviewBadges, terminalPreviewLabels } from './objectPreview'
import {
  buildPaperChecklist,
  buildPaperGuide,
  buildPaperWrapperPreview,
  figureWrapperControlsState,
  paperTargets,
  resolvePaperComposer,
  subfigureLayouts,
} from './paperComposer'
import { advancedPgfplotsAxisOptions } from './pgfplotsOptions'
import { previewKindForPreset } from './previewKinds'
import { rasterSafeSvgText } from './svgRasterExport'
import { applySnippetLabelOverrides, editableSnippetLabelsForLines } from './snippetLabels'
import { libraryPresets } from './tikzLibraryPresets'
import { libraryPaletteItems } from './tikzPaletteItems'
import { diagramPaletteItems, filterPaletteItems, objectPaletteItems, paletteGroupsFor } from './paletteTaxonomy'
import { injectTikzOptionsIntoLines } from './tikzOptionInjection'
import { splitTikzOptions } from './tikzOptions'
import { clampCanvasZoom, initialCanvasZoom } from './viewportDefaults'

let katexRenderer = null
let katexLoadPromise = null

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

const functionLineStyleOptions = [
  { value: 'solid', label: 'Continua', tikz: '', dashArray: '' },
  { value: 'dashed', label: 'Discontinua', tikz: 'dashed', dashArray: '8 7' },
  { value: 'densely-dashed', label: 'Dash densa', tikz: 'densely dashed', dashArray: '5 4' },
  { value: 'dotted', label: 'Punteada', tikz: 'dotted', dashArray: '2 5' },
  { value: 'dash-dot', label: 'Dash-dot', tikz: 'dash pattern=on 6pt off 3pt on 1pt off 3pt', dashArray: '8 4 2 4' },
]

const functionMarkerOptions = [
  { value: 'none', label: 'Sin marcador' },
  { value: '*', label: 'Punto' },
  { value: 'square*', label: 'Cuadrado' },
  { value: 'triangle*', label: 'Triangulo' },
  { value: 'x', label: 'x' },
  { value: '+', label: '+' },
  { value: 'diamond*', label: 'Rombo' },
]

const functionQuickExpressions = [
  'sin(x)',
  'cos(2*x)',
  '0.25*x^2 - 2',
  'max(x, 0)',
  'min(sin(x), 0.5)',
  'besselj0(x)',
  'besselj1(x)',
  'sinc(x)',
  'erf(x)',
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

const lineCapOptions = [
  { value: 'butt', label: 'Butt' },
  { value: 'round', label: 'Round' },
  { value: 'rect', label: 'Rect' },
]

const lineJoinOptions = [
  { value: 'miter', label: 'Miter' },
  { value: 'round', label: 'Round' },
  { value: 'bevel', label: 'Bevel' },
]

const fontSizeOptions = [
  { value: '', label: 'Auto' },
  { value: '\\scriptsize', label: 'scriptsize' },
  { value: '\\footnotesize', label: 'footnotesize' },
  { value: '\\small', label: 'small' },
  { value: '\\normalsize', label: 'normalsize' },
  { value: '\\large', label: 'large' },
]

const fontSeriesOptions = [
  { value: '', label: 'Normal' },
  { value: '\\bfseries', label: 'Bold' },
  { value: '\\itshape', label: 'Italic' },
  { value: '\\sffamily', label: 'Sans' },
  { value: '\\ttfamily', label: 'Mono' },
]

const alignOptions = [
  { value: 'center', label: 'Centro' },
  { value: 'left', label: 'Izquierda' },
  { value: 'right', label: 'Derecha' },
]

const anchorOptions = [
  { value: 'center', label: 'Center' },
  { value: 'north', label: 'North' },
  { value: 'south', label: 'South' },
  { value: 'east', label: 'East' },
  { value: 'west', label: 'West' },
  { value: 'north east', label: 'NE' },
  { value: 'north west', label: 'NW' },
  { value: 'south east', label: 'SE' },
  { value: 'south west', label: 'SW' },
]

const axisLineOptions = [
  { value: 'left', label: 'Left' },
  { value: 'middle', label: 'Middle' },
  { value: 'center', label: 'Center' },
  { value: 'box', label: 'Box' },
  { value: 'none', label: 'None' },
]

const gridModeOptions = [
  { value: 'none', label: 'Sin grid' },
  { value: 'major', label: 'Major' },
  { value: 'both', label: 'Both' },
]

const legendPositionOptions = [
  { value: '', label: 'Auto' },
  { value: 'north east', label: 'NE' },
  { value: 'north west', label: 'NW' },
  { value: 'south east', label: 'SE' },
  { value: 'south west', label: 'SW' },
  { value: 'outer north east', label: 'Outer NE' },
]

const axisModeOptions = [
  { value: 'linear', label: 'Linear' },
  { value: 'log', label: 'Log' },
]

const markStyleOptions = [
  { value: '', label: 'Sin marca' },
  { value: '*', label: 'Dot' },
  { value: 'o', label: 'Circle' },
  { value: 'square*', label: 'Square' },
  { value: 'triangle*', label: 'Triangle' },
  { value: 'x', label: 'X' },
  { value: '+', label: '+' },
]

const shaderOptions = [
  { value: '', label: 'Auto' },
  { value: 'flat', label: 'Flat' },
  { value: 'interp', label: 'Interpolado' },
  { value: 'faceted', label: 'Faceted' },
]

const pointMetaOptions = [
  { value: '', label: 'Auto' },
  { value: 'explicit', label: 'Explicit' },
  { value: 'x', label: 'X' },
  { value: 'y', label: 'Y' },
]

const matrixDelimiterOptions = [
  { value: 'none', label: 'Sin delimitador' },
  { value: 'brackets', label: '[ ]' },
  { value: 'parentheses', label: '( )' },
  { value: 'braces', label: '{ }' },
  { value: 'pipes', label: '| |' },
]

const edgeStyleOptions = [
  { value: 'solid', label: 'Solido' },
  { value: 'dashed', label: 'Discontinuo' },
  { value: 'dotted', label: 'Punteado' },
  { value: 'bend left', label: 'Bend left' },
  { value: 'bend right', label: 'Bend right' },
]

const objectConfigSections = [
  {
    id: 'paperStyle',
    title: 'Paper style',
    domains: ['all'],
    fields: [
      { key: 'lineCap', label: 'Line cap', type: 'select', options: lineCapOptions },
      { key: 'lineJoin', label: 'Line join', type: 'select', options: lineJoinOptions },
      { key: 'drawOpacity', label: 'Opacidad trazo', type: 'number', min: 0, max: 1, step: 0.05 },
      { key: 'textOpacity', label: 'Opacidad texto', type: 'number', min: 0, max: 1, step: 0.05 },
      { key: 'dashPattern', label: 'Dash pattern', type: 'text', placeholder: '2pt 1pt' },
      { key: 'roundedCorners', label: 'Rounded corners pt', type: 'number', min: 0, max: 24, step: 0.5 },
      { key: 'shadow', label: 'Drop shadow', type: 'checkbox' },
      { key: 'pattern', label: 'Pattern fill', type: 'text', placeholder: 'north east lines' },
    ],
  },
  {
    id: 'textNode',
    title: 'Texto y nodo',
    domains: ['all'],
    fields: [
      { key: 'align', label: 'Align', type: 'select', options: alignOptions },
      { key: 'anchor', label: 'Anchor', type: 'select', options: anchorOptions },
      { key: 'fontSize', label: 'Font size', type: 'select', options: fontSizeOptions },
      { key: 'fontSeries', label: 'Font family/series', type: 'select', options: fontSeriesOptions },
      { key: 'innerSep', label: 'Inner sep pt', type: 'number', min: 0, max: 24, step: 0.5 },
      { key: 'outerSep', label: 'Outer sep pt', type: 'number', min: 0, max: 16, step: 0.5 },
      { key: 'minWidth', label: 'Min width cm', type: 'number', min: 0, max: 12, step: 0.1 },
      { key: 'minHeight', label: 'Min height cm', type: 'number', min: 0, max: 8, step: 0.1 },
      { key: 'textWidth', label: 'Text width cm', type: 'number', min: 0, max: 12, step: 0.1 },
    ],
  },
  {
    id: 'labelsSignals',
    title: 'Etiquetas exactas',
    domains: ['profile'],
    fields: [
      { key: 'inputLabel', label: 'Entrada', type: 'text', placeholder: '$x(t)$, $v_i$' },
      { key: 'outputLabel', label: 'Salida', type: 'text', placeholder: '$y(t)$, $v_o$' },
      { key: 'feedbackLabel', label: 'Feedback', type: 'text', placeholder: '$R_f$, $H(s)$' },
      { key: 'componentLabels', label: 'Componentes', type: 'textarea', placeholder: 'R_{in}, R_f, C_f' },
      { key: 'supplyLabel', label: 'Alimentacion', type: 'text', placeholder: '$V_{CC}$' },
      { key: 'groundLabel', label: 'Referencia', type: 'text', placeholder: 'GND' },
      { key: 'channelLabel', label: 'Canal / sistema', type: 'text', placeholder: '$h(t)$, $\\mathbf{H}$' },
      { key: 'snrLabel', label: 'SNR / metrica', type: 'text', placeholder: 'SNR, $E_b/N_0$' },
      { key: 'sampleRateLabel', label: 'Muestreo', type: 'text', placeholder: '$f_s$, UI' },
    ],
  },
  {
    id: 'shapeOptions',
    title: 'Shape options',
    domains: ['shape', 'flow', 'geometry', 'annotation', 'paper'],
    fields: [
      { key: 'shapeVariant', label: 'Variant', type: 'select', options: [...libraryNodeShapeOptions, { value: 'cloud', label: 'Cloud' }, { value: 'cylinder', label: 'Cylinder' }, { value: 'callout', label: 'Callout' }, { value: 'split', label: 'Split' }] },
      { key: 'shapeAspect', label: 'Aspect', type: 'number', min: 0.2, max: 6, step: 0.05 },
      { key: 'cloudPuffs', label: 'Cloud puffs', type: 'number', min: 4, max: 24, step: 1 },
      { key: 'splitParts', label: 'Split parts', type: 'number', min: 1, max: 8, step: 1 },
      { key: 'calloutPointerX', label: 'Puntero x', type: 'number', min: -4, max: 4, step: 0.05 },
      { key: 'calloutPointerY', label: 'Puntero y', type: 'number', min: -4, max: 4, step: 0.05 },
    ],
  },
  {
    id: 'circuits',
    title: 'CircuitikZ',
    domains: ['circuit'],
    fields: [
      { key: 'autoLabel', label: 'Auto etiqueta', type: 'checkbox' },
      { key: 'circuitLabel', label: 'Ref / etiqueta', type: 'text', placeholder: 'R_1' },
      { key: 'circuitValue', label: 'Valor', type: 'text', placeholder: '10 k\\Omega' },
      { key: 'circuitLabelPosition', label: 'Posicion label', type: 'select', options: [{ value: 'l', label: 'l' }, { value: 'l_', label: 'l_' }, { value: 'a', label: 'a' }, { value: 'a_', label: 'a_' }, { value: 'none', label: 'No label' }] },
      { key: 'voltageLabel', label: 'Voltage label', type: 'text', placeholder: 'v_o' },
      { key: 'currentLabel', label: 'Current label', type: 'text', placeholder: 'i_R' },
      { key: 'circuitOrientation', label: 'Orientacion', type: 'select', options: [{ value: 'right', label: 'Derecha' }, { value: 'left', label: 'Izquierda' }, { value: 'up', label: 'Arriba' }, { value: 'down', label: 'Abajo' }] },
      { key: 'circuitStyle', label: 'IEC/American', type: 'select', options: [{ value: 'auto', label: 'Auto' }, { value: 'iec', label: 'IEC' }, { value: 'american', label: 'American' }] },
      { key: 'terminalStyle', label: 'Terminales', type: 'select', options: [{ value: 'none', label: 'Sin nodos' }, { value: 'filled', label: 'Rellenos' }, { value: 'open', label: 'Abiertos' }, { value: 'mixed', label: 'Mixto' }] },
      { key: 'terminalLength', label: 'Longitud terminal', type: 'number', min: 0.55, max: 12, step: 0.05 },
      { key: 'bipoleLength', label: 'Bipole length cm', type: 'number', min: 0, max: 5, step: 0.05 },
      { key: 'mirrorComponent', label: 'Mirror', type: 'checkbox' },
      { key: 'invertComponent', label: 'Invert', type: 'checkbox' },
      { key: 'terminalNames', label: 'Nombres terminales', type: 'text', placeholder: 'in,out / D,G,S' },
      { key: 'netName', label: 'Net preferida', type: 'text', placeholder: 'VDD, GND, RF_in' },
      { key: 'spiceModel', label: 'Modelo/SPICE', type: 'text', placeholder: '2N3904, nch, D1N4148' },
    ],
  },
  {
    id: 'plots',
    title: 'PGFPlots',
    domains: ['plot'],
    fields: [
      { key: 'axisWidth', label: 'Axis width cm', type: 'number', min: 0, max: 18, step: 0.1 },
      { key: 'axisHeight', label: 'Axis height cm', type: 'number', min: 0, max: 12, step: 0.1 },
      { key: 'axisLines', label: 'Axis lines', type: 'select', options: axisLineOptions },
      { key: 'gridMode', label: 'Grid', type: 'select', options: gridModeOptions },
      { key: 'xMode', label: 'X mode', type: 'select', options: axisModeOptions },
      { key: 'yMode', label: 'Y mode', type: 'select', options: axisModeOptions },
      { key: 'xmin', label: 'xmin', type: 'text', placeholder: '-1, 0, 1e-6' },
      { key: 'xmax', label: 'xmax', type: 'text', placeholder: '1, 10, 2*pi' },
      { key: 'ymin', label: 'ymin', type: 'text', placeholder: '0, 1e-6' },
      { key: 'ymax', label: 'ymax', type: 'text', placeholder: '1, 1e2' },
      { key: 'plotDomain', label: 'Domain', type: 'text', placeholder: '-2:2' },
      { key: 'samples', label: 'Samples', type: 'number', min: 2, max: 1000, step: 1 },
      { key: 'xlabel', label: 'xlabel', type: 'text', placeholder: '$x$' },
      { key: 'ylabel', label: 'ylabel', type: 'text', placeholder: '$y$' },
      { key: 'plotTitle', label: 'Title', type: 'text' },
      { key: 'legendPos', label: 'Legend pos', type: 'select', options: legendPositionOptions },
      { key: 'legendColumns', label: 'Legend cols', type: 'number', min: 1, max: 8, step: 1 },
      { key: 'markStyle', label: 'Mark', type: 'select', options: markStyleOptions },
      { key: 'plotSmooth', label: 'Smooth', type: 'checkbox' },
      { key: 'axisEqual', label: 'Axis equal image', type: 'checkbox' },
      { key: 'minorTicks', label: 'Minor ticks', type: 'number', min: 0, max: 20, step: 1 },
      { key: 'reverseX', label: 'Reverse X', type: 'checkbox' },
      { key: 'reverseY', label: 'Reverse Y', type: 'checkbox' },
      { key: 'colormap', label: 'Colormap', type: 'text', placeholder: 'viridis, hot, blackwhite' },
      { key: 'colorbar', label: 'Colorbar', type: 'checkbox' },
      { key: 'shader', label: 'Shader', type: 'select', options: shaderOptions },
      { key: 'viewAzimuth', label: 'View azimuth', type: 'number', min: -360, max: 360, step: 1 },
      { key: 'viewElevation', label: 'View elevation', type: 'number', min: -360, max: 360, step: 1 },
      { key: 'pointMeta', label: 'Point meta', type: 'select', options: pointMetaOptions },
      { key: 'stemPlot', label: 'Stem / ycomb', type: 'checkbox' },
      { key: 'constPlot', label: 'Const plot', type: 'checkbox' },
      { key: 'xtick', label: 'xtick', type: 'text', placeholder: '0,1,2' },
      { key: 'ytick', label: 'ytick', type: 'text', placeholder: '-1,0,1' },
      { key: 'xLabelStyle', label: 'xlabel style', type: 'text', placeholder: 'font=\\small' },
      { key: 'yLabelStyle', label: 'ylabel style', type: 'text', placeholder: 'rotate=-90' },
      { key: 'tickLabelStyle', label: 'Tick label style', type: 'text', placeholder: 'font=\\scriptsize' },
      { key: 'legendStyle', label: 'Legend style', type: 'text', placeholder: 'draw=none, fill=none' },
      { key: 'axisLineStyle', label: 'Axis line style', type: 'text', placeholder: 'line width=.45pt' },
      { key: 'gridLineStyle', label: 'Grid style', type: 'text', placeholder: 'dashed, gray!30' },
      { key: 'enlargeLimits', label: 'Enlarge limits', type: 'text', placeholder: 'false, {abs=0.1}' },
      { key: 'axisExtraOptions', label: 'Axis extra', type: 'text', placeholder: 'minor tick num=1' },
      { key: 'addplotExtraOptions', label: 'Addplot extra', type: 'text', placeholder: 'forget plot, thick' },
      { key: 'errorBars', label: 'Error bars', type: 'checkbox' },
      { key: 'errorBarOptions', label: 'Error bars', type: 'text', placeholder: '/pgfplots/error bars/y dir=both' },
      { key: 'dataTable', label: 'Data table', type: 'textarea', placeholder: '0,0\n1,0.8\n2,0.4' },
    ],
  },
  {
    id: 'matrixGraph',
    title: 'Matrices, grafos y layout',
    domains: ['matrix', 'graph', 'ml'],
    fields: [
      { key: 'matrixDelimiter', label: 'Delimiter', type: 'select', options: matrixDelimiterOptions },
      { key: 'rowSep', label: 'Row sep cm', type: 'number', min: 0, max: 4, step: 0.05 },
      { key: 'columnSep', label: 'Column sep cm', type: 'number', min: 0, max: 4, step: 0.05 },
      { key: 'matrixEntries', label: 'Matrix entries', type: 'textarea', placeholder: 'a & b\\\\\nc & d' },
      { key: 'classLabels', label: 'Class labels', type: 'text', placeholder: 'negative, positive' },
      { key: 'budgetRows', label: 'Budget rows', type: 'textarea', placeholder: 'Tx power,23 dBm\nPath loss,-128 dB\nRx power,-90 dBm' },
      { key: 'edgeStyle', label: 'Edge style', type: 'select', options: edgeStyleOptions },
      { key: 'edgeLabels', label: 'Edge labels', type: 'text', placeholder: 'f,g,h' },
      { key: 'nodeLabels', label: 'Node labels', type: 'text', placeholder: 'A, B, C' },
      { key: 'connectNodes', label: 'Connect nodes', type: 'checkbox' },
      { key: 'nodeDistance', label: 'Node distance cm', type: 'number', min: 0, max: 6, step: 0.05 },
      { key: 'layerDistance', label: 'Layer distance cm', type: 'number', min: 0, max: 6, step: 0.05 },
      { key: 'siblingDistance', label: 'Sibling distance cm', type: 'number', min: 0, max: 6, step: 0.05 },
    ],
  },
  {
    id: 'ganttTelecom',
    title: 'Gantt / Telecom / RF',
    domains: ['gantt', 'telecom'],
    fields: [
      { key: 'barCount', label: 'Numero barras', type: 'number', min: 1, max: 20, step: 1 },
      { key: 'barData', label: 'Datos barras', type: 'textarea', placeholder: 'A,2\nB,3.5\nC,2.8' },
      { key: 'ganttStart', label: 'Gantt inicio', type: 'number', min: 0, max: 999, step: 1 },
      { key: 'ganttEnd', label: 'Gantt fin', type: 'number', min: 1, max: 999, step: 1 },
      { key: 'ganttProgress', label: 'Progress %', type: 'number', min: 0, max: 100, step: 1 },
      { key: 'ganttTasks', label: 'Tareas y rangos', type: 'textarea', placeholder: 'Spec,1,2,100\nBuild,2,5,60\nTest,5,7,20' },
      { key: 'blockLabels', label: 'Labels bloques', type: 'text', placeholder: 'Bits, Map, RF' },
      { key: 'signalLabel', label: 'Signal label', type: 'text', placeholder: 'x(t), s[n]' },
      { key: 'carrierLabel', label: 'Carrier', type: 'text', placeholder: 'f_c' },
      { key: 'modulation', label: 'Modulation', type: 'text', placeholder: 'QPSK, OFDM, 16-QAM' },
      { key: 'branchCount', label: 'Ramas/antenas', type: 'number', min: 1, max: 16, step: 1 },
      { key: 'symbolCount', label: 'OFDM symbols', type: 'number', min: 1, max: 28, step: 1 },
      { key: 'subcarrierCount', label: 'Subcarriers', type: 'number', min: 1, max: 64, step: 1 },
      { key: 'pilotSpacing', label: 'Pilot spacing', type: 'number', min: 1, max: 16, step: 1 },
      { key: 'variableCount', label: 'LDPC variables', type: 'number', min: 1, max: 16, step: 1 },
      { key: 'checkCount', label: 'LDPC checks', type: 'number', min: 1, max: 12, step: 1 },
      { key: 'antennaCount', label: 'Antennas', type: 'number', min: 1, max: 12, step: 1 },
      { key: 'gainDb', label: 'Gain dB', type: 'number', min: -120, max: 120, step: 0.5 },
      { key: 'noiseLabel', label: 'Noise label', type: 'text', placeholder: 'n(t)' },
    ],
  },
  {
    id: 'metadata',
    title: 'Metadata exportable',
    domains: ['all'],
    fields: [
      { key: 'paperRole', label: 'Rol en paper', type: 'text', placeholder: 'encoder, baseline, measurement...' },
      { key: 'datasetTag', label: 'Dataset/tag', type: 'text', placeholder: 'MNIST, channel A, Fig. 2b' },
      { key: 'referenceName', label: 'Nombre LaTeX', type: 'text', placeholder: 'fig:encoder-node' },
      { key: 'metadataJson', label: 'JSON metadata', type: 'textarea', placeholder: '{"units":"dB","owner":"model"}' },
    ],
  },
]

const quickCircuitConfigKeys = new Set([
  'autoLabel',
  'circuitLabel',
  'circuitValue',
  'circuitOrientation',
  'circuitStyle',
  'terminalStyle',
  'terminalLength',
])

const quickExtraNodeConfigKeys = new Set([
  'extraNodes',
  'nodeSpacing',
  'nodeDirection',
  'nodeShape',
  'nodeLabels',
  'connectNodes',
])

const quickCalloutConfigKeys = new Set([
  'calloutPointerX',
  'calloutPointerY',
])

const objectConfigFieldByKey = new Map(
  objectConfigSections.flatMap((section) => section.fields.map((field) => [field.key, field])),
)

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
  paperTarget: 'content',
  paperWidthCm: '',
  paperHeightCm: '',
  paperMarginCm: 0.3,
  showPaperGuides: true,
  subfigureLayout: 'single',
  subfigureLabels: '(a), (b), (c), (d)',
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
  showGraphFrame: true,
  showGraphGrid: true,
  showGraphAxes: true,
  usePgfplots: true,
  axisType: 'axis',
  axisWidth: '7cm',
  axisHeight: '4.5cm',
  axisLines: 'left',
  xLabel: '$x$',
  yLabel: '$f(x)$',
  plotTitle: '',
  legend: '',
  markerStyle: 'none',
  lineStyle: 'solid',
  gridStyle: 'major',
  xmin: '',
  xmax: '',
  ymin: '',
  ymax: '',
  xTicks: '',
  yTicks: '',
  tickLabelStyle: 'font=\\scriptsize',
  xLabelStyle: '',
  yLabelStyle: '',
  legendStyle: '',
  axisLineStyle: '',
  gridLineStyle: '',
  enlargeLimits: '',
  legendPos: 'north east',
  legendColumns: 1,
  colormap: '',
  axisEqual: false,
  minorTicks: 0,
  reverseX: false,
  reverseY: false,
  errorBars: false,
  errorBarOptions: '/pgfplots/error bars/y dir=both, /pgfplots/error bars/y explicit',
  clip: true,
  logX: false,
  logY: false,
  dataTable: '',
  markedPoints: '',
  series: [],
  yScale: 1,
  axisOptions: '',
  plotOptions: '',
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
    xOffset: 0,
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
    diagramConfig: defaultDiagramConfigForKind(preset.kind),
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

function normalizeBoardElement(element) {
  if (!element || typeof element !== 'object' || typeof element.type !== 'string') return null

  if (element.type === 'library') {
    const preset = getLibraryPreset(element)
    return {
      ...element,
      id: element.id ?? createId(),
      type: 'library',
      presetId: element.presetId ?? preset.id,
      title: element.title ?? preset.title ?? 'Objeto TikZ',
      group: element.group ?? preset.group ?? 'TikZ',
      origin: element.origin ?? preset.origin ?? { x: 0, y: 0 },
      stroke: element.stroke ?? preset.stroke ?? '#111111',
      fill: element.fill ?? preset.fill ?? 'none',
      fillOpacity: element.fillOpacity ?? preset.fillOpacity ?? 0.18,
      scale: element.scale ?? preset.scale ?? 1,
      tikzOptions: element.tikzOptions ?? preset.tikzOptions ?? '',
      config: { ...defaultLibraryConfig(preset), ...(element.config ?? {}) },
      width: element.width ?? preset.defaultStrokeWidth ?? 0.75,
      dashed: Boolean(element.dashed),
    }
  }

  if (element.type === 'diagram') {
    const diagramKind = element.diagramKind ?? 'ml'
    return {
      ...element,
      id: element.id ?? createId(),
      diagramKind,
      title: element.title ?? 'Diagrama',
      origin: element.origin ?? { x: 0, y: 0 },
      stroke: element.stroke ?? '#111111',
      fill: element.fill ?? 'none',
      fillOpacity: element.fillOpacity ?? 0.18,
      tikzOptions: element.tikzOptions ?? '',
      diagramConfig: diagramConfigForElement({ ...element, diagramKind }),
      width: element.width ?? 0.75,
      scale: element.scale ?? 1,
      dashed: Boolean(element.dashed),
    }
  }

  if (element.type === 'function') {
    return {
      ...element,
      id: element.id ?? createId(),
      xOffset: Number(element.xOffset) || 0,
      yOffset: Number(element.yOffset) || 0,
    }
  }

  return { ...element, id: element.id ?? createId() }
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
  if (preset.group !== 'Circuit') return ''
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

function circuitEndPoint(config = {}) {
  const length = Math.max(0.55, Math.min(12, Number(config.terminalLength) || 2.2))
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

function defaultShapeVariantForPreset(preset = {}) {
  const key = `${preset.id ?? ''} ${preset.title ?? ''} ${preset.preview ?? ''}`.toLowerCase()
  if (key.includes('callout')) return 'callout'
  if (key.includes('cloud')) return 'cloud'
  if (key.includes('cylinder')) return 'cylinder'
  if (key.includes('diamond') || key.includes('decision')) return 'diamond'
  if (key.includes('ellipse')) return 'ellipse'
  if (key.includes('circle') || key.includes('state')) return 'circle'
  if (key.includes('process') || key.includes('module') || key.includes('box')) return 'rounded'
  return 'rounded'
}

function defaultLibraryConfig(preset = {}) {
  const circuitPrefix = circuitAutoPrefix(preset)
  const baseConfig = {
    stretchX: 1,
    stretchY: 1,
    label: preset.title ?? 'Object',
    lineCap: 'butt',
    lineJoin: 'miter',
    drawOpacity: 1,
    textOpacity: 1,
    dashPattern: '',
    roundedCorners: 0,
    shadow: false,
    pattern: '',
    align: 'center',
    anchor: 'center',
    fontSize: '',
    fontSeries: '',
    innerSep: 4,
    outerSep: 0,
    minWidth: 0,
    minHeight: 0,
    textWidth: 0,
    inputLabel: '',
    outputLabel: '',
    feedbackLabel: '',
    componentLabels: '',
    supplyLabel: '',
    groundLabel: '',
    channelLabel: '',
    snrLabel: '',
    sampleRateLabel: '',
    shapeVariant: defaultShapeVariantForPreset(preset),
    shapeAspect: 1.7,
    cloudPuffs: 11,
    splitParts: 3,
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
    circuitLabelPosition: 'l',
    voltageLabel: '',
    currentLabel: '',
    bipoleLength: 0,
    mirrorComponent: false,
    invertComponent: false,
    terminalNames: '',
    netName: '',
    spiceModel: '',
    autoLabel: Boolean(circuitPrefix),
    axisWidth: 0,
    axisHeight: 0,
    axisLines: 'left',
    gridMode: 'none',
    xMode: 'linear',
    yMode: 'linear',
    xmin: '',
    xmax: '',
    ymin: '',
    ymax: '',
    plotDomain: '',
    samples: 120,
    xlabel: '',
    ylabel: '',
    plotTitle: '',
    legendPos: '',
    legendColumns: 1,
    markStyle: '',
    plotSmooth: false,
    axisEqual: false,
    minorTicks: 0,
    reverseX: false,
    reverseY: false,
    colormap: '',
    colorbar: false,
    shader: '',
    viewAzimuth: '',
    viewElevation: '',
    pointMeta: '',
    stemPlot: false,
    constPlot: false,
    xtick: '',
    ytick: '',
    xLabelStyle: '',
    yLabelStyle: '',
    tickLabelStyle: '',
    legendStyle: '',
    axisLineStyle: '',
    gridLineStyle: '',
    enlargeLimits: '',
    axisExtraOptions: '',
    addplotExtraOptions: '',
    errorBars: false,
    errorBarOptions: '/pgfplots/error bars/y dir=both, /pgfplots/error bars/y explicit',
    dataTable: '',
    matrixDelimiter: 'none',
    rowSep: 0,
    columnSep: 0,
    matrixEntries: '',
    classLabels: '',
    budgetRows: '',
    edgeStyle: 'solid',
    edgeLabels: '',
    nodeDistance: 0,
    layerDistance: 0,
    siblingDistance: 0,
    barCount: 3,
    barData: '',
    ganttStart: 1,
    ganttEnd: 7,
    ganttProgress: 0,
    ganttTasks: '',
    blockLabels: '',
    signalLabel: '',
    carrierLabel: '',
    modulation: '',
    branchCount: 2,
    symbolCount: 6,
    subcarrierCount: 4,
    pilotSpacing: 3,
    variableCount: 4,
    checkCount: 2,
    antennaCount: 3,
    gainDb: 0,
    noiseLabel: '',
    paperRole: '',
    datasetTag: '',
    referenceName: '',
    metadataJson: '',
    snippetLabelOverrides: {},
  }
  return { ...baseConfig, ...libraryProfileDefaultConfig(preset) }
}

function enumValue(value, options, fallback) {
  return options.some((option) => option.value === value) ? value : fallback
}

function numberInRange(value, fallback, min, max) {
  const number = Number(value)
  if (!Number.isFinite(number)) return fallback
  return Math.max(min, Math.min(max, number))
}

function getLibraryConfig(element, preset = getLibraryPreset(element)) {
  const config = { ...defaultLibraryConfig(preset), ...(element.config ?? {}) }
  return {
    ...config,
    stretchX: Math.max(0.1, Math.min(12, Number(config.stretchX) || 1)),
    stretchY: Math.max(0.1, Math.min(12, Number(config.stretchY) || 1)),
    lineCap: enumValue(config.lineCap, lineCapOptions, 'butt'),
    lineJoin: enumValue(config.lineJoin, lineJoinOptions, 'miter'),
    drawOpacity: numberInRange(config.drawOpacity, 1, 0, 1),
    textOpacity: numberInRange(config.textOpacity, 1, 0, 1),
    roundedCorners: numberInRange(config.roundedCorners, 0, 0, 24),
    shadow: Boolean(config.shadow),
    align: enumValue(config.align, alignOptions, 'center'),
    anchor: enumValue(config.anchor, anchorOptions, 'center'),
    fontSize: enumValue(config.fontSize, fontSizeOptions, ''),
    fontSeries: enumValue(config.fontSeries, fontSeriesOptions, ''),
    innerSep: numberInRange(config.innerSep, 4, 0, 24),
    outerSep: numberInRange(config.outerSep, 0, 0, 16),
    minWidth: numberInRange(config.minWidth, 0, 0, 12),
    minHeight: numberInRange(config.minHeight, 0, 0, 8),
    textWidth: numberInRange(config.textWidth, 0, 0, 12),
    shapeVariant: enumValue(
      config.shapeVariant,
      [...libraryNodeShapeOptions, { value: 'cloud' }, { value: 'cylinder' }, { value: 'callout' }, { value: 'split' }],
      'rounded',
    ),
    shapeAspect: numberInRange(config.shapeAspect, 1.7, 0.2, 6),
    cloudPuffs: Math.round(numberInRange(config.cloudPuffs, 11, 4, 24)),
    splitParts: Math.round(numberInRange(config.splitParts, 3, 1, 8)),
    extraNodes: Math.max(0, Math.min(8, Math.round(Number(config.extraNodes) || 0))),
    nodeSpacing: Math.max(0.25, Math.min(3, Number(config.nodeSpacing) || 0.85)),
    calloutPointerX: Number(config.calloutPointerX) || 0,
    calloutPointerY: Number(config.calloutPointerY) || 0,
    circuitOrientation: ['right', 'left', 'up', 'down'].includes(config.circuitOrientation)
      ? config.circuitOrientation
      : 'right',
    circuitStyle: ['auto', 'iec', 'american'].includes(config.circuitStyle) ? config.circuitStyle : 'auto',
    terminalStyle: ['none', 'filled', 'open', 'mixed'].includes(config.terminalStyle) ? config.terminalStyle : 'none',
    terminalLength: Math.max(0.55, Math.min(12, Number(config.terminalLength) || 2.2)),
    circuitLabelPosition: ['l', 'l_', 'a', 'a_', 'none'].includes(config.circuitLabelPosition)
      ? config.circuitLabelPosition
      : 'l',
    bipoleLength: numberInRange(config.bipoleLength, 0, 0, 5),
    mirrorComponent: Boolean(config.mirrorComponent),
    invertComponent: Boolean(config.invertComponent),
    autoLabel: Boolean(config.autoLabel),
    axisWidth: numberInRange(config.axisWidth, 0, 0, 18),
    axisHeight: numberInRange(config.axisHeight, 0, 0, 12),
    axisLines: enumValue(config.axisLines, axisLineOptions, 'left'),
    gridMode: enumValue(config.gridMode, gridModeOptions, 'none'),
    xMode: enumValue(config.xMode, axisModeOptions, 'linear'),
    yMode: enumValue(config.yMode, axisModeOptions, 'linear'),
    samples: Math.round(numberInRange(config.samples, 120, 2, 1000)),
    legendPos: enumValue(config.legendPos, legendPositionOptions, ''),
    legendColumns: Math.round(numberInRange(config.legendColumns, 1, 1, 8)),
    markStyle: enumValue(config.markStyle, markStyleOptions, ''),
    plotSmooth: Boolean(config.plotSmooth),
    axisEqual: Boolean(config.axisEqual),
    minorTicks: Math.round(numberInRange(config.minorTicks, 0, 0, 20)),
    reverseX: Boolean(config.reverseX),
    reverseY: Boolean(config.reverseY),
    colorbar: Boolean(config.colorbar),
    shader: enumValue(config.shader, shaderOptions, ''),
    viewAzimuth: config.viewAzimuth === '' ? '' : numberInRange(config.viewAzimuth, 0, -360, 360),
    viewElevation: config.viewElevation === '' ? '' : numberInRange(config.viewElevation, 90, -360, 360),
    pointMeta: enumValue(config.pointMeta, pointMetaOptions, ''),
    stemPlot: Boolean(config.stemPlot),
    constPlot: Boolean(config.constPlot),
    errorBars: Boolean(config.errorBars),
    matrixDelimiter: enumValue(config.matrixDelimiter, matrixDelimiterOptions, 'none'),
    rowSep: numberInRange(config.rowSep, 0, 0, 4),
    columnSep: numberInRange(config.columnSep, 0, 0, 4),
    edgeStyle: enumValue(config.edgeStyle, edgeStyleOptions, 'solid'),
    nodeDistance: numberInRange(config.nodeDistance, 0, 0, 6),
    layerDistance: numberInRange(config.layerDistance, 0, 0, 6),
    siblingDistance: numberInRange(config.siblingDistance, 0, 0, 6),
    barCount: Math.round(numberInRange(config.barCount, 3, 1, 20)),
    ganttStart: Math.round(numberInRange(config.ganttStart, 1, 0, 999)),
    ganttEnd: Math.round(numberInRange(config.ganttEnd, 7, 1, 999)),
    ganttProgress: Math.round(numberInRange(config.ganttProgress, 0, 0, 100)),
    branchCount: Math.round(numberInRange(config.branchCount, 2, 1, 16)),
    symbolCount: Math.round(numberInRange(config.symbolCount, 6, 1, 28)),
    subcarrierCount: Math.round(numberInRange(config.subcarrierCount, 4, 1, 64)),
    pilotSpacing: Math.round(numberInRange(config.pilotSpacing, 3, 1, 16)),
    variableCount: Math.round(numberInRange(config.variableCount, 4, 1, 16)),
    checkCount: Math.round(numberInRange(config.checkCount, 2, 1, 12)),
    antennaCount: Math.round(numberInRange(config.antennaCount, 3, 1, 12)),
    gainDb: numberInRange(config.gainDb, 0, -120, 120),
  }
}

function libraryConfigDomains(preset = {}) {
  const text = `${preset.id ?? ''} ${preset.group ?? ''} ${preset.title ?? ''} ${preset.preview ?? ''}`.toLowerCase()
  const domains = new Set(['all'])
  const addIf = (condition, domain) => {
    if (condition) domains.add(domain)
  }

  addIf(text.includes('circuit') || text.includes('source') || text.includes('opamp') || text.includes('transistor'), 'circuit')
  addIf(text.includes('plot') || text.includes('pgfplots') || text.includes('stats') || text.includes('spectrum'), 'plot')
  addIf(text.includes('matrix') || text.includes('tikz-cd') || text.includes('commutative') || text.includes('uml-class'), 'matrix')
  addIf(text.includes('graph') || text.includes('automata') || text.includes('petri') || text.includes('tree') || text.includes('mindmap'), 'graph')
  addIf(text.includes('shape') || text.includes('cloud') || text.includes('callout') || text.includes('cylinder'), 'shape')
  addIf(text.includes('flow') || text.includes('pipeline') || text.includes('module') || text.includes('decision'), 'flow')
  addIf(text.includes('geom') || text.includes('angle') || text.includes('bezier') || text.includes('polygon'), 'geometry')
  addIf(text.includes('annot') || text.includes('brace') || text.includes('highlight'), 'annotation')
  addIf(text.includes('gantt') || text.includes('planning'), 'gantt')
  addIf(text.includes('telecom') || text.includes('rf-') || text.includes('mimo') || text.includes('qpsk') || text.includes('ofdm'), 'telecom')
  addIf(text.includes('ml') || text.includes('dl') || text.includes('cnn') || text.includes('transformer') || text.includes('attention'), 'ml')
  addIf(text.includes('paper') || text.includes('figure') || text.includes('multi-panel'), 'paper')
  return domains
}

function libraryConfigSectionsForPreset(preset = {}) {
  const profileSections = libraryProfileSectionSpecsForPreset(preset)
    .map((section) => ({
      ...section,
      fields: section.fields.map((fieldKey) => objectConfigFieldByKey.get(fieldKey)).filter(Boolean),
    }))
    .filter((section) => section.fields.length)
  if (profileSections.length) return profileSections

  const domains = libraryConfigDomains(preset)
  return objectConfigSections.filter((section) => section.domains.some((domain) => domains.has(domain)))
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
    const rawElements = Array.isArray(payload) ? payload : payload.elements
    if (!Array.isArray(rawElements)) return null
    const nextElements = rawElements.map(normalizeBoardElement).filter(Boolean)
    if (!nextElements.length) return null
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

function tokenizeMathExpression(source) {
  const tokens = []
  let index = 0

  while (index < source.length) {
    const char = source[index]
    if (/\s/.test(char)) {
      index += 1
      continue
    }

    if (/[0-9.]/.test(char)) {
      const start = index
      let hasDigits = false

      while (index < source.length && /[0-9]/.test(source[index])) {
        hasDigits = true
        index += 1
      }

      if (source[index] === '.') {
        index += 1
        while (index < source.length && /[0-9]/.test(source[index])) {
          hasDigits = true
          index += 1
        }
      }

      const exponentStart = index
      if (source[index] === 'e') {
        let next = index + 1
        if (source[next] === '+' || source[next] === '-') next += 1
        if (/[0-9]/.test(source[next])) {
          index = next + 1
          while (index < source.length && /[0-9]/.test(source[index])) index += 1
        } else {
          index = exponentStart
        }
      }

      if (!hasDigits) throw new Error('Expresion matematica invalida')
      tokens.push({ type: 'number', value: Number(source.slice(start, index)) })
      continue
    }

    if (/[a-z]/.test(char)) {
      const start = index
      index += 1
      while (index < source.length && /[a-z0-9]/.test(source[index])) index += 1
      tokens.push({ type: 'name', value: source.slice(start, index) })
      continue
    }

    if ('+-*/^%(),'.includes(char)) {
      tokens.push({ type: char, value: char })
      index += 1
      continue
    }

    throw new Error('Expresion matematica invalida')
  }

  tokens.push({ type: 'end' })
  return tokens
}

function tokenStartsPrimary(token) {
  return token.type === 'number' || token.type === 'name' || token.type === '('
}

function tokenCanContinueImplicitProduct(token, previousTokenType) {
  if (!tokenStartsPrimary(token)) return false
  if (token.type !== 'number') return true
  return previousTokenType === ')'
}

class MathExpressionParser {
  constructor(tokens, xValue) {
    this.tokens = tokens
    this.xValue = xValue
    this.index = 0
  }

  current() {
    return this.tokens[this.index]
  }

  match(type) {
    if (this.current().type !== type) return false
    this.index += 1
    return true
  }

  consume(type) {
    if (this.match(type)) return
    throw new Error('Expresion matematica invalida')
  }

  parse() {
    const value = this.parseAdditive()
    if (this.current().type !== 'end') throw new Error('Expresion matematica invalida')
    return value
  }

  parseAdditive() {
    let value = this.parseMultiplicative()
    while (this.current().type === '+' || this.current().type === '-') {
      if (this.match('+')) {
        value += this.parseMultiplicative()
      } else {
        this.consume('-')
        value -= this.parseMultiplicative()
      }
    }
    return value
  }

  parseMultiplicative() {
    let value = this.parseUnary()
    let previousTokenType = this.tokens[this.index - 1]?.type
    while (
      this.current().type === '*' ||
      this.current().type === '/' ||
      this.current().type === '%' ||
      tokenCanContinueImplicitProduct(this.current(), previousTokenType)
    ) {
      if (this.match('*')) {
        value *= this.parseUnary()
      } else if (this.match('/')) {
        value /= this.parseUnary()
      } else if (this.match('%')) {
        value %= this.parseUnary()
      } else {
        value *= this.parseUnary()
      }
      previousTokenType = this.tokens[this.index - 1]?.type
    }
    return value
  }

  parseUnary() {
    if (this.match('+')) return this.parseUnary()
    if (this.match('-')) return -this.parseUnary()
    return this.parsePower()
  }

  parsePower() {
    const base = this.parsePrimary()
    if (this.match('^')) return Math.pow(base, this.parseUnary())
    return base
  }

  parsePrimary() {
    const token = this.current()
    if (token.type === 'number') {
      this.index += 1
      return token.value
    }

    if (this.match('(')) {
      const value = this.parseAdditive()
      this.consume(')')
      return value
    }

    if (token.type === 'name') {
      this.index += 1
      const name = token.value
      if (name === 'x') return this.xValue
      if (Object.prototype.hasOwnProperty.call(mathConstants, name)) return mathConstants[name]
      if (!Object.prototype.hasOwnProperty.call(mathFunctionHelpers, name)) {
        throw new Error(`Nombre no permitido: ${name}`)
      }
      if (!this.match('(')) throw new Error(`Funcion requiere parentesis: ${name}`)

      const args = []
      if (!this.match(')')) {
        do {
          args.push(this.parseAdditive())
        } while (this.match(','))
        this.consume(')')
      }
      return mathFunctionHelpers[name](...args)
    }

    throw new Error('Expresion matematica invalida')
  }
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

  const tokens = tokenizeMathExpression(normalized)
  return (x) => new MathExpressionParser(tokens, x).parse()
}

function sampleExpressionPoints(expression, domainStart, domainEnd, sampleCount) {
  let evaluator
  try {
    evaluator = compileExpression(expression)
  } catch {
    return []
  }

  const start = Number(domainStart)
  const end = Number(domainEnd)
  const samples = Math.max(8, Math.min(400, Number(sampleCount) || 120))
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

function functionLineStyleOption(value) {
  return functionLineStyleOptions.find((option) => option.value === value) ?? functionLineStyleOptions[0]
}

function functionLineStyleTikz(value) {
  return functionLineStyleOption(value).tikz
}

function functionLineStyleSvg(value) {
  return functionLineStyleOption(value).dashArray
}

function evaluateScalarExpression(value, x = 0) {
  const trimmed = `${value}`.trim()
  if (!trimmed) return Number.NaN
  const numeric = Number(trimmed)
  if (Number.isFinite(numeric)) return numeric
  try {
    const evaluator = compileExpression(trimmed)
    const result = evaluator(x)
    return Number.isFinite(result) ? result : Number.NaN
  } catch {
    return Number.NaN
  }
}

function parseMarkedFunctionPoints(value = '') {
  return `${value}`
    .split(/\n|;/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [xValue, yValue, ...labelParts] = line.split(',').map((part) => part.trim())
      const x = evaluateScalarExpression(xValue)
      const y = evaluateScalarExpression(yValue, x)
      if (!Number.isFinite(x) || !Number.isFinite(y)) return null
      return {
        x,
        y,
        label: labelParts.join(', ').trim(),
      }
    })
    .filter(Boolean)
}

function normalizeFunctionSeries(series = {}, index = 0) {
  return {
    id: series.id || `series-${index + 1}`,
    expression:
      series.expression === undefined
        ? functionQuickExpressions[(index + 1) % functionQuickExpressions.length]
        : `${series.expression}`.trim(),
    color: series.color || strokeColors[(index + 3) % strokeColors.length].value,
    lineStyle: series.lineStyle || series.style || (index % 2 === 0 ? 'dashed' : 'dotted'),
    width: Math.max(0.2, Math.min(4, Number(series.width) || 0.75)),
    markerStyle: series.markerStyle || 'none',
    legend: series.legend ?? '',
    plotOptions: series.plotOptions ?? '',
    dataTable: series.dataTable ?? '',
    yOffset: Number(series.yOffset) || 0,
    enabled: series.enabled !== false,
  }
}

function primaryFunctionSeries(element) {
  const options = functionOptionsFor(element)
  return {
    id: 'primary',
    expression: element.expression,
    color: element.stroke || '#111111',
    lineStyle: options.lineStyle || (element.dashed ? 'dashed' : 'solid'),
    width: Math.max(0.2, Math.min(4, Number(element.width) || 0.75)),
    markerStyle: options.markerStyle || 'none',
    legend: options.legend || '',
    plotOptions: options.plotOptions || '',
    dataTable: options.dataTable || '',
    yOffset: 0,
    enabled: true,
    primary: true,
  }
}

function editableFunctionSeriesFor(element) {
  const options = functionOptionsFor(element)
  return Array.isArray(options.series) ? options.series.map(normalizeFunctionSeries) : []
}

function functionSeriesFor(element) {
  return [
    primaryFunctionSeries(element),
    ...editableFunctionSeriesFor(element).filter((series) => series.enabled && functionSeriesIsRenderable(series)),
  ]
}

function functionYScaleFor(element) {
  const value = Number(functionOptionsFor(element).yScale)
  return Number.isFinite(value) && Math.abs(value) > 0.0001 ? value : 1
}

function sampleFunctionSeries(element, series) {
  const yScale = functionYScaleFor(element)
  const xOffset = Number(element.xOffset) || 0
  const baseYOffset = Number(element.yOffset) || 0
  const seriesYOffset = Number(series.yOffset) || 0
  const offset = baseYOffset + seriesYOffset
  const dataPoints = parseFunctionDataTable(series.dataTable)
  if (dataPoints.length) {
    return dataPoints.map((point) => ({
      x: point.x + xOffset,
      y: point.y * yScale + offset,
      yError: Number.isFinite(point.yError) ? Math.abs(point.yError * yScale) : undefined,
    }))
  }

  return sampleExpressionPoints(series.expression, element.domainStart, element.domainEnd, element.samples).map((point) =>
    point ? { x: point.x + xOffset, y: point.y * yScale + offset } : null,
  )
}

function functionDisplaySeries(element) {
  return functionSeriesFor(element)
    .map((series) => ({
      series,
      points: sampleFunctionSeries(element, series),
    }))
    .filter(({ points }) => points.some(Boolean))
}

function allFunctionDisplayPoints(element) {
  return functionDisplaySeries(element).flatMap(({ points }) => points.filter(Boolean))
}

function functionDataBounds(element) {
  const points = allFunctionDisplayPoints(element)
  const xOffset = Number(element.xOffset) || 0
  if (!points.length) return { minX: Number(element.domainStart) + xOffset, maxX: Number(element.domainEnd) + xOffset, minY: -1, maxY: 1 }
  const xs = points.map((point) => point.x)
  const ys = points.map((point) => point.y)
  return expandFlatFunctionBounds({
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  })
}

function functionPreviewLayout(element) {
  const dataBounds = functionDataBounds(element)
  const frameBounds = functionFrameBoundsForDataBounds(dataBounds, functionOptionsFor(element))
  return { dataBounds, frameBounds }
}

function mapFunctionPointForPreview(point, layout) {
  return mapFunctionPointToFrame(point, layout.dataBounds, layout.frameBounds)
}

function expandFlatFunctionBounds(bounds) {
  const center = boundsCenter(bounds)
  const width = Math.max(0.8, bounds.maxX - bounds.minX)
  const height = Math.max(0.8, bounds.maxY - bounds.minY)
  return {
    minX: center.x - width / 2,
    maxX: center.x + width / 2,
    minY: center.y - height / 2,
    maxY: center.y + height / 2,
  }
}

function niceGraphStep(range, target = 6) {
  const rawStep = Math.max(0.001, Math.abs(range) / target)
  const magnitude = 10 ** Math.floor(Math.log10(rawStep))
  const normalized = rawStep / magnitude
  const nice = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 2.5 ? 2.5 : normalized <= 5 ? 5 : 10
  return nice * magnitude
}

function graphTicks(min, max, target = 6) {
  const step = niceGraphStep(max - min, target)
  const ticks = []
  const start = Math.ceil(min / step) * step
  for (let value = start; value <= max + step * 0.01 && ticks.length < 32; value += step) {
    ticks.push(Number(formatNumber(value)))
  }
  return ticks
}

function functionDisplayPoints(element) {
  return functionDisplaySeries(element)[0]?.points.filter(Boolean) ?? []
}

function functionFeaturePoints(element) {
  const points = functionDisplayPoints(element)
  const options = functionOptionsFor(element)
  const yScale = functionYScaleFor(element)
  const xOffset = Number(element.xOffset) || 0
  const yOffset = Number(element.yOffset) || 0
  const features = {
    xIntercepts: [],
    yIntercept: null,
    extrema: [],
    samples: [],
    asymptotes: [],
    tangent: null,
    marked: parseMarkedFunctionPoints(options.markedPoints).map((point) => ({
      ...point,
      x: point.x + xOffset,
      y: point.y * yScale + yOffset,
    })),
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
  return moveElementBy(element, deltaX, deltaY)
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
    return functionPreviewLayout(element).frameBounds
  }

  if (element.type === 'text') {
    const metrics = labelMetricsForElement(element)
    const halfWidth = metrics.widthCm / 2
    const halfHeight = metrics.heightCm / 2
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

function moveOriginToBoundsMin(element, nextBounds) {
  const bounds = elementBounds(element)
  return {
    ...element,
    origin: {
      x: element.origin.x + nextBounds.minX - bounds.minX,
      y: element.origin.y + nextBounds.minY - bounds.minY,
    },
  }
}

function resizeOriginScaledElement(element, nextBounds, currentWidth, currentHeight, nextWidth, nextHeight) {
  const scale = Number(element.scale) || 1
  const ratio = Math.max(0.05, Math.min(8, Math.min(nextWidth / currentWidth, nextHeight / currentHeight)))
  return moveOriginToBoundsMin(
    {
      ...element,
      scale: Number(formatNumber(scale * ratio)),
    },
    nextBounds,
  )
}

function resizeLibraryElementToBounds(element, nextBounds, currentWidth, currentHeight, nextWidth, nextHeight) {
  const preset = getLibraryPreset(element)
  const config = getLibraryConfig(element, preset)
  const xRatio = nextWidth / currentWidth
  const yRatio = nextHeight / currentHeight
  const circuitComponent = circuitTikzComponent(preset, config)

  if (circuitComponent) {
    const horizontal = config.circuitOrientation === 'right' || config.circuitOrientation === 'left'
    const terminalRatio = horizontal ? xRatio : yRatio
    const scaleRatio = horizontal ? yRatio : xRatio
    return moveOriginToBoundsMin(
      {
        ...element,
        scale: Number(formatNumber(Math.max(0.05, (Number(element.scale) || 1) * scaleRatio))),
        config: {
          ...element.config,
          terminalLength: Number(formatNumber(Math.max(0.55, Math.min(12, config.terminalLength * terminalRatio)))),
        },
      },
      nextBounds,
    )
  }

  return moveOriginToBoundsMin(
    {
      ...element,
      config: {
        ...element.config,
        stretchX: Number(formatNumber(Math.max(0.1, Math.min(12, config.stretchX * xRatio)))),
        stretchY: Number(formatNumber(Math.max(0.1, Math.min(12, config.stretchY * yRatio)))),
      },
    },
    nextBounds,
  )
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
  if (element.type === 'text') {
    const nextFontSize = Math.max(6, Math.min(96, (Number(element.fontSize) || labelMetricsForElement(element).fontSize) * (nextHeight / currentHeight)))
    return {
      ...element,
      position: boundsCenter(nextBounds),
      labelWidth: Number(formatNumber(nextWidth)),
      labelHeight: Number(formatNumber(nextHeight)),
      fontSize: Number(formatNumber(nextFontSize)),
    }
  }
  if (element.type === 'function') {
    return resizeFunctionPlotToBounds(element, nextBounds, current, functionOptionsFor(element), formatNumber)
  }
  if (element.type === 'diagram') return resizeOriginScaledElement(element, nextBounds, currentWidth, currentHeight, nextWidth, nextHeight)
  if (element.type === 'library') return resizeLibraryElementToBounds(element, nextBounds, currentWidth, currentHeight, nextWidth, nextHeight)
  return element
}

function escapeTikzText(text) {
  return `${text ?? ''}`.replace(/[\\{}_%$#&]/g, (match) => {
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

function formatTikzTextSegment(text) {
  const value = `${text ?? ''}`
  if (!value) return ''
  if (!/\\/.test(value)) return escapeTikzText(value)

  const latexFragments = []
  const protectedText = value.replace(
    /\\(?:[A-Za-z]+|.)(?:\{[^{}]*\})*(?:[_^](?:\{[^{}]*\}|[A-Za-z0-9]+))*/g,
    (fragment) => {
      const token = `@@${latexFragments.length}@@`
      latexFragments.push(fragment)
      return token
    },
  )

  return escapeTikzText(protectedText).replace(/@@(\d+)@@/g, (_, index) => latexFragments[Number(index)] ?? '')
}

function formatTikzNodeText(text) {
  const value = `${text ?? ''}`
  if (!/\$[^$]+\$/.test(value)) return formatTikzTextSegment(value)
  return value
    .split(/(\$[^$]+\$)/g)
    .map((part) => (part.startsWith('$') && part.endsWith('$') ? part : formatTikzTextSegment(part)))
    .join('')
}

function indentLatex(lines, spaces = 2) {
  const pad = ' '.repeat(spaces)
  return lines.map((line) => (line ? `${pad}${line}` : line))
}

function safeLatexLabel(label) {
  return `${label ?? ''}`
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

function loadKatexRenderer() {
  if (katexRenderer) return Promise.resolve(katexRenderer)
  katexLoadPromise ??= import('katex').then((module) => {
    katexRenderer = module.default ?? module
    return katexRenderer
  })
  return katexLoadPromise
}

function renderMathHtml(content) {
  if (!katexRenderer) return `<span class="latex-fallback">${escapeHtml(previewLatexContent(content))}</span>`
  try {
    return katexRenderer.renderToString(content, {
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

function labelMetricsForElement(element) {
  const defaultBox = labelBoxForText(element.text)
  const widthCm = Math.max(0.25, Number(element.labelWidth) || defaultBox.width / CANVAS.scale)
  const heightCm = Math.max(0.18, Number(element.labelHeight) || defaultBox.height / CANVAS.scale)
  const defaultFontSize = Math.max(8, Math.min(72, heightCm * CANVAS.scale * 0.48))
  const fontSize = Math.max(6, Math.min(96, Number(element.fontSize) || defaultFontSize))
  return {
    width: widthCm * CANVAS.scale,
    height: heightCm * CANVAS.scale,
    widthCm,
    heightCm,
    fontSize,
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
  const bounds = diagramLocalBounds(element)

  return {
    minX: element.origin.x + bounds.x * scale,
    maxX: element.origin.x + (bounds.x + bounds.width) * scale,
    minY: element.origin.y + bounds.y * scale,
    maxY: element.origin.y + (bounds.y + bounds.height) * scale,
  }
}

function diagramLocalBounds(element) {
  const config = diagramConfigForElement(element)

  if (element.diagramKind === 'gantt') {
    const metrics = ganttMetricsForTasks(ganttTasksForConfig(config))
    return {
      x: metrics.minStart - 0.75,
      y: -metrics.height - 0.35,
      width: metrics.width + 1.45,
      height: metrics.height + 1,
    }
  }

  if (element.diagramKind === 'ml') {
    const steps = mlStepsForConfig(config)
    return {
      x: -0.75,
      y: -0.85,
      width: Math.max(8.6, steps.length * 1.55 + 0.75),
      height: 1.7,
    }
  }

  if (element.diagramKind === 'dl') {
    const layers = dlLayersForConfig(config)
    const maxNodeY = Math.max(...layers.map((layer) => (layer.count - 1) * 0.36), 1.3)
    const top = maxNodeY + 0.9
    const bottom = -maxNodeY - 0.85
    return {
      x: -0.55,
      y: bottom,
      width: Math.max(6.65, (layers.length - 1) * 1.65 + 1.1),
      height: top - bottom,
    }
  }

  if (element.diagramKind === 'circuit') {
    return { x: -0.75, y: -2.75, width: 6.15, height: 3.25 }
  }

  return { x: -0.5, y: -0.5, width: 3, height: 2 }
}

function tikzPoint(element, point) {
  const absolute = diagramPoint(element, point)
  return `(${formatNumber(absolute.x)},${formatNumber(absolute.y)})`
}

function tikzNodeId(element, suffix) {
  const compactId = element.id.replace(/[^A-Za-z0-9]/g, '').slice(0, 8)
  return `${element.diagramKind}${compactId}${suffix}`.replace(/[^A-Za-z0-9]/g, '')
}

function diagramSvgLabelText(value) {
  return `${value ?? ''}`
    .replaceAll('$', '')
    .replace(/_\{([^}]+)\}/g, '$1')
    .replace(/\\([A-Za-z]+)/g, '$1')
    .replace(/[{}]/g, '')
}

function buildDiagramTikz(element, ensureColor) {
  const color = ensureColor(element.stroke)
  const fill = ensureColor(element.fill)
  const fillOpacity = formatNumber(element.fillOpacity ?? 0.18)
  const nodeFillStyle = fill === 'none' ? `fill=${color}!8` : `fill=${fill}, fill opacity=${fillOpacity}, text opacity=1`
  const markFillStyle = fill === 'none' ? `fill=${color}!10` : `fill=${fill}, fill opacity=${fillOpacity}, text opacity=1`
  const title = formatTikzNodeText(element.title)
  const config = diagramConfigForElement(element)

  if (element.diagramKind === 'circuit') {
    const labels = circuitLabelsForConfig(config)
    return [
      `  % ${element.title}`,
      `  \\draw[draw=${color}, line width=${formatNumber(element.width)}pt]`,
      `    ${tikzPoint(element, { x: 0, y: 0 })} to[sV,l={${formatTikzNodeText(labels.sourceLabel)}}] ${tikzPoint(element, {
        x: 0,
        y: -2.4,
      })}`,
      `    -- ${tikzPoint(element, { x: 4.8, y: -2.4 })} to[C,l={${formatTikzNodeText(labels.capacitorLabel)}}] ${tikzPoint(
        element,
        { x: 4.8, y: 0 },
      )}`,
      `    -- ${tikzPoint(element, { x: 3.1, y: 0 })} to[R,l={${formatTikzNodeText(labels.resistorLabel)}}] ${tikzPoint(element, {
        x: 1.1,
        y: 0,
      })}`,
      `    -- ${tikzPoint(element, { x: 0, y: 0 })};`,
      `  \\node[anchor=west, text=${color}] at ${tikzPoint(element, { x: 5.05, y: 0 })} {${formatTikzNodeText(labels.outputLabel)}};`,
    ]
  }

  if (element.diagramKind === 'gantt') {
    const tasks = ganttTasksForConfig(config)
    const metrics = ganttMetricsForTasks(tasks)
    const lines = [
      `  % ${element.title}`,
      `  \\node[anchor=west, text=${color}, font=\\bfseries] at ${tikzPoint(element, { x: metrics.minStart, y: 0.45 })} {${title}};`,
      `  \\draw[draw=${color}!45, line width=0.45pt] ${tikzPoint(element, {
        x: metrics.minStart,
        y: 0,
      })} rectangle ${tikzPoint(element, { x: metrics.maxEnd, y: -metrics.height })};`,
    ]

    const tickStart = Math.floor(metrics.minStart)
    const tickEnd = Math.ceil(metrics.maxEnd)
    const tickStep = Math.max(1, Math.ceil((tickEnd - tickStart) / 10))
    for (let tick = tickStart; tick <= tickEnd; tick += tickStep) {
      lines.push(
        `  \\draw[draw=${color}!18, line width=0.25pt] ${tikzPoint(element, { x: tick, y: 0 })} -- ${tikzPoint(element, {
          x: tick,
          y: -metrics.height,
        })};`,
        `  \\node[font=\\scriptsize, text=${color}!75] at ${tikzPoint(element, { x: tick, y: 0.18 })} {${formatNumber(tick)}};`,
      )
    }

    tasks.forEach((task) => {
      const y = -0.45 - task.row * 0.58
      lines.push(
        `  \\node[anchor=east, font=\\scriptsize, text=${color}] at ${tikzPoint(element, {
          x: metrics.minStart - 0.18,
          y,
        })} {${formatTikzNodeText(task.label)}};`,
        `  \\filldraw[${fill === 'none' ? `fill=${color}!18` : `fill=${fill}, fill opacity=${fillOpacity}`}, draw=${color}, rounded corners=1.5pt] ${tikzPoint(element, {
          x: task.start,
          y: y + 0.18,
        })} rectangle ${tikzPoint(element, { x: task.end, y: y - 0.18 })};`,
      )
    })

    return lines
  }

  if (element.diagramKind === 'ml') {
    const steps = mlStepsForConfig(config)
    const titleX = ((steps.length - 1) * 1.55) / 2
    const lines = [
      `  % ${element.title}`,
      `  \\node[text=${color}, font=\\bfseries] at ${tikzPoint(element, { x: titleX, y: 0.72 })} {${title}};`,
    ]

    steps.forEach((step, index) => {
      const name = tikzNodeId(element, `step${index}`)
      lines.push(
        `  \\node[draw=${color}, ${nodeFillStyle}, rounded corners=2pt, minimum width=1.18cm, minimum height=0.62cm, align=center] (${name}) at ${tikzPoint(
          element,
          { x: index * 1.55, y: 0 },
        )} {\\scriptsize ${formatTikzNodeText(step)}};`,
      )
      if (index > 0) {
        lines.push(`  \\draw[->, draw=${color}, line width=0.45pt] (${tikzNodeId(element, `step${index - 1}`)}) -- (${name});`)
      }
    })

    return lines
  }

  if (element.diagramKind === 'dl') {
    const layers = dlLayersForConfig(config)
    const maxNodeY = Math.max(...layers.map((layer) => (layer.count - 1) * 0.36), 1.3)
    const titleX = ((layers.length - 1) * 1.65) / 2
    const titleY = maxNodeY + 0.65
    const labelY = -maxNodeY - 0.55
    const lines = [
      `  % ${element.title}`,
      `  \\node[text=${color}, font=\\bfseries] at ${tikzPoint(element, { x: titleX, y: titleY })} {${title}};`,
    ]

    layers.forEach((layer, layerIndex) => {
      const x = layerIndex * 1.65
      for (let nodeIndex = 0; nodeIndex < layer.count; nodeIndex += 1) {
        const y = (layer.count - 1) * 0.36 - nodeIndex * 0.72
        lines.push(
          `  \\node[circle, draw=${color}, ${markFillStyle}, minimum size=0.22cm, inner sep=0pt] (${tikzNodeId(
            element,
            `l${layerIndex}n${nodeIndex}`,
          )}) at ${tikzPoint(element, { x, y })} {};`,
        )
      }
    })

    layers.slice(0, -1).forEach((layer, layerIndex) => {
      for (let left = 0; left < layer.count; left += 1) {
        for (let right = 0; right < layers[layerIndex + 1].count; right += 1) {
          lines.push(
            `  \\draw[draw=${color}!35, line width=0.25pt] (${tikzNodeId(element, `l${layerIndex}n${left}`)}) -- (${tikzNodeId(
              element,
              `l${layerIndex + 1}n${right}`,
            )});`,
          )
        }
      }
    })

    layers.forEach((layer, index) => {
      lines.push(
        `  \\node[font=\\scriptsize, text=${color}] at ${tikzPoint(element, { x: index * 1.65, y: labelY })} {${formatTikzNodeText(
          layer.label,
        )}};`,
      )
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

function wireSegmentsForElement(element) {
  if (element.type === 'line' || element.type === 'arrow') return [[element.start, element.end]]
  if (element.type === 'path') return element.points.slice(1).map((point, index) => [element.points[index], point])
  return []
}

function segmentIntersection(a1, a2, b1, b2) {
  const denominator = (a1.x - a2.x) * (b1.y - b2.y) - (a1.y - a2.y) * (b1.x - b2.x)
  if (Math.abs(denominator) < 0.0001) return null
  const t = ((a1.x - b1.x) * (b1.y - b2.y) - (a1.y - b1.y) * (b1.x - b2.x)) / denominator
  const u = -((a1.x - a2.x) * (a1.y - b1.y) - (a1.y - a2.y) * (a1.x - b1.x)) / denominator
  if (t < 0 || t > 1 || u < 0 || u > 1) return null
  return {
    x: a1.x + t * (a2.x - a1.x),
    y: a1.y + t * (a2.y - a1.y),
  }
}

function buildNetlistMetadata(elements) {
  const visible = elements.filter((element) => !element.hidden)
  const terminals = visible.flatMap((element) => {
    const preset = element.type === 'library' ? getLibraryPreset(element) : null
    const config = element.type === 'library' ? getLibraryConfig(element, preset) : {}
    const terminalNames = splitNodeLabels(config.terminalNames, 8)
    return terminalPointsForElement(element).map((point, index) => ({
      id: `${element.id}:t${index}`,
      elementId: element.id,
      elementTitle: elementDisplayName(element),
      terminal: terminalNames[index] ?? `${index + 1}`,
      preferredNet: config.netName || '',
      point,
      kind: element.type,
    }))
  })

  const wireSegments = visible.flatMap((element) =>
    wireSegmentsForElement(element).map(([start, end], index) => ({
      id: `${element.id}:s${index}`,
      elementId: element.id,
      start,
      end,
    })),
  )

  const junctions = []
  wireSegments.forEach((segment, index) => {
    wireSegments.slice(index + 1).forEach((other) => {
      const point = segmentIntersection(segment.start, segment.end, other.start, other.end)
      if (!point) return
      junctions.push({
        id: `junction:${junctions.length + 1}`,
        elementId: `${segment.elementId}+${other.elementId}`,
        elementTitle: 'wire junction',
        terminal: 'junction',
        preferredNet: '',
        point,
        kind: 'junction',
      })
    })
  })

  const allTerminals = [...terminals, ...junctions]
  const nets = []
  allTerminals.forEach((terminal) => {
    const match = nets.find((net) => net.terminals.some((candidate) => distance(candidate.point, terminal.point) < 0.08))
    if (match) {
      match.terminals.push(terminal)
    } else {
      nets.push({ terminals: [terminal] })
    }
  })

  const namedNets = nets
    .filter((net) => net.terminals.length > 1 || net.terminals.some((terminal) => terminal.preferredNet))
    .map((net, index) => {
      const preferred = net.terminals.find((terminal) => terminal.preferredNet)?.preferredNet
      return {
        name: preferred || `N${index + 1}`,
        terminals: net.terminals.map((terminal) => ({
          elementId: terminal.elementId,
          elementTitle: terminal.elementTitle,
          terminal: terminal.terminal,
          x: Number(formatNumber(terminal.point.x)),
          y: Number(formatNumber(terminal.point.y)),
        })),
      }
    })

  const components = visible
    .filter((element) => element.type === 'library')
    .map((element) => {
      const preset = getLibraryPreset(element)
      const config = getLibraryConfig(element, preset)
      const metadata = libraryObjectMetadata(element, preset, config)
      const componentTerminals = metadata.terminals.map((terminal) => ({
        ...terminal,
        net:
          namedNets.find((net) =>
            net.terminals.some(
              (candidate) => candidate.elementId === element.id && candidate.x === terminal.x && candidate.y === terminal.y,
            ),
          )?.name ?? config.netName,
      }))
      const ref = config.circuitLabel || config.referenceName || element.title
      const value = config.circuitValue || config.spiceModel || '*'
      return {
        ...metadata,
        terminals: componentTerminals,
        spiceLine:
          componentTerminals.length >= 2
            ? `${ref} ${componentTerminals.map((terminal) => terminal.net || 'NC').join(' ')} ${value}`.trim()
            : '',
      }
    })

  return {
    generatedAt: new Date().toISOString(),
    units: 'cm',
    terminalSnapTolerance: 0.08,
    nets: namedNets,
    junctions: junctions.map((junction) => ({
      x: Number(formatNumber(junction.point.x)),
      y: Number(formatNumber(junction.point.y)),
    })),
    components,
    spiceLike: components.map((component) => component.spiceLine).filter(Boolean),
  }
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
    const layout = functionPreviewLayout(element)
    return functionDisplaySeries(element).some(({ points }) =>
      polylineHitsPoint(
        points.map((candidate) => (candidate ? mapFunctionPointForPreview(candidate, layout) : null)).filter(Boolean),
        point,
        radius,
      ),
    )
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

function libraryCommonTikzOptions(config) {
  const options = []
  if (config.lineCap !== 'butt') options.push(`line cap=${config.lineCap}`)
  if (config.lineJoin !== 'miter') options.push(`line join=${config.lineJoin}`)
  if (config.drawOpacity !== 1) options.push(`draw opacity=${formatNumber(config.drawOpacity)}`)
  if (config.textOpacity !== 1) options.push(`text opacity=${formatNumber(config.textOpacity)}`)
  if (config.dashPattern.trim()) options.push(`dash pattern=on ${config.dashPattern.trim()}`)
  if (config.roundedCorners > 0) options.push(`rounded corners=${formatNumber(config.roundedCorners)}pt`)
  if (config.shadow) options.push('drop shadow')
  if (config.pattern.trim()) options.push(`pattern=${config.pattern.trim()}`)
  return options
}

function libraryNodeTikzOptions(config) {
  const options = [
    `align=${config.align}`,
    `anchor=${config.anchor}`,
    `inner sep=${formatNumber(config.innerSep)}pt`,
    `outer sep=${formatNumber(config.outerSep)}pt`,
  ]
  if (config.fontSize || config.fontSeries) options.push(`font=${[config.fontSize, config.fontSeries].filter(Boolean).join(' ')}`)
  if (config.minWidth > 0) options.push(`minimum width=${formatNumber(config.minWidth)}cm`)
  if (config.minHeight > 0) options.push(`minimum height=${formatNumber(config.minHeight)}cm`)
  if (config.textWidth > 0) options.push(`text width=${formatNumber(config.textWidth)}cm`)
  return options
}

function libraryGraphTikzOptions(config) {
  const options = []
  if (config.nodeDistance > 0) options.push(`node distance=${formatNumber(config.nodeDistance)}cm`)
  if (config.layerDistance > 0) options.push(`level distance=${formatNumber(config.layerDistance)}cm`)
  if (config.siblingDistance > 0) options.push(`sibling distance=${formatNumber(config.siblingDistance)}cm`)
  return options
}

function libraryAxisTikzOptions(config) {
  const options = []
  if (config.axisWidth > 0) options.push(`width=${formatNumber(config.axisWidth)}cm`)
  if (config.axisHeight > 0) options.push(`height=${formatNumber(config.axisHeight)}cm`)
  if (config.axisLines !== 'left') options.push(`axis lines=${config.axisLines}`)
  if (config.gridMode !== 'none') options.push(`grid=${config.gridMode}`)
  if (config.xMode === 'log') options.push('xmode=log')
  if (config.yMode === 'log') options.push('ymode=log')
  if (config.xlabel.trim()) options.push(`xlabel={${formatTikzNodeText(config.xlabel)}}`)
  if (config.ylabel.trim()) options.push(`ylabel={${formatTikzNodeText(config.ylabel)}}`)
  if (config.plotTitle.trim()) options.push(`title={${formatTikzNodeText(config.plotTitle)}}`)
  if (config.legendPos) options.push(`legend pos=${config.legendPos}`)
  options.push(...advancedPgfplotsAxisOptions(config))
  if (config.colorbar) options.push('colorbar')
  if (config.viewAzimuth !== '' && config.viewElevation !== '') {
    options.push(`view={${formatNumber(config.viewAzimuth)}}{${formatNumber(config.viewElevation)}}`)
  }
  if (config.xtick.trim()) options.push(`xtick={${config.xtick.trim()}}`)
  if (config.ytick.trim()) options.push(`ytick={${config.ytick.trim()}}`)
  if (config.colormap.trim()) options.push(`colormap/${config.colormap.trim()}`)
  options.push(...splitTikzOptions(config.axisExtraOptions))
  return options
}

function libraryMatrixTikzOptions(config) {
  const options = []
  const delimiters = {
    brackets: ['{[}', '{]}'],
    parentheses: ['{(}', '{)}'],
    braces: ['\\{', '\\}'],
    pipes: ['|', '|'],
  }
  if (delimiters[config.matrixDelimiter]) {
    options.push(`left delimiter=${delimiters[config.matrixDelimiter][0]}`)
    options.push(`right delimiter=${delimiters[config.matrixDelimiter][1]}`)
  }
  if (config.rowSep > 0) options.push(`row sep=${formatNumber(config.rowSep)}cm`)
  if (config.columnSep > 0) options.push(`column sep=${formatNumber(config.columnSep)}cm`)
  return options
}

function libraryGanttTikzOptions() {
  return []
}

function applyLibraryConfigToSnippet(lines, preset, element) {
  const config = getLibraryConfig(element, preset)
  const common = libraryCommonTikzOptions(config)
  const nodeOptions = [...common, ...libraryNodeTikzOptions(config)]
  const drawOptions = [...common, config.edgeStyle !== 'solid' ? config.edgeStyle : '']
  const axisOptions = libraryAxisTikzOptions(config)
  const addPlotOptions = libraryAddPlotTikzOptions(config)
  const matrixOptions = libraryMatrixTikzOptions(config)
  const graphOptions = libraryGraphTikzOptions(config)
  const ganttOptions = libraryGanttTikzOptions(config)
  let nextLines = lines
  nextLines = applyPgfplotsAxisMode(nextLines, config, {
    xMode: Object.hasOwn(element.config ?? {}, 'xMode'),
    yMode: Object.hasOwn(element.config ?? {}, 'yMode'),
  })
  nextLines = injectTikzOptionsIntoLines(nextLines, axisOptions, [
    '\\begin{axis}',
    '\\begin{semilogxaxis}',
    '\\begin{semilogyaxis}',
    '\\begin{loglogaxis}',
    '\\begin{polaraxis}',
    '\\begin{groupplot}',
  ])
  nextLines = injectTikzOptionsIntoLines(nextLines, addPlotOptions, ['\\addplot3', '\\addplot+', '\\addplot'])
  nextLines = applyLibraryPlotModulation(nextLines, preset.id, config)
  nextLines = applyLibraryPlotDataTable(nextLines, config.dataTable)
  nextLines = injectTikzOptionsIntoLines(nextLines, matrixOptions, ['\\matrix'])
  nextLines = injectTikzOptionsIntoLines(nextLines, ganttOptions, ['\\begin{ganttchart}'])
  nextLines = injectTikzOptionsIntoLines(nextLines, nodeOptions, ['\\node'])
  nextLines = injectTikzOptionsIntoLines(nextLines, drawOptions, ['\\draw', '\\path'])
  nextLines = injectTikzOptionsIntoLines(nextLines, graphOptions, ['\\graph'])
  return nextLines
}

function buildConfiguredLibrarySnippet(preset, element) {
  const config = getLibraryConfig(element, preset)
  const defaultConfig = defaultLibraryConfig(preset)
  const label = formatTikzNodeText(config.label || element.title)
  const width = formatNumber(Math.max(0.7, 1.35 * config.stretchX))
  const height = formatNumber(Math.max(0.35, 0.62 * config.stretchY))
  const circuitComponent = circuitTikzComponent(preset, config)
  if (
    !shouldUseConfiguredLibrarySnippet(preset, config, {
      hasCircuitComponent: Boolean(circuitComponent),
      explicitBlockLabels: Boolean(element.config?.blockLabels?.trim()),
      explicitModularDiagramConfig: diagramSemanticConfigChanged(preset, config, defaultConfig),
    })
  ) {
    return null
  }

  if (circuitComponent) {
    const end = circuitEndPoint(config)
    const terminals = circuitTerminalOption(config.terminalStyle)
    const drawOptions = circuitDrawTikzOptions(config, formatNumber)
    const componentOptions = [circuitComponent]
    if (terminals) componentOptions.push(terminals)
    const printedLabel = config.autoLabel ? config.circuitLabel : config.label
    const value = `${config.circuitValue ?? ''}`.trim()
    const circuitLabel = value ? `${printedLabel}=${value}` : printedLabel
    if (circuitLabel.trim() && config.circuitLabelPosition !== 'none') {
      componentOptions.push(`${config.circuitLabelPosition}={${formatTikzNodeText(circuitLabel)}}`)
    }
    if (config.voltageLabel.trim()) componentOptions.push(`v={${formatTikzNodeText(config.voltageLabel)}}`)
    if (config.currentLabel.trim()) componentOptions.push(`i={${formatTikzNodeText(config.currentLabel)}}`)
    if (config.referenceName.trim()) componentOptions.push(`name=${safeLatexLabel(config.referenceName) || 'cmp'}`)
    if (config.mirrorComponent) componentOptions.push('mirror')
    if (config.invertComponent) componentOptions.push('invert')

    return [
      `\\draw[${drawOptions.join(', ')}] (0,0) to[${componentOptions.join(',')}] (${formatNumber(
        end.x,
      )},${formatNumber(end.y)});`,
    ]
  }

  if (preset.id === 'shape-callout') {
    const calloutShape =
      config.shapeVariant === 'cloud'
        ? `cloud callout, cloud puffs=${config.cloudPuffs}`
        : 'rectangle callout'
    return [
      `\\node[${calloutShape}, callout relative pointer={(${formatNumber(config.calloutPointerX)},${formatNumber(
        config.calloutPointerY,
      )})}, draw=__COLOR__, __FILL_STYLE__, line width=0.6pt, minimum width=${width}cm, minimum height=${height}cm, align=${config.align}] (callout) at (0,0) {${label}};`,
    ]
  }

  const modularDiagram = buildModularDiagramSnippet(preset, config, { formatText: formatTikzNodeText })
  if (modularDiagram) return modularDiagram

  if ((preset.preview === 'matrix' || preset.id.includes('matrix')) && config.matrixEntries.trim()) {
    const entries = formatMatrixEntryRows(config.matrixEntries)
      .map((line) => `  ${line} \\\\`)
      .join('\n')
    return [
      `\\matrix[matrix of math nodes, draw=__COLOR__, line width=0.55pt, nodes={minimum width=${formatNumber(
        config.minWidth || 0.75,
      )}cm, minimum height=${formatNumber(config.minHeight || 0.42)}cm}] (m) at (0,0) {`,
      entries,
      '};',
    ]
  }

  if (preset.id === 'plot-bar') return buildBarChartSnippet(config, { formatText: formatTikzNodeText })

  if (preset.id.includes('gantt')) return buildGanttChartSnippet(config, { formatText: formatTikzNodeText })

  if ((preset.group === 'Telecom' || preset.id.startsWith('telecom-') || preset.id.startsWith('rf-')) && config.blockLabels.trim()) {
    const labels = splitNodeLabels(config.blockLabels, Math.max(1, config.branchCount))
    const lines = labels.map((entry, index) => {
      const name = `b${index}`
      const x = index * 1.35
      return `\\node[draw=__COLOR__, __FILL_STYLE__, rounded corners=2pt, minimum width=1.05cm, minimum height=.55cm] (${name}) at (${formatNumber(
        x,
      )},0) {${formatTikzNodeText(entry)}};`
    })
    labels.slice(1).forEach((_, index) => {
      lines.push(`\\draw[-{Stealth}, draw=__COLOR__, line width=0.55pt] (b${index}) -- node[above] {${formatTikzNodeText(config.signalLabel)}} (b${index + 1});`)
    })
    if (config.noiseLabel.trim()) lines.push(`\\node at (${formatNumber(Math.floor(labels.length / 2) * 1.35)},0.55) {${formatTikzNodeText(config.noiseLabel)}};`)
    if (config.gainDb) lines.push(`\\node at (0,-0.55) {${formatNumber(config.gainDb)} dB};`)
    return lines
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
  const configuredShapeOptions = {
    rounded: 'rectangle, rounded corners=2pt',
    rectangle: 'rectangle',
    circle: 'circle',
    ellipse: 'ellipse',
    diamond: `diamond, aspect=${formatNumber(config.shapeAspect)}, inner sep=1pt`,
    cloud: `cloud, cloud puffs=${config.cloudPuffs}`,
    cylinder: `cylinder, shape border rotate=90, aspect=${formatNumber(config.shapeAspect)}`,
    callout: `rectangle callout, callout relative pointer={(${formatNumber(config.calloutPointerX)},${formatNumber(
      config.calloutPointerY,
    )})}`,
    split: `rectangle split, rectangle split parts=${config.splitParts}`,
  }
  const shape = configuredShapeOptions[config.shapeVariant] ?? simpleNodeShapes[preset.id]
  if (!shape) return null

  const nodeName = preset.id === 'annotation-callout-arrow' ? 'note' : 'obj'
  const nodeContent = config.shapeVariant === 'split' ? rectangleSplitNodeContent(config) : label
  const lines = [
    `\\node[${shape}, draw=__COLOR__, __FILL_STYLE__, line width=0.6pt, minimum width=${width}cm, minimum height=${height}cm, inner sep=${formatNumber(config.innerSep)}pt] (${nodeName}) at (0,0) {${nodeContent}};`,
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
    const edgeLabel = connectorLabelTikz(config, index, formatTikzNodeText)
    if (index === 0) {
      const anchor =
        config.nodeDirection === 'left'
          ? `(0,${formatNumber((-metrics.baseHeight / 2) / scopeStretch.y)})`
          : config.nodeDirection === 'up'
            ? `(${formatNumber((metrics.baseWidth / 2) / scopeStretch.x)},0)`
            : config.nodeDirection === 'down'
              ? `(${formatNumber((metrics.baseWidth / 2) / scopeStretch.x)},${formatNumber(-metrics.baseHeight / scopeStretch.y)})`
              : `(${formatNumber(metrics.baseWidth / scopeStretch.x)},${formatNumber((-metrics.baseHeight / 2) / scopeStretch.y)})`
      lines.push(`\\draw[-{Stealth}, draw=${color}!65, line width=0.45pt] ${anchor} --${edgeLabel} (${prefix}${index});`)
      return
    }

    lines.push(`\\draw[-{Stealth}, draw=${color}!65, line width=0.45pt] (${prefix}${index - 1}) --${edgeLabel} (${prefix}${index});`)
  })

  return lines
}

const rectangleSplitPartNames = ['second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth']

function rectangleSplitNodeContent(config) {
  return splitNodeLabels(config.blockLabels || config.label, config.splitParts)
    .map((entry, index) => {
      const text = formatTikzNodeText(entry)
      if (index === 0) return text
      return `\\nodepart{${rectangleSplitPartNames[index - 1]}}${text}`
    })
    .join('')
}

function replaceLibraryTokens(line, element, color, fill) {
  const preset = getLibraryPreset(element)
  const config = getLibraryConfig(element, preset)
  const fillColor = fill === 'none' ? color : fill
  const componentLabels = splitList(config.componentLabels)
  const componentLabel = (index, fallback) => formatTikzNodeText(componentLabels[index] ?? fallback)
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
    .replaceAll('__INPUT_LABEL__', formatTikzNodeText(config.inputLabel))
    .replaceAll('__OUTPUT_LABEL__', formatTikzNodeText(config.outputLabel))
    .replaceAll('__FEEDBACK_LABEL__', formatTikzNodeText(config.feedbackLabel))
    .replaceAll('__SUPPLY_LABEL__', formatTikzNodeText(config.supplyLabel))
    .replaceAll('__GROUND_LABEL__', formatTikzNodeText(config.groundLabel))
    .replaceAll('__CHANNEL_LABEL__', formatTikzNodeText(config.channelLabel))
    .replaceAll('__NOISE_LABEL__', formatTikzNodeText(config.noiseLabel))
    .replaceAll('__SNR_LABEL__', formatTikzNodeText(config.snrLabel))
    .replaceAll('__CARRIER_LABEL__', formatTikzNodeText(config.carrierLabel))
    .replaceAll('__SIGNAL_LABEL__', formatTikzNodeText(config.signalLabel))
    .replaceAll('__MODULATION__', formatTikzNodeText(config.modulation))
    .replaceAll('__GAIN_DB__', formatNumber(config.gainDb))
    .replaceAll('__COMPONENT_1__', componentLabel(0, 'R_1'))
    .replaceAll('__COMPONENT_2__', componentLabel(1, 'R_2'))
    .replaceAll('__COMPONENT_3__', componentLabel(2, 'C_1'))
    .replaceAll('__COMPONENT_4__', componentLabel(3, 'R_4'))
    .replaceAll('__COMPONENT_5__', componentLabel(4, 'R_B'))
    .replaceAll('__COMPONENT_6__', componentLabel(5, 'C_o'))
    .replaceAll('__TITLE__', formatTikzNodeText(element.title))
    .replaceAll('__GROUP__', formatTikzNodeText(element.group ?? 'TikZ'))
}

function parseOptionalJson(value) {
  const trimmed = `${value ?? ''}`.trim()
  if (!trimmed) return null
  try {
    return JSON.parse(trimmed)
  } catch {
    return { raw: trimmed, parseError: true }
  }
}

function libraryObjectMetadata(element, preset = getLibraryPreset(element), config = getLibraryConfig(element, preset)) {
  const terminals = terminalPointsForElement(element).map((point, index) => ({
    name: splitNodeLabels(config.terminalNames, Math.max(index + 1, 1))[index] ?? `${index + 1}`,
    x: Number(formatNumber(point.x)),
    y: Number(formatNumber(point.y)),
  }))

  return {
    id: element.id,
    title: element.title,
    presetId: preset.id,
    group: preset.group,
    role: config.paperRole || undefined,
    datasetTag: config.datasetTag || undefined,
    referenceName: config.referenceName || undefined,
    netName: config.netName || undefined,
    spiceModel: config.spiceModel || undefined,
    value: config.circuitValue || undefined,
    label: config.autoLabel ? config.circuitLabel : config.label,
    terminals,
    custom: parseOptionalJson(config.metadataJson),
  }
}

function libraryMetadataCommentLines(element, preset = getLibraryPreset(element), config = getLibraryConfig(element, preset)) {
  const metadata = libraryObjectMetadata(element, preset, config)
  const entries = [
    ['id', metadata.id],
    ['preset', metadata.presetId],
    ['role', metadata.role],
    ['tag', metadata.datasetTag],
    ['ref', metadata.referenceName],
    ['net', metadata.netName],
    ['spice', metadata.spiceModel],
  ].filter(([, value]) => value)

  if (!entries.length && !config.metadataJson.trim()) return []
  return [`% metadata: ${entries.map(([key, value]) => `${key}=${String(value).replace(/\s+/g, '_')}`).join(', ')}`]
}

function editableLibrarySnippetLines(element, preset = getLibraryPreset(element)) {
  const color = element.stroke ?? '#111111'
  const fill = element.fill ?? 'none'
  const configuredSnippet = buildConfiguredLibrarySnippet(preset, element)
  const rawBody = (configuredSnippet ?? preset.snippet ?? []).map((line) => replaceLibraryTokens(line, element, color, fill))
  return applyLibraryConfigToSnippet(rawBody, preset, element)
}

function buildLibraryTikz(element, ensureColor) {
  const preset = getLibraryPreset(element)
  const config = getLibraryConfig(element, preset)
  const color = ensureColor(element.stroke)
  const fill = ensureColor(element.fill)
  const configuredSnippet = buildConfiguredLibrarySnippet(preset, element)
  const rawBody = (configuredSnippet ?? preset.snippet).map((line) => replaceLibraryTokens(line, element, color, fill))
  const body = applySnippetLabelOverrides(applyLibraryConfigToSnippet(rawBody, preset, element), config.snippetLabelOverrides, {
    formatText: formatTikzNodeText,
  })
  const scopeStretch = configuredSnippet ? { x: 1, y: 1 } : { x: config.stretchX, y: config.stretchY }
  const extraNodes = buildExtraNodeTikz(element, color, fill, scopeStretch)
  const metadataComments = libraryMetadataCommentLines(element, preset, config)

  if (preset.standalone) {
    return [
      `% Standalone ${preset.group}: ${element.title}`,
      `% Preview origin in editor: (${formatNumber(element.origin.x)}, ${formatNumber(element.origin.y)})`,
      ...metadataComments,
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
  if (config.bipoleLength > 0) scopeOptions.push(`bipoles/length=${formatNumber(config.bipoleLength)}cm`)
  scopeOptions.push(...libraryCommonTikzOptions(config))
  if (fill !== 'none') {
    scopeOptions.push(
      `every node/.append style={fill=${fill}, fill opacity=${formatNumber(element.fillOpacity ?? 0.18)}, text opacity=1}`,
    )
  }
  if (element.tikzOptions?.trim()) scopeOptions.push(element.tikzOptions.trim())

  return [
    `  % ${preset.group}: ${element.title}`,
    ...metadataComments.map((line) => `  ${line}`),
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
      const config = getLibraryConfig(element, preset)
      const drivenRequirements = configDrivenRequirements(config)
      preset.packages?.forEach((item) => packages.add(item))
      preset.libraries?.forEach((item) => libraries.add(item))
      preset.pgfplotsLibraries?.forEach((item) => pgfplotsLibraries.add(item))
      preset.afterPreamble?.forEach((item) => afterPreamble.add(item))
      drivenRequirements.libraries.forEach((item) => libraries.add(item))
      drivenRequirements.pgfplotsLibraries.forEach((item) => pgfplotsLibraries.add(item))
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
  const figureCaption = formatTikzNodeText(`${exportOptions.caption ?? ''}`.trim())
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
    if (element.type === 'function') {
      functionSeriesFor(element).forEach((series) => ensureColor(series.color))
    }
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
      const displaySeries = functionDisplaySeries(element)
      const hasFunctionLegend = displaySeries.some(({ series }) => series.legend)
      const graphLayout = functionPreviewLayout(element)
      const graphBounds = graphLayout.frameBounds
      const graphDataBounds = graphLayout.dataBounds
      const previewPoint = (point) => mapFunctionPointForPreview(point, graphLayout)
      const features = functionFeaturePoints(element)
      const primaryColor = ensureColor(element.stroke)
      const axisSettings = functionPgfplotsAxisSettings(functionOptions)
      const featureMarks = [
        ...(functionOptions.showXIntercepts ? features.xIntercepts.slice(0, 8).map((point) => ({ ...point, label: '$x_0$' })) : []),
        ...(functionOptions.showYIntercept && features.yIntercept ? [{ ...features.yIntercept, label: '$y_0$' }] : []),
        ...(functionOptions.showExtrema ? features.extrema.slice(0, 8).map((point) => ({ ...point, label: 'ext' })) : []),
        ...(functionOptions.showSamples ? features.samples.map((point) => ({ ...point, label: '' })) : []),
        ...features.marked.map((point) => ({ ...point, label: point.label || '' })),
      ]
      const directDrawOptions = (series, extras = []) =>
        [
          `draw=${ensureColor(series.color)}`,
          `line width=${formatNumber(series.width)}pt`,
          functionLineStyleTikz(series.lineStyle),
          element.smooth === false ? '' : 'smooth',
          ...extras,
          series.plotOptions?.trim(),
        ].filter(Boolean)
      if (functionOptions.usePgfplots) {
        const axisOptions = [
          `width=${functionOptions.axisWidth || '7cm'}`,
          `height=${functionOptions.axisHeight || '4.5cm'}`,
          functionOptions.axisLines ? `axis lines=${functionOptions.axisLines}` : '',
          axisSettings.xMode === 'log' ? 'xmode=log' : '',
          axisSettings.yMode === 'log' ? 'ymode=log' : '',
          `xlabel={${formatTikzNodeText(functionOptions.xLabel)}}`,
          `ylabel={${formatTikzNodeText(functionOptions.yLabel)}}`,
          functionOptions.plotTitle?.trim() ? `title={${formatTikzNodeText(functionOptions.plotTitle)}}` : '',
          functionOptions.showGraphGrid && functionOptions.gridStyle !== 'none' ? `grid=${functionOptions.gridStyle}` : '',
          functionOptions.xTicks?.trim() ? `xtick={${functionOptions.xTicks.trim()}}` : '',
          functionOptions.yTicks?.trim() ? `ytick={${functionOptions.yTicks.trim()}}` : '',
          hasFunctionLegend ? `legend pos=${functionOptions.legendPos || 'north east'}` : '',
          ...advancedPgfplotsAxisOptions({
            ...functionOptions,
            legendColumns: hasFunctionLegend ? functionOptions.legendColumns : 1,
          }),
          functionOptions.colormap?.trim() ? `colormap/${functionOptions.colormap.trim()}` : '',
          functionOptions.clip ? 'clip=true' : 'clip=false',
          functionOptions.axisOptions?.trim() ?? '',
        ].filter(Boolean)
        pictureLines.push(`${linePrefix}\\begin{${axisSettings.environment}}[${axisOptions.join(', ')}]`)
        const makeAddplotOptions = (series) =>
          [
            `draw=${ensureColor(series.color)}`,
            functionLineStyleTikz(series.lineStyle),
            (series.markerStyle || 'none') === 'none' ? 'no markers' : `mark=${series.markerStyle}`,
            functionOptions.errorBars ? functionOptions.errorBarOptions || '/pgfplots/error bars/y dir=both, /pgfplots/error bars/y explicit' : '',
            functionOptions.plotOptions,
            `line width=${formatNumber(series.width)}pt`,
            series.plotOptions,
          ].filter(Boolean)
        displaySeries.forEach(({ series, points }) => {
          const dataPoints = parseFunctionDataTable(series.dataTable)
          if (dataPoints.length) {
            const tablePoints = points.filter(Boolean)
            const tableRows = functionDataTableRows(tablePoints)
            const addplotOptions = makeAddplotOptions(series)
            if (functionOptions.errorBars && functionDataTableUsesYError(tablePoints)) addplotOptions.push('y error=yerr')
            const legend = series.legend ? `\n${linePrefix}  \\addlegendentry{${formatTikzNodeText(series.legend)}}` : ''
            pictureLines.push(`${linePrefix}  \\addplot[${addplotOptions.join(', ')}] table[row sep=\\\\] {`)
            tableRows.forEach((row) => pictureLines.push(`${linePrefix}    ${row}\\\\`))
            pictureLines.push(`${linePrefix}  };${legend}`)
            return
          }

          const segments = splitDrawableSegments(points.map((point) => (point ? { x: point.x, y: point.y } : null)))
          segments.forEach((segment, index) => {
            const coords = segment.map((point) => `(${formatNumber(point.x)},${formatNumber(point.y)})`).join(' ')
            const legend = series.legend && index === 0 ? `\n${linePrefix}  \\addlegendentry{${formatTikzNodeText(series.legend)}}` : ''
            pictureLines.push(`${linePrefix}  \\addplot[${makeAddplotOptions(series).join(', ')}] coordinates { ${coords} };${legend}`)
          })
        })
        featureMarks.forEach((point) => {
          pictureLines.push(
            `${linePrefix}  \\addplot[only marks, mark=*, draw=${primaryColor}, fill=white, line width=0.45pt] coordinates { (${formatNumber(point.x)},${formatNumber(point.y)}) };`,
          )
          if (point.label) {
            pictureLines.push(`${linePrefix}  \\node[above right, font=\\scriptsize] at (axis cs:${formatNumber(point.x)},${formatNumber(point.y)}) {${formatTikzNodeText(point.label)}};`)
          }
        })
        if (functionOptions.showTangent && features.tangent) {
          pictureLines.push(
            `${linePrefix}  \\addplot[dashed, draw=${primaryColor}!65, line width=0.4pt] coordinates { (${formatNumber(features.tangent.start.x)},${formatNumber(features.tangent.start.y)}) (${formatNumber(features.tangent.end.x)},${formatNumber(features.tangent.end.y)}) };`,
          )
        }
        if (functionOptions.showAsymptotes) {
          features.asymptotes.slice(0, 6).forEach((point) => {
            pictureLines.push(`${linePrefix}  \\draw[densely dashed, color=gray!55] (axis cs:${formatNumber(point.x)},${formatNumber(worldBounds.minY)}) -- (axis cs:${formatNumber(point.x)},${formatNumber(worldBounds.maxY)});`)
          })
        }
        pictureLines.push(`${linePrefix}\\end{${axisSettings.environment}}`)
      } else {
        if (functionOptions.showGraphFrame) {
          pictureLines.push(
            `${linePrefix}\\draw[color=gray!45, line width=0.35pt] (${formatNumber(graphBounds.minX)},${formatNumber(graphBounds.minY)}) rectangle (${formatNumber(graphBounds.maxX)},${formatNumber(graphBounds.maxY)});`,
          )
        }
        if (functionOptions.showGraphGrid) {
          graphTicks(graphDataBounds.minX, graphDataBounds.maxX, 7).forEach((xValue) => {
            const start = previewPoint({ x: xValue, y: graphDataBounds.minY })
            const end = previewPoint({ x: xValue, y: graphDataBounds.maxY })
            pictureLines.push(
              `${linePrefix}\\draw[color=gray!18, line width=0.18pt] (${formatNumber(start.x)},${formatNumber(start.y)}) -- (${formatNumber(end.x)},${formatNumber(end.y)});`,
            )
          })
          graphTicks(graphDataBounds.minY, graphDataBounds.maxY, 5).forEach((yValue) => {
            const start = previewPoint({ x: graphDataBounds.minX, y: yValue })
            const end = previewPoint({ x: graphDataBounds.maxX, y: yValue })
            pictureLines.push(
              `${linePrefix}\\draw[color=gray!18, line width=0.18pt] (${formatNumber(start.x)},${formatNumber(start.y)}) -- (${formatNumber(end.x)},${formatNumber(end.y)});`,
            )
          })
        }
        if (functionOptions.showGraphAxes) {
          if (graphDataBounds.minY <= 0 && graphDataBounds.maxY >= 0) {
            const start = previewPoint({ x: graphDataBounds.minX, y: 0 })
            const end = previewPoint({ x: graphDataBounds.maxX, y: 0 })
            pictureLines.push(
              `${linePrefix}\\draw[color=gray!60, line width=0.3pt] (${formatNumber(start.x)},${formatNumber(start.y)}) -- (${formatNumber(end.x)},${formatNumber(end.y)}) node[right, font=\\scriptsize] {${formatTikzNodeText(functionOptions.xLabel)}};`,
            )
          }
          if (graphDataBounds.minX <= 0 && graphDataBounds.maxX >= 0) {
            const start = previewPoint({ x: 0, y: graphDataBounds.minY })
            const end = previewPoint({ x: 0, y: graphDataBounds.maxY })
            pictureLines.push(
              `${linePrefix}\\draw[color=gray!60, line width=0.3pt] (${formatNumber(start.x)},${formatNumber(start.y)}) -- (${formatNumber(end.x)},${formatNumber(end.y)}) node[above, font=\\scriptsize] {${formatTikzNodeText(functionOptions.yLabel)}};`,
            )
          }
        }
        displaySeries.forEach(({ series, points }, seriesIndex) => {
          const segments = splitDrawableSegments(points.map((point) => (point ? { x: point.x, y: point.y } : null)))
          segments.forEach((segment, index) => {
            const coords = segment.map(previewPoint).map((point) => `(${formatNumber(point.x)},${formatNumber(point.y)})`).join(' ')
            const comment = seriesIndex === 0 && index === 0 ? ` % f(x) = ${element.expression}` : ''
            pictureLines.push(`${linePrefix}\\draw[${directDrawOptions(series).join(', ')}] plot coordinates { ${coords} };${comment}`)
          })
        })
        const markPoint = (point, label) => {
          const mapped = previewPoint(point)
          return `${linePrefix}\\filldraw[fill=white, draw=${primaryColor}, line width=0.45pt] (${formatNumber(mapped.x)},${formatNumber(
            mapped.y,
          )}) circle (1.7pt)${label ? ` node[above right, font=\\scriptsize] {${formatTikzNodeText(label)}}` : ''};`
        }
        featureMarks.forEach((point) => pictureLines.push(markPoint(point, point.label)))
        if (functionOptions.showTangent && features.tangent) {
          const start = previewPoint(features.tangent.start)
          const end = previewPoint(features.tangent.end)
          pictureLines.push(
            `${linePrefix}\\draw[dashed, draw=${primaryColor}!65, line width=0.4pt] (${formatNumber(start.x)},${formatNumber(start.y)}) -- (${formatNumber(end.x)},${formatNumber(end.y)});`,
          )
        }
        if (functionOptions.showAsymptotes) {
          features.asymptotes.slice(0, 6).forEach((point) => {
            const start = previewPoint({ x: point.x, y: graphDataBounds.minY })
            const end = previewPoint({ x: point.x, y: graphDataBounds.maxY })
            pictureLines.push(`${linePrefix}\\draw[densely dashed, color=gray!55] (${formatNumber(start.x)},${formatNumber(start.y)}) -- (${formatNumber(end.x)},${formatNumber(end.y)});`)
          })
        }
        const legends = displaySeries.map(({ series }) => series.legend).filter(Boolean)
        if (legends.length) {
          const bounds = elementBounds(element)
          legends.forEach((legend, legendIndex) => {
            pictureLines.push(
              `${linePrefix}\\node[anchor=west, font=\\scriptsize] at (${formatNumber(bounds.maxX + 0.2)},${formatNumber(bounds.maxY - legendIndex * 0.35)}) {${formatTikzNodeText(legend)}};`,
            )
          })
        }
      }
    }

    if (element.type === 'text') {
      const color = ensureColor(element.stroke)
      const metrics = labelMetricsForElement(element)
      const fontSizePt = Math.max(4, metrics.fontSize * 0.75)
      const nodeOptions = [`text=${color}`]
      nodeOptions.push(
        `minimum width=${formatNumber(metrics.widthCm)}cm`,
        `minimum height=${formatNumber(metrics.heightCm)}cm`,
        'align=center',
        `font=\\fontsize{${formatNumber(fontSizePt)}pt}{${formatNumber(fontSizePt * 1.16)}pt}\\selectfont`,
      )
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
  const [initialZoom] = useState(() =>
    initialCanvasZoom(initialSharedBoard?.viewport?.zoom, typeof window === 'undefined' ? undefined : window.innerWidth),
  )
  const initialElements = initialSharedBoard?.elements ?? seedElements
  const initialSelectedId = initialElements[0]?.id ?? null
  const svgRef = useRef(null)
  const importInputRef = useRef(null)
  const keyboardActionsRef = useRef({})
  const [tool, setTool] = useState('select')
  const [zoom, setZoom] = useState(initialZoom)
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
    color: '#1f4e79',
    lineStyle: 'solid',
  })
  const [functionError, setFunctionError] = useState('')
  const [librarySearch, setLibrarySearch] = useState('')
  const [libraryGroup, setLibraryGroup] = useState('All')
  const [diagramSearch, setDiagramSearch] = useState('')
  const [diagramGroup, setDiagramGroup] = useState('All')
  const [symbolSearch, setSymbolSearch] = useState('')
  const [symbolsOpen, setSymbolsOpen] = useState(false)
  const [, setKatexReady] = useState(Boolean(katexRenderer))
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
    let mounted = true
    loadKatexRenderer().then(() => {
      if (mounted) setKatexReady(true)
    })
    return () => {
      mounted = false
    }
  }, [])

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
  const selectedFunctionOptions = selectedElement?.type === 'function' ? functionOptionsFor(selectedElement) : defaultFunctionOptions
  const selectedFunctionSeries = selectedElement?.type === 'function' ? editableFunctionSeriesFor(selectedElement) : []
  const selectedLibraryConfig = selectedElement?.type === 'library' ? getLibraryConfig(selectedElement) : null
  const selectedLibraryPreset = selectedElement?.type === 'library' ? getLibraryPreset(selectedElement) : null
  const selectedSnippetLabelOverrides = selectedLibraryConfig?.snippetLabelOverrides ?? {}
  const selectedSnippetLabels =
    selectedElement?.type === 'library' && selectedLibraryPreset
      ? editableSnippetLabelsForLines(editableLibrarySnippetLines(selectedElement, selectedLibraryPreset)).map((label) => ({
          ...label,
          value: Object.hasOwn(selectedSnippetLabelOverrides, label.key) ? selectedSnippetLabelOverrides[label.key] : label.value,
        }))
      : []
  const selectedDiagramConfig = selectedElement?.type === 'diagram' ? diagramConfigForElement(selectedElement) : null
  const selectedDiagramConfigFields =
    selectedElement?.type === 'diagram' ? (diagramConfigFieldSpecs[selectedElement.diagramKind] ?? []) : []
  const selectedDiagramConfigTitle =
    selectedElement?.type === 'diagram'
      ? {
          circuit: 'Labels circuito',
          gantt: 'Barras Gantt',
          ml: 'Labels pipeline',
          dl: 'Labels capas',
        }[selectedElement.diagramKind] ?? 'Labels diagrama'
      : ''
  const selectedLibraryProfile = selectedLibraryPreset ? libraryObjectProfileForPreset(selectedLibraryPreset) : null
  const selectedLibraryProfileKeys = selectedLibraryPreset ? libraryProfileFieldKeysForPreset(selectedLibraryPreset) : new Set()
  const selectedLibraryConfigSections = selectedLibraryPreset ? libraryConfigSectionsForPreset(selectedLibraryPreset) : []
  const selectedCircuitQuickComponent =
    selectedLibraryPreset && selectedLibraryConfig ? circuitTikzComponent(selectedLibraryPreset, selectedLibraryConfig) : ''
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
  const paperComposer = useMemo(() => resolvePaperComposer(settings), [settings])
  const paperGuide = useMemo(() => buildPaperGuide(paperComposer), [paperComposer])
  const paperChecklist = useMemo(
    () => buildPaperChecklist({ settings, elements, tikzWarnings }),
    [elements, settings, tikzWarnings],
  )
  const paperWrapperPreview = useMemo(() => buildPaperWrapperPreview(settings), [settings])
  const figureWrapperControls = useMemo(() => figureWrapperControlsState(settings), [settings])
  const inferredNets = useMemo(() => inferCircuitNets(elements.filter((element) => !element.hidden)), [elements])
  const reusableDiagramItems = useMemo(() => diagramPaletteItems(libraryPaletteItems), [])
  const reusableObjectItems = useMemo(() => objectPaletteItems(libraryPaletteItems), [])
  const diagramGroups = useMemo(() => paletteGroupsFor(reusableDiagramItems), [reusableDiagramItems])
  const visibleDiagramItems = useMemo(() => {
    return filterPaletteItems(reusableDiagramItems, { group: diagramGroup, search: diagramSearch })
  }, [diagramGroup, diagramSearch, reusableDiagramItems])
  const paletteGroups = useMemo(() => paletteGroupsFor(reusableObjectItems), [reusableObjectItems])
  const visiblePaletteItems = useMemo(() => {
    return filterPaletteItems(reusableObjectItems, { group: libraryGroup, search: librarySearch })
  }, [libraryGroup, librarySearch, reusableObjectItems])
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
    setZoom(clampCanvasZoom(nextZoom))
  }

  const applyPaperTarget = (targetId) => {
    const target = paperTargets.find((item) => item.id === targetId) ?? paperTargets[0]
    const fixedTarget = target.id !== 'content'
    setSettings((state) => ({
      ...state,
      paperTarget: target.id,
      paperSize: target.id,
      paperWidthCm: fixedTarget ? target.widthCm : '',
      paperHeightCm: fixedTarget ? target.heightCm : '',
      paperMarginCm: target.marginCm,
      journalStyle: target.journalStyle ?? state.journalStyle,
      exportPreset: target.exportPreset ?? state.exportPreset,
    }))
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
        minY: Math.min(originalBounds.maxY - 0.1, point.y),
        maxX: Math.max(originalBounds.minX + 0.1, point.x),
        maxY: originalBounds.maxY,
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

  const updateSelectedSnippetLabel = (key, value) => {
    if (selectedElement?.type !== 'library') return
    const config = getLibraryConfig(selectedElement)
    updateSelectedLibraryConfig({
      snippetLabelOverrides: {
        ...(config.snippetLabelOverrides ?? {}),
        [key]: value,
      },
    })
  }

  const updateSelectedDiagramConfig = (patch) => {
    if (selectedElement?.type !== 'diagram') return
    updateSelected({ diagramConfig: { ...diagramConfigForElement(selectedElement), ...patch } })
  }

  const libraryProfileIncludes = (key) => selectedLibraryProfileKeys.has(key)
  const showExtraNodeConfig = ['extraNodes', 'nodeSpacing', 'nodeDirection', 'nodeShape', 'nodeLabels', 'connectNodes'].some(
    libraryProfileIncludes,
  )
  const visibleQuickLibraryConfigKeys = new Set()
  if (selectedCircuitQuickComponent) quickCircuitConfigKeys.forEach((key) => visibleQuickLibraryConfigKeys.add(key))
  if (showExtraNodeConfig) quickExtraNodeConfigKeys.forEach((key) => visibleQuickLibraryConfigKeys.add(key))
  if (selectedLibraryPreset?.id.includes('callout')) quickCalloutConfigKeys.forEach((key) => visibleQuickLibraryConfigKeys.add(key))

  const updateSelectedFunctionOptions = (patch) => {
    if (selectedElement?.type !== 'function') return
    updateSelected({ functionOptions: { ...functionOptionsFor(selectedElement), ...patch } })
  }

  const addFunctionSeries = () => {
    if (selectedElement?.type !== 'function') return
    const series = editableFunctionSeriesFor(selectedElement)
    const index = series.length
    updateSelectedFunctionOptions({
      series: [
        ...series,
        normalizeFunctionSeries(
          {
            id: createId(),
            expression: functionQuickExpressions[(index + 1) % functionQuickExpressions.length],
            color: strokeColors[(index + 3) % strokeColors.length].value,
            lineStyle: index % 2 === 0 ? 'dashed' : 'dotted',
            legend: `serie ${index + 2}`,
            enabled: true,
          },
          index,
        ),
      ],
    })
  }

  const updateFunctionSeries = (index, patch) => {
    if (selectedElement?.type !== 'function') return
    const series = editableFunctionSeriesFor(selectedElement)
    series[index] = { ...series[index], ...patch }
    updateSelectedFunctionOptions({ series })
  }

  const removeFunctionSeries = (index) => {
    if (selectedElement?.type !== 'function') return
    updateSelectedFunctionOptions({
      series: editableFunctionSeriesFor(selectedElement).filter((_, itemIndex) => itemIndex !== index),
    })
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
        xOffset: 0,
        yOffset: 0,
        stroke: functionDraft.color || settings.stroke,
        smooth: true,
        functionOptions: { ...defaultFunctionOptions, lineStyle: functionDraft.lineStyle },
      }
      setFunctionError('')
      commitElements([...elements, nextElement], nextElement.id)
      setTool('select')
    } catch (error) {
      setFunctionError(error.message)
    }
  }

  const addFunctionToSelectedGraph = () => {
    if (selectedElement?.type !== 'function') return
    try {
      compileExpression(functionDraft.expression)
      const series = editableFunctionSeriesFor(selectedElement)
      updateSelectedFunctionOptions({
        series: [
          ...series,
          normalizeFunctionSeries(
            {
              id: createId(),
              expression: functionDraft.expression,
              color: functionDraft.color || strokeColors[(series.length + 3) % strokeColors.length].value,
              lineStyle: functionDraft.lineStyle || 'solid',
              legend: functionDraft.expression,
              enabled: true,
            },
            series.length,
          ),
        ],
      })
      setFunctionError('')
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
    const copied = await writeClipboardText(tikzCode)
    setCopyLabel(copied ? 'Copiado' : 'No se pudo copiar')
    window.setTimeout(() => setCopyLabel('Copy .TeX code'), 1200)
  }

  const downloadTikz = () => {
    downloadBlob(new Blob([tikzCode], { type: 'text/plain;charset=utf-8' }), 'sketch-tikz.tex')
  }

  const copySelection = async () => {
    if (!selectedElements.length) return
    setClipboardElements(selectedElements)
    await writeClipboardText(JSON.stringify({ version: 1, elements: selectedElements }, null, 2))
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
    metadata: {
      generator: 'TikZ Sketch Converter',
      author: 'Guillem Moreno Garcia',
      objects: elements
        .filter((element) => element.type === 'library')
        .map((element) => libraryObjectMetadata(element)),
      netlist: buildNetlistMetadata(elements),
    },
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
      '- `metadata.json` contains object roles, tags, terminals, inferred nets, and SPICE-like component lines.',
      '',
      'Made by Guillem Moreno Garcia.',
    ].join('\n')
    const zip = createZipBlob([
      { name: 'main.tex', content: mainTex },
      { name: 'board.json', content: JSON.stringify(payload, null, 2) },
      { name: 'metadata.json', content: JSON.stringify(payload.metadata, null, 2) },
      { name: 'README.md', content: readme },
    ])
    downloadBlob(zip, 'tikz-sketch-overleaf.zip')
  }

  const copyShareUrl = async () => {
    const payload = currentBoardPayload()
    const encoded = encodeBoardPayload(payload)
    const nextUrl = `${window.location.origin}${window.location.pathname}${window.location.search}#board=${encoded}`
    const copied = await writeClipboardText(nextUrl)
    window.history.replaceState(null, '', nextUrl)
    setShareLabel(copied ? 'URL copiada' : 'URL generada')
    window.setTimeout(() => setShareLabel('Copiar URL'), 1400)
  }

  const importBoardState = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const payload = JSON.parse(await file.text())
      const rawElements = Array.isArray(payload) ? payload : payload.elements
      if (!Array.isArray(rawElements)) throw new Error('Missing elements array')
      if (!rawElements.every((element) => element && typeof element === 'object' && typeof element.type === 'string')) {
        throw new Error('Invalid element payload')
      }
      const nextElements = rawElements.map(normalizeBoardElement).filter(Boolean)
      if (!nextElements.length) throw new Error('No valid elements found')

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
    const svgText = rasterSafeSvgText(serializeCanvasSvg())
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

      const pngBlob = await new Promise((resolve, reject) => {
        try {
          canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('No se pudo generar el PNG.'))), 'image/png', 1)
        } catch (error) {
          reject(error)
        }
      })
      if (pngBlob) downloadBlob(pngBlob, 'tikz-sketch-board.png')
    } catch (error) {
      console.error('No pude exportar el PNG.', error)
      window.alert('No pude exportar el PNG. Prueba el SVG si el navegador bloquea el rasterizado.')
    } finally {
      URL.revokeObjectURL(url)
    }
  }

  // Refresh shortcut actions after every render while keeping one stable window listener.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    keyboardActionsRef.current = {
      undo,
      redo,
      copySelection,
      pasteSelection,
      duplicateSelection,
      downloadTikz,
      deleteSelected,
      setTool,
      toggleSnap: () => setSettings((state) => ({ ...state, snap: !state.snap })),
      toggleTerminalSnap: () => setSettings((state) => ({ ...state, terminalSnap: !state.terminalSnap })),
      zoomIn: () => setCanvasZoom(zoom + 0.1),
      zoomOut: () => setCanvasZoom(zoom - 0.1),
      closeModal: () => {
        setSettingsOpen(false)
        setHelpOpen(false)
      },
    }
  })

  useEffect(() => {
    const handleKeyDown = createEditorKeydownHandler(keyboardActionsRef)

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

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
    const config = diagramConfigForElement(element)

    if (element.diagramKind === 'circuit') {
      const labels = circuitLabelsForConfig(config)
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
            {diagramSvgLabelText(labels.resistorLabel)}
          </text>
          <text {...smallLabelProps} x={point({ x: 5.25, y: -1.05 }).x} y={point({ x: 5.25, y: -1.05 }).y}>
            {diagramSvgLabelText(labels.capacitorLabel)}
          </text>
          <text {...smallLabelProps} x={point({ x: -0.55, y: -1.2 }).x} y={point({ x: -0.55, y: -1.2 }).y}>
            {diagramSvgLabelText(labels.sourceLabel)}
          </text>
          <text {...smallLabelProps} x={point({ x: 5.25, y: 0.15 }).x} y={point({ x: 5.25, y: 0.15 }).y} textAnchor="start">
            {diagramSvgLabelText(labels.outputLabel)}
          </text>
        </g>
      )
    }

    if (element.diagramKind === 'gantt') {
      const tasks = ganttTasksForConfig(config)
      const metrics = ganttMetricsForTasks(tasks)
      const header = point({ x: metrics.minStart + metrics.width / 2, y: 0.5 })
      const tickStart = Math.floor(metrics.minStart)
      const tickEnd = Math.ceil(metrics.maxEnd)
      const tickStep = Math.max(1, Math.ceil((tickEnd - tickStart) / 10))
      return (
        <g>
          <text {...labelProps} x={header.x} y={header.y}>
            {element.title}
          </text>
          <rect
            x={point({ x: metrics.minStart, y: 0 }).x}
            y={point({ x: metrics.minStart, y: 0 }).y}
            width={metrics.width * diagramScale}
            height={metrics.height * diagramScale}
            fill={shapeFill}
            fillOpacity={shapeFillOpacity}
            stroke={element.stroke}
            strokeOpacity="0.45"
            strokeWidth="1.1"
            vectorEffect="non-scaling-stroke"
          />
          {Array.from({ length: Math.floor((tickEnd - tickStart) / tickStep) + 1 }, (_, index) => tickStart + index * tickStep).map((tick) => {
            const start = point({ x: tick, y: 0 })
            const end = point({ x: tick, y: -metrics.height })
            return <line key={`tick-${tick}`} x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke={element.stroke} strokeOpacity="0.16" />
          })}
          {tasks.map((task, index) => {
            const y = -0.45 - task.row * 0.58
            const labelPoint = point({ x: metrics.minStart - 0.25, y })
            const barStart = point({ x: task.start, y: y + 0.18 })
            return (
              <g key={`${task.label}-${index}`}>
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
      const steps = mlStepsForConfig(config)
      const titleX = ((steps.length - 1) * 1.55) / 2
      return (
        <g>
          <defs>
            <marker id={markerId} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 8 4 L 0 8 z" fill={element.stroke} />
            </marker>
          </defs>
          <text {...labelProps} x={point({ x: titleX, y: 0.72 }).x} y={point({ x: titleX, y: 0.72 }).y}>
            {element.title}
          </text>
          {steps.map((step, index) => {
            const center = point({ x: index * 1.55, y: 0 })
            const nextCenter = point({ x: (index + 1) * 1.55, y: 0 })
            return (
              <g key={`${step}-${index}`}>
                {index < steps.length - 1 && (
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
      const layers = dlLayersForConfig(config)
      const maxNodeY = Math.max(...layers.map((layer) => (layer.count - 1) * 0.36), 1.3)
      const titleX = ((layers.length - 1) * 1.65) / 2
      const titleY = maxNodeY + 0.65
      const labelY = -maxNodeY - 0.55
      const nodes = layers.flatMap((layer, layerIndex) =>
        Array.from({ length: layer.count }, (_, nodeIndex) => ({
          id: `${layerIndex}-${nodeIndex}`,
          layerIndex,
          nodeIndex,
          count: layer.count,
          point: point({ x: layerIndex * 1.65, y: (layer.count - 1) * 0.36 - nodeIndex * 0.72 }),
        })),
      )
      return (
        <g>
          <text {...labelProps} x={point({ x: titleX, y: titleY }).x} y={point({ x: titleX, y: titleY }).y}>
            {element.title}
          </text>
          {layers.slice(0, -1).flatMap((layer, layerIndex) =>
            Array.from({ length: layer.count }, (_, left) =>
              Array.from({ length: layers[layerIndex + 1].count }, (_, right) => {
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
          {layers.map((layer, index) => {
            const labelPoint = point({ x: index * 1.65, y: labelY })
            return (
              <text key={`${layer.label}-${index}`} {...smallLabelProps} x={labelPoint.x} y={labelPoint.y}>
                {diagramSvgLabelText(layer.label)}
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
    const isSelectedObject = selectedIds.includes(element.id)

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
    const previewKey = (...parts) =>
      parts
        .map((part) => `${part ?? ''}`.replace(/[^A-Za-z0-9._-]+/g, '-'))
        .join('-')
    const terminalLabel = (x, y, text) => (
      <text x={sx(x)} y={sy(y)} {...labelStyle}>
        {text}
      </text>
    )
    const miniText = (x, y, text, props = {}) => {
      const { key, ...textProps } = props
      return (
        <text key={key ?? previewKey('text', x, y, text)} x={sx(x)} y={sy(y)} {...labelStyle} {...textProps}>
          {text}
        </text>
      )
    }
    const rectNode = (x, y, w, h, text, props = {}) => (
      <g key={props.key ?? previewKey('rect', x, y, w, h, text)}>
        <rect {...filledShapeCommon} x={sx(x)} y={sy(y)} width={baseWidth * w} height={baseHeight * h} rx={props.rx ?? 3} />
        {text && miniText(x + w / 2, y + h / 2 + 0.035, text, { fontSize: props.fontSize ?? 10 })}
      </g>
    )
    const diamondNode = (cx, cy, w, h, text, props = {}) => (
      <g key={props.key ?? previewKey('diamond', cx, cy, w, h, text)}>
        <path {...filledShapeCommon} d={`M ${sx(cx)} ${sy(cy - h / 2)} L ${sx(cx + w / 2)} ${sy(cy)} L ${sx(cx)} ${sy(cy + h / 2)} L ${sx(cx - w / 2)} ${sy(cy)} Z`} />
        {text && miniText(cx, cy + 0.035, text, { fontSize: 10 })}
      </g>
    )
    const circleNode = (cx, cy, r, text, props = {}) => (
      <g key={props.key ?? previewKey('circle', cx, cy, r, text)}>
        <circle {...filledShapeCommon} cx={sx(cx)} cy={sy(cy)} r={Math.max(5, Math.min(baseWidth, baseHeight) * r)} />
        {text && miniText(cx, cy + 0.035, text, { fontSize: props.fontSize ?? 10 })}
      </g>
    )
    const arrow = (x1, y1, x2, y2, key, props = {}) => {
      const start = { x: sx(x1), y: sy(y1) }
      const end = { x: sx(x2), y: sy(y2) }
      const angle = Math.atan2(end.y - start.y, end.x - start.x)
      const size = props.size ?? 6
      const left = {
        x: end.x - size * Math.cos(angle - 0.45),
        y: end.y - size * Math.sin(angle - 0.45),
      }
      const right = {
        x: end.x - size * Math.cos(angle + 0.45),
        y: end.y - size * Math.sin(angle + 0.45),
      }
      return (
        <g key={key}>
          <line {...shapeCommon} x1={start.x} y1={start.y} x2={end.x} y2={end.y} opacity={props.opacity ?? 1} />
          <path d={`M ${end.x} ${end.y} L ${left.x} ${left.y} L ${right.x} ${right.y}`} fill="none" stroke={previewStroke} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" opacity={props.opacity ?? 1} />
        </g>
      )
    }
    const axisFrame = () => (
      <g>
        <line {...shapeCommon} x1={sx(0.14)} y1={sy(0.78)} x2={sx(0.9)} y2={sy(0.78)} opacity="0.55" />
        <line {...shapeCommon} x1={sx(0.16)} y1={sy(0.18)} x2={sx(0.16)} y2={sy(0.82)} opacity="0.55" />
      </g>
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
    const renderPlotPreview = (kind) => {
      const poly = (points, props = {}) => <polyline {...shapeCommon} points={points.map(([x, y]) => `${sx(x)},${sy(y)}`).join(' ')} {...props} />
      const dot = (x, y, key, r = 3.5) => <circle key={key} cx={sx(x)} cy={sy(y)} r={r} fill={previewStroke} />

      if (kind.includes('error-bars')) {
        const pts = [
          [0.28, 0.58],
          [0.48, 0.46],
          [0.68, 0.36],
        ]
        return (
          <g>
            {axisFrame()}
            {poly(pts)}
            {pts.map(([x, y], index) => (
              <g key={index}>
                <line {...shapeCommon} x1={sx(x)} y1={sy(y - 0.12)} x2={sx(x)} y2={sy(y + 0.12)} />
                <line {...shapeCommon} x1={sx(x - 0.04)} y1={sy(y - 0.12)} x2={sx(x + 0.04)} y2={sy(y - 0.12)} />
                <line {...shapeCommon} x1={sx(x - 0.04)} y1={sy(y + 0.12)} x2={sx(x + 0.04)} y2={sy(y + 0.12)} />
                {dot(x, y, `dot-${index}`)}
              </g>
            ))}
          </g>
        )
      }

      if (kind.includes('scatter') || kind.includes('constellation')) {
        const pts = kind.includes('constellation')
          ? [
              [0.32, 0.35],
              [0.32, 0.65],
              [0.68, 0.35],
              [0.68, 0.65],
            ]
          : [
              [0.25, 0.65],
              [0.38, 0.48],
              [0.53, 0.55],
              [0.7, 0.3],
              [0.8, 0.42],
            ]
        return (
          <g>
            {axisFrame()}
            {pts.map(([x, y], index) => dot(x, y, index, 4))}
          </g>
        )
      }

      if (kind.includes('bar') || kind.includes('histogram')) {
        const bars = [0.45, 0.3, 0.58, 0.38, 0.65]
        return (
          <g>
            {axisFrame()}
            {bars.map((bar, index) => (
              <rect key={index} x={sx(0.25 + index * 0.12)} y={sy(0.78 - bar)} width={baseWidth * 0.075} height={baseHeight * bar} fill={previewFill} fillOpacity="0.65" stroke={previewStroke} />
            ))}
          </g>
        )
      }

      if (kind.includes('heatmap') || kind.includes('spectrogram')) {
        return (
          <g>
            {axisFrame()}
            {[0, 1, 2, 3].flatMap((row) =>
              [0, 1, 2, 3, 4].map((col) => (
                <rect
                  key={`${row}-${col}`}
                  x={sx(0.24 + col * 0.12)}
                  y={sy(0.3 + row * 0.11)}
                  width={baseWidth * 0.1}
                  height={baseHeight * 0.09}
                  fill={previewStroke}
                  opacity={0.15 + ((row + col) % 4) * 0.18}
                />
              )),
            )}
          </g>
        )
      }

      if (kind.includes('boxplot') || kind.includes('violin')) {
        return (
          <g>
            {axisFrame()}
            {kind.includes('violin') ? (
              <path {...filledShapeCommon} d={`M ${sx(0.5)} ${sy(0.24)} C ${sx(0.28)} ${sy(0.38)}, ${sx(0.35)} ${sy(0.62)}, ${sx(0.5)} ${sy(0.75)} C ${sx(0.65)} ${sy(0.62)}, ${sx(0.72)} ${sy(0.38)}, ${sx(0.5)} ${sy(0.24)} Z`} />
            ) : (
              <>
                <line {...shapeCommon} x1={sx(0.5)} y1={sy(0.24)} x2={sx(0.5)} y2={sy(0.72)} />
                <rect {...filledShapeCommon} x={sx(0.39)} y={sy(0.4)} width={baseWidth * 0.22} height={baseHeight * 0.2} />
                <line {...shapeCommon} x1={sx(0.36)} y1={sy(0.32)} x2={sx(0.64)} y2={sy(0.32)} />
                <line {...shapeCommon} x1={sx(0.36)} y1={sy(0.72)} x2={sx(0.64)} y2={sy(0.72)} />
              </>
            )}
          </g>
        )
      }

      if (kind.includes('polar')) {
        return (
          <g>
            <circle {...shapeCommon} cx={sx(0.5)} cy={sy(0.5)} r={Math.min(baseWidth, baseHeight) * 0.28} opacity="0.45" />
            <line {...shapeCommon} x1={sx(0.5)} y1={sy(0.5)} x2={sx(0.84)} y2={sy(0.5)} opacity="0.45" />
            <path {...shapeCommon} d={`M ${sx(0.5)} ${sy(0.5)} C ${sx(0.62)} ${sy(0.18)}, ${sx(0.86)} ${sy(0.32)}, ${sx(0.68)} ${sy(0.62)} C ${sx(0.5)} ${sy(0.86)}, ${sx(0.28)} ${sy(0.62)}, ${sx(0.5)} ${sy(0.5)}`} />
          </g>
        )
      }

      if (kind.includes('group') || kind.includes('small-multiples')) {
        return (
          <g>
            {[0.14, 0.54].map((left, index) => (
              <g key={index}>
                <rect {...shapeCommon} x={sx(left)} y={sy(0.28)} width={baseWidth * 0.32} height={baseHeight * 0.42} />
                {poly([
                  [left + 0.05, 0.62 - index * 0.16],
                  [left + 0.16, 0.42 + index * 0.12],
                  [left + 0.27, 0.5],
                ])}
              </g>
            ))}
          </g>
        )
      }

      if (kind.includes('roc')) {
        return (
          <g>
            {axisFrame()}
            <line {...shapeCommon} x1={sx(0.2)} y1={sy(0.75)} x2={sx(0.82)} y2={sy(0.24)} opacity="0.35" strokeDasharray="4 3" />
            {poly([
              [0.2, 0.75],
              [0.3, 0.45],
              [0.5, 0.32],
              [0.82, 0.22],
            ])}
          </g>
        )
      }

      if (kind.includes('confidence')) {
        return (
          <g>
            {axisFrame()}
            <path d={`M ${sx(0.24)} ${sy(0.62)} C ${sx(0.42)} ${sy(0.5)}, ${sx(0.62)} ${sy(0.38)}, ${sx(0.82)} ${sy(0.3)} L ${sx(0.82)} ${sy(0.48)} C ${sx(0.62)} ${sy(0.58)}, ${sx(0.42)} ${sy(0.68)}, ${sx(0.24)} ${sy(0.76)} Z`} fill={previewStroke} opacity="0.14" />
            {poly([
              [0.24, 0.68],
              [0.42, 0.58],
              [0.62, 0.48],
              [0.82, 0.38],
            ])}
          </g>
        )
      }

      if (kind.includes('contour')) {
        return (
          <g>
            {axisFrame()}
            {[0.16, 0.25, 0.34].map((offset, index) => (
              <ellipse key={index} {...shapeCommon} cx={sx(0.52)} cy={sy(0.5)} rx={baseWidth * (0.16 + index * 0.06)} ry={baseHeight * (0.08 + index * 0.045)} opacity={0.55 + index * 0.15} />
            ))}
          </g>
        )
      }

      if (kind.includes('surface')) {
        return (
          <g>
            <path {...filledShapeCommon} d={`M ${sx(0.22)} ${sy(0.66)} L ${sx(0.48)} ${sy(0.38)} L ${sx(0.82)} ${sy(0.54)} L ${sx(0.56)} ${sy(0.78)} Z`} />
            {[0, 1, 2].map((index) => (
              <line key={index} {...shapeCommon} x1={sx(0.26 + index * 0.18)} y1={sy(0.62 - index * 0.08)} x2={sx(0.56 + index * 0.12)} y2={sy(0.76 - index * 0.08)} opacity="0.4" />
            ))}
          </g>
        )
      }

      if (kind.includes('qq')) {
        return (
          <g>
            {axisFrame()}
            <line {...shapeCommon} x1={sx(0.24)} y1={sy(0.7)} x2={sx(0.82)} y2={sy(0.28)} opacity="0.4" />
            {[0.26, 0.38, 0.48, 0.63, 0.78].map((x, index) => dot(x, 0.72 - index * 0.1 + (index % 2) * 0.03, index, 3))}
          </g>
        )
      }

      if (kind.includes('ber') || kind.includes('training')) {
        return (
          <g>
            {axisFrame()}
            {poly(
              kind.includes('training')
                ? [
                    [0.22, 0.28],
                    [0.38, 0.42],
                    [0.56, 0.58],
                    [0.84, 0.72],
                  ]
                : [
                    [0.22, 0.26],
                    [0.38, 0.38],
                    [0.56, 0.56],
                    [0.84, 0.74],
                  ],
            )}
          </g>
        )
      }

      if (kind.includes('eye')) {
        return (
          <g>
            {axisFrame()}
            <path {...shapeCommon} d={`M ${sx(0.22)} ${sy(0.35)} C ${sx(0.42)} ${sy(0.72)}, ${sx(0.62)} ${sy(0.72)}, ${sx(0.82)} ${sy(0.35)}`} opacity="0.65" />
            <path {...shapeCommon} d={`M ${sx(0.22)} ${sy(0.65)} C ${sx(0.42)} ${sy(0.28)}, ${sx(0.62)} ${sy(0.28)}, ${sx(0.82)} ${sy(0.65)}`} opacity="0.65" />
            <path {...shapeCommon} d={`M ${sx(0.22)} ${sy(0.5)} C ${sx(0.42)} ${sy(0.24)}, ${sx(0.62)} ${sy(0.76)}, ${sx(0.82)} ${sy(0.5)}`} opacity="0.4" />
          </g>
        )
      }

      if (kind.includes('impulse')) {
        const pts = [0.28, 0.44, 0.6, 0.76]
        return (
          <g>
            {axisFrame()}
            {pts.map((x, index) => (
              <g key={index}>
                <line {...shapeCommon} x1={sx(x)} y1={sy(0.78)} x2={sx(x)} y2={sy(0.3 + index * 0.11)} />
                {dot(x, 0.3 + index * 0.11, index, 3)}
              </g>
            ))}
          </g>
        )
      }

      return (
        <g>
          {axisFrame()}
          {poly([
            [0.22, 0.62],
            [0.38, 0.42],
            [0.56, 0.36],
            [0.82, 0.58],
          ])}
        </g>
      )
    }
    const renderMatrixPreview = (kind) => {
      if (kind.includes('commutative-square') || kind.includes('tikz-cd') || kind.includes('math-comm-triangle')) {
        const points = kind.includes('triangle')
          ? [
              [0.5, 0.24],
              [0.24, 0.72],
              [0.76, 0.72],
            ]
          : [
              [0.26, 0.28],
              [0.74, 0.28],
              [0.26, 0.72],
              [0.74, 0.72],
            ]
        return (
          <g>
            {points.map(([x, y], index) => circleNode(x, y, 0.05, ['A', 'B', 'C', 'D'][index], { fontSize: 9 }))}
            {kind.includes('triangle') ? (
              <>
                {arrow(0.5, 0.28, 0.28, 0.68, 't1')}
                {arrow(0.5, 0.28, 0.72, 0.68, 't2')}
                {arrow(0.28, 0.72, 0.72, 0.72, 't3')}
              </>
            ) : (
              <>
                {arrow(0.3, 0.28, 0.7, 0.28, 's1')}
                {arrow(0.26, 0.32, 0.26, 0.68, 's2')}
                {arrow(0.74, 0.32, 0.74, 0.68, 's3')}
                {arrow(0.3, 0.72, 0.7, 0.72, 's4')}
              </>
            )}
          </g>
        )
      }

      if (kind.includes('link-budget')) {
        return (
          <g>
            {rectNode(0.18, 0.22, 0.64, 0.56, '', { rx: 0 })}
            {['Tx 20 dBm', 'Path -102', 'Rx -82'].map((text, index) => miniText(0.5, 0.34 + index * 0.14, text, { key: text, fontSize: 10 }))}
          </g>
        )
      }

      if (kind.includes('embedding')) {
        return (
          <g>
            {[0, 1, 2, 3].map((index) => (
              <rect key={index} x={sx(0.26 + index * 0.12)} y={sy(0.28 + index * 0.04)} width={baseWidth * 0.1} height={baseHeight * 0.44} fill={previewStroke} opacity={0.08 + index * 0.06} stroke={previewStroke} />
            ))}
            {miniText(0.5, 0.78, 'tokens', { fontSize: 8 })}
          </g>
        )
      }
      if (kind.includes('bits') || kind.includes('random-bits')) return rectNode(0.22, 0.38, 0.56, 0.22, kind.includes('random') ? '101101' : 'b_k')
      if (kind.includes('mimo-channel')) return rectNode(0.32, 0.28, 0.36, 0.44, 'H', { fontSize: 16 })
      if (kind.includes('sparameter')) return rectNode(0.3, 0.32, 0.4, 0.36, 'S', { fontSize: 16 })
      if (kind.includes('uml-class')) {
        return (
          <g>
            <rect {...filledShapeCommon} x={sx(0.23)} y={sy(0.22)} width={baseWidth * 0.54} height={baseHeight * 0.56} />
            {[0.36, 0.52].map((y) => <line key={y} {...shapeCommon} x1={sx(0.23)} y1={sy(y)} x2={sx(0.77)} y2={sy(y)} />)}
            {miniText(0.5, 0.31, 'Class')}
          </g>
        )
      }

      if (kind.includes('confusion')) {
        return (
          <g>
            {[0, 1].flatMap((row) =>
              [0, 1].map((col) => (
                <rect key={`${row}-${col}`} x={sx(0.3 + col * 0.2)} y={sy(0.32 + row * 0.18)} width={baseWidth * 0.18} height={baseHeight * 0.15} fill={previewStroke} opacity={row === col ? 0.28 : 0.08} stroke={previewStroke} />
              )),
            )}
          </g>
        )
      }

      return (
        <g>
          <text x={sx(0.25)} y={sy(0.72)} {...labelStyle} fontSize="20">
            [
          </text>
          <text x={sx(0.75)} y={sy(0.72)} {...labelStyle} fontSize="20">
            ]
          </text>
          {[0, 1].flatMap((row) => [0, 1].map((col) => miniText(0.42 + col * 0.16, 0.42 + row * 0.16, row === col ? '1' : '0', { key: `${row}-${col}` })))}
        </g>
      )
    }
    const renderNetworkPreview = (kind) => {
      if (kind.includes('automata')) {
        return (
          <g>
            {circleNode(0.25, 0.52, 0.08, 'q0', { fontSize: 8 })}
            {circleNode(0.68, 0.52, 0.08, 'q1', { fontSize: 8 })}
            {arrow(0.33, 0.52, 0.6, 0.52, 'auto')}
            <path {...shapeCommon} d={`M ${sx(0.68)} ${sy(0.44)} C ${sx(0.82)} ${sy(0.2)}, ${sx(0.52)} ${sy(0.2)}, ${sx(0.66)} ${sy(0.44)}`} />
          </g>
        )
      }

      if (kind.includes('tree')) {
        const nodes = [
          [0.5, 0.24],
          [0.3, 0.58],
          [0.5, 0.66],
          [0.7, 0.58],
        ]
        return (
          <g>
            {nodes.slice(1).map(([x, y], index) => <line key={index} {...shapeCommon} x1={sx(0.5)} y1={sy(0.28)} x2={sx(x)} y2={sy(y - 0.05)} opacity="0.45" />)}
            {nodes.map(([x, y], index) => circleNode(x, y, 0.045, index === 0 ? 'R' : '', { key: index, fontSize: 8 }))}
          </g>
        )
      }

      if (kind.includes('mindmap')) {
        return (
          <g>
            {circleNode(0.5, 0.5, 0.12, 'M', { fontSize: 10 })}
            {[0.28, 0.5, 0.72].map((y, index) => (
              <g key={index}>
                <line {...shapeCommon} x1={sx(0.5)} y1={sy(0.5)} x2={sx(0.72)} y2={sy(y)} opacity="0.45" />
                {circleNode(0.78, y, 0.055, '')}
              </g>
            ))}
          </g>
        )
      }

      if (kind.includes('data-flow')) {
        return (
          <g>
            {circleNode(0.22, 0.55, 0.06, 'x', { fontSize: 8 })}
            {circleNode(0.48, 0.42, 0.06, 'z', { fontSize: 8 })}
            {circleNode(0.74, 0.3, 0.06, 'y', { fontSize: 8 })}
            {circleNode(0.74, 0.66, 0.06, 'l', { fontSize: 8 })}
            {arrow(0.28, 0.52, 0.42, 0.44, 'df1')}
            {arrow(0.54, 0.4, 0.68, 0.32, 'df2')}
            {arrow(0.54, 0.46, 0.68, 0.62, 'df3')}
          </g>
        )
      }

      if (kind.includes('petri')) {
        return (
          <g>
            {circleNode(0.24, 0.5, 0.08, '')}
            {rectNode(0.45, 0.36, 0.08, 0.28, '')}
            {circleNode(0.74, 0.5, 0.08, '')}
            {arrow(0.32, 0.5, 0.45, 0.5, 'p1')}
            {arrow(0.53, 0.5, 0.66, 0.5, 'p2')}
          </g>
        )
      }

      if (kind.includes('bipartite')) {
        return (
          <g>
            {[0.3, 0.5, 0.7].map((y, index) => circleNode(0.28, y, 0.045, '', { key: `l${index}` }))}
            {[0.38, 0.62].map((y, index) => circleNode(0.72, y, 0.045, '', { key: `r${index}` }))}
            {[0.3, 0.5, 0.7].flatMap((y1) => [0.38, 0.62].map((y2) => <line key={`${y1}-${y2}`} {...shapeCommon} x1={sx(0.32)} y1={sy(y1)} x2={sx(0.68)} y2={sy(y2)} opacity="0.35" />))}
          </g>
        )
      }

      if (kind.includes('autoencoder')) {
        return (
          <g>
            {[0.22, 0.34, 0.46, 0.58, 0.7].map((x, index) => (
              <g key={x}>
                {Array.from({ length: index === 2 ? 1 : index % 2 ? 2 : 3 }, (_, node) => circleNode(x, 0.5 + (node - 1) * 0.14, 0.035, '', { key: node }))}
              </g>
            ))}
            {miniText(0.46, 0.26, 'z')}
          </g>
        )
      }

      if (kind.includes('unet')) {
        return (
          <g>
            {[0.2, 0.34, 0.5, 0.66, 0.8].map((x, index) => rectNode(x - 0.045, 0.28 + Math.abs(index - 2) * 0.1, 0.09, 0.42 - Math.abs(index - 2) * 0.06, '', { key: x }))}
            <path {...shapeCommon} d={`M ${sx(0.28)} ${sy(0.35)} C ${sx(0.42)} ${sy(0.18)}, ${sx(0.6)} ${sy(0.18)}, ${sx(0.72)} ${sy(0.35)}`} opacity="0.45" />
          </g>
        )
      }

      if (kind.includes('mimo-tx') || kind.includes('mimo-rx')) {
        return (
          <g>
            {rectNode(0.18, 0.36, 0.24, 0.28, kind.includes('tx') ? 'TX' : 'EQ')}
            {[0.26, 0.5, 0.74].map((y, index) => arrow(0.42, 0.5, 0.78, y, index))}
          </g>
        )
      }

      if (kind.includes('directed') || kind.includes('graphs')) {
        return (
          <g>
            {circleNode(0.25, 0.5, 0.07, 'u')}
            {circleNode(0.75, 0.5, 0.07, 'v')}
            {arrow(0.32, 0.5, 0.68, 0.5, 'edge')}
          </g>
        )
      }

      return (
        <g>
          {[0.24, 0.5, 0.76].map((x, layer) =>
            Array.from({ length: layer === 1 ? 4 : 3 }, (_, node) => (
              <circle key={`${layer}-${node}`} cx={sx(x)} cy={sy(0.32 + node * (layer === 1 ? 0.12 : 0.16))} r="5" fill={previewFill} stroke={previewStroke} />
            )),
          )}
          {[0.32, 0.5, 0.68].map((y) => <line key={y} {...shapeCommon} x1={sx(0.3)} y1={sy(y)} x2={sx(0.7)} y2={sy(y)} opacity="0.22" />)}
        </g>
      )
    }
    const renderLogicPreview = (kind) => {
      if (kind.includes('not')) {
        return (
          <g>
            <path {...shapeCommon} d={`M ${sx(0.34)} ${sy(0.3)} L ${sx(0.34)} ${sy(0.7)} L ${sx(0.66)} ${sy(0.5)} Z`} />
            <circle {...shapeCommon} cx={sx(0.7)} cy={sy(0.5)} r="4" />
            <line {...shapeCommon} x1={sx(0.12)} y1={sy(0.5)} x2={sx(0.34)} y2={sy(0.5)} />
            <line {...shapeCommon} x1={sx(0.74)} y1={sy(0.5)} x2={sx(0.9)} y2={sy(0.5)} />
          </g>
        )
      }
      if (kind.includes('gates-iec')) {
        return (
          <g>
            {['AND', 'OR', 'NOT'].map((label, index) => (
              <g key={label}>
                {rectNode(0.15 + index * 0.25, 0.38, 0.18, 0.22, label, { fontSize: 7 })}
                {index < 2 && arrow(0.33 + index * 0.25, 0.49, 0.39 + index * 0.25, 0.49, `lg-${index}`, { size: 4 })}
              </g>
            ))}
          </g>
        )
      }
      if (kind.includes('mux')) return rectNode(0.32, 0.24, 0.36, 0.52, 'MUX')
      if (kind.includes('flipflop')) return rectNode(0.3, 0.24, 0.4, 0.52, 'D Q')
      if (kind.includes('adder')) return circleNode(0.5, 0.5, 0.15, 'SUM', { fontSize: 10 })
      const isOr = kind.includes('or') || kind.includes('xor')
      return (
        <g>
          <path {...shapeCommon} d={isOr ? `M ${sx(0.32)} ${sy(0.26)} C ${sx(0.48)} ${sy(0.34)}, ${sx(0.48)} ${sy(0.66)}, ${sx(0.32)} ${sy(0.74)} C ${sx(0.56)} ${sy(0.72)}, ${sx(0.72)} ${sy(0.62)}, ${sx(0.82)} ${sy(0.5)} C ${sx(0.72)} ${sy(0.38)}, ${sx(0.56)} ${sy(0.28)}, ${sx(0.32)} ${sy(0.26)}` : `M ${sx(0.32)} ${sy(0.26)} L ${sx(0.56)} ${sy(0.26)} C ${sx(0.78)} ${sy(0.28)}, ${sx(0.78)} ${sy(0.72)}, ${sx(0.56)} ${sy(0.74)} L ${sx(0.32)} ${sy(0.74)} Z`} />
          <line {...shapeCommon} x1={sx(0.12)} y1={sy(0.4)} x2={sx(0.34)} y2={sy(0.4)} />
          <line {...shapeCommon} x1={sx(0.12)} y1={sy(0.6)} x2={sx(0.34)} y2={sy(0.6)} />
          <line {...shapeCommon} x1={sx(0.78)} y1={sy(0.5)} x2={sx(0.92)} y2={sy(0.5)} />
          {(kind.includes('nand') || kind.includes('nor') || kind.includes('xnor')) && <circle {...shapeCommon} cx={sx(0.82)} cy={sy(0.5)} r="4" />}
        </g>
      )
    }
    const renderFlowPreview = (kind) => {
      if (kind.includes('kalman')) {
        return (
          <g>
            {rectNode(0.1, 0.35, 0.22, 0.2, 'predict', { fontSize: 8 })}
            {circleNode(0.46, 0.45, 0.075, 'nu', { fontSize: 8 })}
            {rectNode(0.36, 0.16, 0.22, 0.16, 'K', { fontSize: 9 })}
            {rectNode(0.68, 0.35, 0.22, 0.2, 'update', { fontSize: 8 })}
            {arrow(0.32, 0.45, 0.39, 0.45, 'kalman-pred', { size: 4 })}
            {arrow(0.54, 0.45, 0.68, 0.45, 'kalman-innov', { size: 4 })}
            {arrow(0.47, 0.32, 0.47, 0.35, 'kalman-gain', { size: 4 })}
            <path {...shapeCommon} d={`M ${sx(0.79)} ${sy(0.55)} L ${sx(0.79)} ${sy(0.78)} L ${sx(0.21)} ${sy(0.78)} L ${sx(0.21)} ${sy(0.55)}`} />
            {miniText(0.5, 0.83, 'posterior feedback', { fontSize: 7 })}
            {miniText(0.46, 0.66, 'y - Hx-', { fontSize: 7 })}
          </g>
        )
      }
      if (kind.includes('shape-decision') || kind.includes('flow-decision')) return diamondNode(0.5, 0.5, 0.42, 0.42, '?')
      if (kind.includes('shapes-palette')) {
        return (
          <g>
            {diamondNode(0.25, 0.5, 0.22, 0.28, '')}
            {circleNode(0.52, 0.5, 0.09, '')}
            {rectNode(0.66, 0.38, 0.22, 0.24, 'III', { fontSize: 8 })}
          </g>
        )
      }
      if (kind.includes('ellipse')) {
        return (
          <g>
            <ellipse {...filledShapeCommon} cx={sx(0.5)} cy={sy(0.5)} rx={baseWidth * 0.24} ry={baseHeight * 0.16} />
            {miniText(0.5, 0.53, 'x')}
          </g>
        )
      }
      if (kind.includes('cylinder')) {
        return (
          <g>
            <ellipse {...filledShapeCommon} cx={sx(0.5)} cy={sy(0.28)} rx={baseWidth * 0.22} ry={baseHeight * 0.08} />
            <rect {...filledShapeCommon} x={sx(0.28)} y={sy(0.28)} width={baseWidth * 0.44} height={baseHeight * 0.42} />
            <ellipse {...shapeCommon} cx={sx(0.5)} cy={sy(0.7)} rx={baseWidth * 0.22} ry={baseHeight * 0.08} />
          </g>
        )
      }
      if (kind.includes('cloud')) return <path {...filledShapeCommon} d={`M ${sx(0.25)} ${sy(0.58)} C ${sx(0.15)} ${sy(0.45)}, ${sx(0.3)} ${sy(0.3)}, ${sx(0.42)} ${sy(0.38)} C ${sx(0.48)} ${sy(0.2)}, ${sx(0.72)} ${sy(0.3)}, ${sx(0.68)} ${sy(0.48)} C ${sx(0.86)} ${sy(0.48)}, ${sx(0.82)} ${sy(0.72)}, ${sx(0.62)} ${sy(0.68)} L ${sx(0.3)} ${sy(0.68)} C ${sx(0.22)} ${sy(0.68)}, ${sx(0.18)} ${sy(0.62)}, ${sx(0.25)} ${sy(0.58)} Z`} />
      if (kind.includes('callout')) {
        return (
          <g>
            {rectNode(0.25, 0.28, 0.45, 0.28, 'note')}
            <path {...shapeCommon} d={`M ${sx(0.62)} ${sy(0.56)} L ${sx(0.84)} ${sy(0.78)}`} />
          </g>
        )
      }
      if (kind.includes('image-placeholder')) {
        return (
          <g>
            <rect {...shapeCommon} x={sx(0.22)} y={sy(0.28)} width={baseWidth * 0.56} height={baseHeight * 0.42} />
            <line {...shapeCommon} x1={sx(0.22)} y1={sy(0.28)} x2={sx(0.78)} y2={sy(0.7)} opacity="0.5" />
            <line {...shapeCommon} x1={sx(0.78)} y1={sy(0.28)} x2={sx(0.22)} y2={sy(0.7)} opacity="0.5" />
          </g>
        )
      }
      if (kind.includes('positioning-fit') || kind.includes('fit-box') || kind.includes('background') || kind.includes('dashed-region') || kind.includes('highlight')) {
        return (
          <g>
            <rect x={sx(0.18)} y={sy(0.28)} width={baseWidth * 0.64} height={baseHeight * 0.44} rx="6" fill={previewStroke} opacity="0.08" stroke={previewStroke} strokeDasharray="4 3" />
            {[0.25, 0.47, 0.69].map((x, index) => rectNode(x, 0.44, 0.14, 0.14, String.fromCharCode(65 + index), { key: index, fontSize: 8 }))}
            {arrow(0.39, 0.51, 0.47, 0.51, 'fit1', { size: 4 })}
            {arrow(0.61, 0.51, 0.69, 0.51, 'fit2', { size: 4 })}
          </g>
        )
      }
      if (kind.includes('swimlane')) {
        return (
          <g>
            <rect {...shapeCommon} x={sx(0.16)} y={sy(0.25)} width={baseWidth * 0.68} height={baseHeight * 0.5} />
            <line {...shapeCommon} x1={sx(0.16)} y1={sy(0.5)} x2={sx(0.84)} y2={sy(0.5)} opacity="0.35" />
            {rectNode(0.24, 0.32, 0.18, 0.13, 'A', { fontSize: 8 })}
            {rectNode(0.58, 0.58, 0.18, 0.13, 'B', { fontSize: 8 })}
            {arrow(0.42, 0.39, 0.58, 0.64, 'lane')}
          </g>
        )
      }
      if (kind.includes('er-') || kind.includes('er-diagram')) {
        return (
          <g>
            {rectNode(0.14, 0.4, 0.24, 0.2, 'User', { fontSize: 8 })}
            {diamondNode(0.5, 0.5, 0.2, 0.22, 'owns')}
            {rectNode(0.62, 0.4, 0.24, 0.2, 'File', { fontSize: 8 })}
            <line {...shapeCommon} x1={sx(0.38)} y1={sy(0.5)} x2={sx(0.4)} y2={sy(0.5)} />
            <line {...shapeCommon} x1={sx(0.6)} y1={sy(0.5)} x2={sx(0.62)} y2={sy(0.5)} />
          </g>
        )
      }
      if (kind.includes('sequence')) {
        return (
          <g>
            {['A', 'B', 'C'].map((label, index) => (
              <g key={label}>
                {rectNode(0.18 + index * 0.26, 0.2, 0.16, 0.12, label, { fontSize: 8 })}
                <line {...shapeCommon} x1={sx(0.26 + index * 0.26)} y1={sy(0.32)} x2={sx(0.26 + index * 0.26)} y2={sy(0.8)} opacity="0.35" strokeDasharray="3 3" />
              </g>
            ))}
            {arrow(0.3, 0.45, 0.68, 0.45, 'seq1')}
            {arrow(0.7, 0.62, 0.32, 0.62, 'seq2')}
          </g>
        )
      }
      if (kind.includes('usecase')) {
        return (
          <g>
            {circleNode(0.22, 0.34, 0.045, '')}
            <line {...shapeCommon} x1={sx(0.22)} y1={sy(0.39)} x2={sx(0.22)} y2={sy(0.6)} />
            <line {...shapeCommon} x1={sx(0.12)} y1={sy(0.48)} x2={sx(0.32)} y2={sy(0.48)} />
            <line {...shapeCommon} x1={sx(0.22)} y1={sy(0.6)} x2={sx(0.14)} y2={sy(0.76)} />
            <line {...shapeCommon} x1={sx(0.22)} y1={sy(0.6)} x2={sx(0.3)} y2={sy(0.76)} />
            <ellipse {...filledShapeCommon} cx={sx(0.62)} cy={sy(0.5)} rx={baseWidth * 0.24} ry={baseHeight * 0.13} />
            {miniText(0.62, 0.53, 'case', { fontSize: 8 })}
          </g>
        )
      }
      if (kind.includes('table')) return renderMatrixPreview('link-budget')
      if (kind.includes('venn')) {
        return (
          <g>
            <circle {...shapeCommon} cx={sx(0.42)} cy={sy(0.5)} r={Math.min(baseWidth, baseHeight) * 0.18} />
            <circle {...shapeCommon} cx={sx(0.58)} cy={sy(0.5)} r={Math.min(baseWidth, baseHeight) * 0.18} />
          </g>
        )
      }
      if (kind.includes('gantt')) {
        return (
          <g>
            {[0.28, 0.45, 0.62].map((y, index) => (
              <rect key={index} x={sx(0.22 + index * 0.12)} y={sy(y)} width={baseWidth * (0.42 - index * 0.05)} height={baseHeight * 0.07} fill={previewStroke} opacity={0.28 + index * 0.18} />
            ))}
            <line {...shapeCommon} x1={sx(0.18)} y1={sy(0.75)} x2={sx(0.86)} y2={sy(0.75)} opacity="0.45" />
          </g>
        )
      }
      if (kind.includes('pipeline') || kind.includes('transmitter') || kind.includes('receiver') || kind.includes('superhet')) {
        const labels = kind.includes('superhet') ? ['RF', 'Mix', 'IF', 'Det'] : kind.includes('receiver') ? ['RF', 'ADC', 'DSP'] : kind.includes('pipeline') ? ['Data', 'Fit', 'Eval'] : ['Bits', 'Map', 'RF']
        return (
          <g>
            {labels.map((label, index) => (
              <g key={label}>
                {rectNode(0.14 + index * 0.24, 0.38, 0.18, 0.22, label, { fontSize: 8 })}
                {index < labels.length - 1 && arrow(0.32 + index * 0.24, 0.49, 0.37 + index * 0.24, 0.49, `a-${index}`, { size: 4 })}
              </g>
            ))}
          </g>
        )
      }
      if (kind.includes('channel')) {
        return (
          <g>
            {rectNode(0.22, 0.38, 0.24, 0.24, 'h(t)')}
            {circleNode(0.62, 0.5, 0.09, '+')}
            {arrow(0.46, 0.5, 0.54, 0.5, 'c1')}
            {arrow(0.62, 0.28, 0.62, 0.42, 'c2')}
            {miniText(0.68, 0.3, 'n')}
          </g>
        )
      }
      if (kind.includes('mixer')) return circleNode(0.5, 0.5, 0.15, 'x', { fontSize: 14 })
      if (kind.includes('antenna')) {
        return (
          <g>
            <line {...shapeCommon} x1={sx(0.5)} y1={sy(0.78)} x2={sx(0.5)} y2={sy(0.36)} />
            <line {...shapeCommon} x1={sx(0.5)} y1={sy(0.36)} x2={sx(0.34)} y2={sy(0.18)} />
            <line {...shapeCommon} x1={sx(0.5)} y1={sy(0.36)} x2={sx(0.66)} y2={sy(0.18)} />
            <path {...shapeCommon} d={`M ${sx(0.28)} ${sy(0.32)} q ${baseWidth * 0.1} ${baseHeight * 0.18} 0 ${baseHeight * 0.36}`} opacity="0.45" />
            <path {...shapeCommon} d={`M ${sx(0.72)} ${sy(0.32)} q ${-baseWidth * 0.1} ${baseHeight * 0.18} 0 ${baseHeight * 0.36}`} opacity="0.45" />
          </g>
        )
      }
      if (kind.includes('pll') || kind.includes('feedback')) {
        return (
          <g>
            {rectNode(0.16, 0.38, 0.18, 0.2, kind.includes('pll') ? 'PD' : 'G')}
            {rectNode(0.48, 0.38, 0.18, 0.2, kind.includes('pll') ? 'VCO' : 'H')}
            {arrow(0.34, 0.48, 0.48, 0.48, 'f1')}
            <path {...shapeCommon} d={`M ${sx(0.66)} ${sy(0.48)} L ${sx(0.78)} ${sy(0.48)} L ${sx(0.78)} ${sy(0.78)} L ${sx(0.16)} ${sy(0.78)} L ${sx(0.16)} ${sy(0.58)}`} />
          </g>
        )
      }
      if (kind.includes('amplifier')) {
        return (
          <g>
            <path {...filledShapeCommon} d={`M ${sx(0.34)} ${sy(0.28)} L ${sx(0.34)} ${sy(0.72)} L ${sx(0.72)} ${sy(0.5)} Z`} />
            {arrow(0.12, 0.5, 0.34, 0.5, 'in')}
            {arrow(0.72, 0.5, 0.9, 0.5, 'out')}
            {miniText(0.48, 0.52, 'G')}
          </g>
        )
      }
      if (kind.includes('coupler')) {
        return (
          <g>
            <line {...shapeCommon} x1={sx(0.14)} y1={sy(0.42)} x2={sx(0.86)} y2={sy(0.42)} />
            <line {...shapeCommon} x1={sx(0.22)} y1={sy(0.62)} x2={sx(0.78)} y2={sy(0.62)} />
            {arrow(0.48, 0.5, 0.66, 0.58, 'couple')}
          </g>
        )
      }
      if (kind.includes('splitter') || kind.includes('combiner')) {
        return (
          <g>
            {circleNode(0.5, 0.5, 0.12, 'S')}
            {kind.includes('combiner') ? (
              <>
                {arrow(0.16, 0.32, 0.42, 0.46, 'i1')}
                {arrow(0.16, 0.68, 0.42, 0.54, 'i2')}
                {arrow(0.58, 0.5, 0.86, 0.5, 'o')}
              </>
            ) : (
              <>
                {arrow(0.16, 0.5, 0.42, 0.5, 'i')}
                {arrow(0.58, 0.46, 0.86, 0.32, 'o1')}
                {arrow(0.58, 0.54, 0.86, 0.68, 'o2')}
              </>
            )}
          </g>
        )
      }
      if (kind.includes('waveguide')) return rectNode(0.18, 0.36, 0.64, 0.28, 'WG')
      if (kind.includes('circulator')) return circleNode(0.5, 0.5, 0.18, 'cw', { fontSize: 11 })
      if (kind.includes('isolator')) return rectNode(0.32, 0.38, 0.36, 0.22, 'ISO')
      if (kind.includes('delay')) return rectNode(0.32, 0.38, 0.36, 0.22, 'z^-1')
      if (kind.includes('transfer')) return rectNode(0.32, 0.38, 0.36, 0.22, 'H(z)')
      if (kind.includes('filter')) return rectNode(0.32, 0.38, 0.36, 0.22, 'BPF')
      if (kind.includes('qpsk')) return rectNode(0.27, 0.36, 0.46, 0.26, 'QPSK')
      if (kind.includes('ifft') || kind.includes('fft') || kind.includes('cp')) return rectNode(0.34, 0.38, 0.32, 0.22, kind.includes('ifft') ? 'IFFT' : kind.includes('fft') ? 'FFT' : 'CP')
      if (kind.includes('transformer') || kind.includes('attention')) {
        return (
          <g>
            {rectNode(0.18, 0.3, 0.24, 0.18, 'QK', { fontSize: 8 })}
            {rectNode(0.58, 0.3, 0.24, 0.18, 'V', { fontSize: 8 })}
            {circleNode(0.5, 0.62, 0.08, 'soft', { fontSize: 7 })}
            {arrow(0.42, 0.39, 0.5, 0.56, 'att1', { size: 4 })}
            {arrow(0.58, 0.39, 0.5, 0.56, 'att2', { size: 4 })}
          </g>
        )
      }
      if (kind.includes('residual')) {
        return (
          <g>
            {rectNode(0.38, 0.38, 0.24, 0.2, 'F(x)', { fontSize: 8 })}
            {arrow(0.12, 0.48, 0.38, 0.48, 'res1')}
            {arrow(0.62, 0.48, 0.86, 0.48, 'res2')}
            <path {...shapeCommon} d={`M ${sx(0.2)} ${sy(0.48)} V ${sy(0.76)} H ${sx(0.78)} V ${sy(0.52)}`} opacity="0.55" />
          </g>
        )
      }
      if (kind.includes('rnn')) {
        return (
          <g>
            {rectNode(0.34, 0.34, 0.32, 0.26, 'h_t', { fontSize: 10 })}
            <path {...shapeCommon} d={`M ${sx(0.48)} ${sy(0.34)} C ${sx(0.26)} ${sy(0.12)}, ${sx(0.74)} ${sy(0.12)}, ${sx(0.52)} ${sy(0.34)}`} />
            {arrow(0.18, 0.47, 0.34, 0.47, 'rnn1')}
            {arrow(0.66, 0.47, 0.84, 0.47, 'rnn2')}
          </g>
        )
      }
      if (kind.includes('gan')) {
        return (
          <g>
            {rectNode(0.14, 0.38, 0.22, 0.22, 'G', { fontSize: 11 })}
            {rectNode(0.62, 0.38, 0.22, 0.22, 'D', { fontSize: 11 })}
            {arrow(0.36, 0.49, 0.62, 0.49, 'gan')}
            {miniText(0.5, 0.32, 'fake/real', { fontSize: 8 })}
          </g>
        )
      }
      if (kind.includes('cnn-stack')) {
        return (
          <g>
            {[0.2, 0.36, 0.54, 0.72].map((x, index) => (
              <rect key={index} x={sx(x)} y={sy(0.28 + index * 0.05)} width={baseWidth * (0.12 - index * 0.01)} height={baseHeight * (0.48 - index * 0.07)} fill={previewStroke} opacity={0.08 + index * 0.06} stroke={previewStroke} />
            ))}
            {miniText(0.5, 0.78, 'conv', { fontSize: 8 })}
          </g>
        )
      }
      if (kind.includes('polygon')) {
        return (
          <g>
            <path {...filledShapeCommon} d={`M ${sx(0.25)} ${sy(0.65)} L ${sx(0.42)} ${sy(0.26)} L ${sx(0.78)} ${sy(0.38)} L ${sx(0.68)} ${sy(0.72)} Z`} />
            <line {...shapeCommon} x1={sx(0.25)} y1={sy(0.65)} x2={sx(0.78)} y2={sy(0.38)} opacity="0.35" />
          </g>
        )
      }
      if (kind.includes('bezier') || kind.includes('calc-intersections')) {
        return (
          <g>
            <path {...shapeCommon} d={`M ${sx(0.18)} ${sy(0.68)} C ${sx(0.34)} ${sy(0.18)}, ${sx(0.66)} ${sy(0.82)}, ${sx(0.84)} ${sy(0.32)}`} />
            <line {...shapeCommon} x1={sx(0.2)} y1={sy(0.32)} x2={sx(0.82)} y2={sy(0.72)} opacity="0.35" />
            {circleNode(0.52, 0.5, 0.035, 'p', { fontSize: 7 })}
          </g>
        )
      }
      if (kind.includes('coordinate-grid') || kind.includes('basis') || kind.includes('vector')) {
        return (
          <g>
            {axisFrame()}
            {arrow(0.18, 0.78, 0.74, kind.includes('vector') ? 0.32 : 0.78, 'v')}
            {kind.includes('basis') && arrow(0.18, 0.78, 0.18, 0.28, 'basis')}
          </g>
        )
      }
      if (kind.includes('decorations')) {
        return (
          <g>
            <path {...shapeCommon} d={`M ${sx(0.18)} ${sy(0.35)} q ${baseWidth * 0.06} ${-baseHeight * 0.12} ${baseWidth * 0.12} 0 t ${baseWidth * 0.12} 0 t ${baseWidth * 0.12} 0 t ${baseWidth * 0.12} 0`} />
            <path {...shapeCommon} d={`M ${sx(0.22)} ${sy(0.68)} C ${sx(0.12)} ${sy(0.62)}, ${sx(0.24)} ${sy(0.5)}, ${sx(0.14)} ${sy(0.5)} C ${sx(0.24)} ${sy(0.5)}, ${sx(0.12)} ${sy(0.38)}, ${sx(0.22)} ${sy(0.32)}`} />
          </g>
        )
      }
      if (kind.includes('patterns') || kind.includes('fills')) {
        return (
          <g>
            <rect {...filledShapeCommon} x={sx(0.2)} y={sy(0.3)} width={baseWidth * 0.22} height={baseHeight * 0.36} />
            {[0, 1, 2, 3].map((index) => <line key={index} {...shapeCommon} x1={sx(0.2 + index * 0.055)} y1={sy(0.66)} x2={sx(0.34 + index * 0.055)} y2={sy(0.3)} opacity="0.35" />)}
            <circle cx={sx(0.66)} cy={sy(0.48)} r={Math.min(baseWidth, baseHeight) * 0.13} fill={previewStroke} opacity="0.12" stroke={previewStroke} />
          </g>
        )
      }
      if (kind.includes('spy')) {
        return (
          <g>
            {axisFrame()}
            <path {...shapeCommon} d={`M ${sx(0.18)} ${sy(0.62)} C ${sx(0.34)} ${sy(0.28)}, ${sx(0.5)} ${sy(0.76)}, ${sx(0.7)} ${sy(0.42)}`} />
            <circle {...shapeCommon} cx={sx(0.42)} cy={sy(0.52)} r={Math.min(baseWidth, baseHeight) * 0.08} />
            <circle {...shapeCommon} cx={sx(0.78)} cy={sy(0.28)} r={Math.min(baseWidth, baseHeight) * 0.12} />
            <line {...shapeCommon} x1={sx(0.48)} y1={sy(0.48)} x2={sx(0.7)} y2={sy(0.32)} opacity="0.4" />
          </g>
        )
      }
      if (kind.includes('multi-panel')) {
        return (
          <g>
            {[0, 1, 2, 3].map((index) => (
              <rect key={index} {...shapeCommon} x={sx(0.22 + (index % 2) * 0.3)} y={sy(0.28 + Math.floor(index / 2) * 0.25)} width={baseWidth * 0.22} height={baseHeight * 0.17} />
            ))}
          </g>
        )
      }
      if (kind.includes('right-angle')) {
        return (
          <g>
            <line {...shapeCommon} x1={sx(0.26)} y1={sy(0.72)} x2={sx(0.74)} y2={sy(0.72)} />
            <line {...shapeCommon} x1={sx(0.74)} y1={sy(0.72)} x2={sx(0.74)} y2={sy(0.26)} />
            <path {...shapeCommon} d={`M ${sx(0.62)} ${sy(0.72)} V ${sy(0.6)} H ${sx(0.74)}`} />
          </g>
        )
      }
      if (kind.includes('angle')) {
        return (
          <g>
            <line {...shapeCommon} x1={sx(0.28)} y1={sy(0.72)} x2={sx(0.78)} y2={sy(0.72)} />
            <line {...shapeCommon} x1={sx(0.28)} y1={sy(0.72)} x2={sx(0.68)} y2={sy(0.32)} />
            <path {...shapeCommon} d={`M ${sx(0.42)} ${sy(0.72)} A ${baseWidth * 0.16} ${baseHeight * 0.16} 0 0 1 ${sx(0.4)} ${sy(0.58)}`} />
          </g>
        )
      }
      if (kind.includes('brace') || kind.includes('bracket')) {
        return (
          <g>
            <path {...shapeCommon} d={`M ${sx(0.25)} ${sy(0.32)} C ${sx(0.14)} ${sy(0.36)}, ${sx(0.22)} ${sy(0.5)}, ${sx(0.12)} ${sy(0.5)} C ${sx(0.22)} ${sy(0.5)}, ${sx(0.14)} ${sy(0.64)}, ${sx(0.25)} ${sy(0.68)}`} />
            {miniText(0.5, 0.52, 'label')}
          </g>
        )
      }
      if (kind.includes('dimension')) {
        return (
          <g>
            {arrow(0.18, 0.55, 0.82, 0.55, 'dim')}
            <line {...shapeCommon} x1={sx(0.18)} y1={sy(0.42)} x2={sx(0.18)} y2={sy(0.68)} />
            <line {...shapeCommon} x1={sx(0.82)} y1={sy(0.42)} x2={sx(0.82)} y2={sy(0.68)} />
          </g>
        )
      }
      if (kind.includes('venn')) return null
      if (kind.includes('process') || kind.includes('module') || kind.includes('equation') || kind.includes('theorem')) return rectNode(0.22, 0.36, 0.56, 0.24, kind.includes('equation') ? 'f(x)' : kind.includes('theorem') ? 'Thm' : 'Block')
      return rectNode(0.24, 0.38, 0.52, 0.24, preset.title.slice(0, 8), { fontSize: 9 })
    }
    const renderSpecificPreview = (kind) => {
      if (kind.startsWith('plot-') || kind.startsWith('stats-') || kind.startsWith('pgfplots') || kind === 'ml-roc' || kind === 'ml-training-curve') return renderPlotPreview(kind)
      if (kind.startsWith('matrix-') || kind.includes('commutative') || kind.includes('tikz-cd') || kind.includes('confusion') || kind.includes('uml-class') || kind.includes('embedding') || kind.includes('bits') || kind.includes('mimo-channel') || kind.includes('link-budget') || kind.includes('sparameter')) return renderMatrixPreview(kind)
      if (
        kind === 'dl-layer' ||
        kind === 'dl-autoencoder' ||
        kind === 'dl-unet' ||
        kind.startsWith('graph-') ||
        kind.startsWith('petri-') ||
        kind.includes('automata') ||
        kind.includes('tree') ||
        kind.includes('mindmap') ||
        kind.includes('graphs') ||
        kind.includes('data-flow') ||
        kind.includes('mimo-tx') ||
        kind.includes('mimo-rx') ||
        kind.includes('math-comm-triangle')
      )
        return renderNetworkPreview(kind)
      if (kind.startsWith('logic-')) return renderLogicPreview(kind)
      if (
        kind.startsWith('telecom-') ||
        kind.startsWith('control-') ||
        kind.startsWith('rf-') ||
        kind.startsWith('shape-') ||
        kind.startsWith('flow-') ||
        kind.startsWith('er-') ||
        kind.startsWith('uml-') ||
        kind.startsWith('geom-') ||
        kind.startsWith('geometry-') ||
        kind.startsWith('annot') ||
        kind.startsWith('annotation-') ||
        kind.startsWith('math-') ||
        kind.startsWith('paper-') ||
        kind.startsWith('dl-') ||
        kind === 'gantt-paper' ||
        kind.includes('gantt') ||
        kind === 'angle-marker' ||
        kind === 'brace-annotation' ||
        kind === 'ml-pipeline' ||
        kind === 'positioning-fit' ||
        kind === 'background-layers' ||
        kind === 'calc-intersections' ||
        kind === 'angles-quotes' ||
        kind === 'shapes-palette' ||
        kind === 'decorations' ||
        kind === 'patterns-fadings-shadows' ||
        kind === 'spy-library'
      )
        return renderFlowPreview(kind)
      return null
    }

    const renderPreview = () => {
      const previewKind = previewKindForPreset(preset)
      const circuitPreview = renderCircuitPreview(previewKind)
      if (circuitPreview) return circuitPreview
      const specificPreview = renderSpecificPreview(previewKind)
      if (specificPreview) return specificPreview

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

    const renderObjectBadges = () => {
      if (!isSelectedObject) return null
      const badges = objectPreviewBadges(preset, config)
      if (!badges.length) return null

      const badgeWidth = Math.min(260, Math.max(138, width + 36))
      const badgeHeight = badges.length > 2 ? 48 : 26
      return (
        <foreignObject
          x={topLeft.x}
          y={topLeft.y - badgeHeight - 6}
          width={badgeWidth}
          height={badgeHeight}
          className="object-preview-badges"
        >
          <div xmlns="http://www.w3.org/1999/xhtml">
            {badges.map((badge) => (
              <span key={badge.key}>{badge.text}</span>
            ))}
          </div>
        </foreignObject>
      )
    }

    const renderTerminalPreview = () => {
      if (!isSelectedObject) return null
      const terminals = terminalPointsForElement(element)
      if (!terminals.length) return null

      const labels = terminalPreviewLabels(config.terminalNames, terminals.length)
      return (
        <g className="object-terminal-preview">
          {terminals.map((terminal, index) => {
            const point = worldToScreen(terminal)
            return (
              <g key={`${element.id}-terminal-${index}`}>
                <circle cx={point.x} cy={point.y} r="4.6" fill="#ffffff" stroke={previewStroke} strokeWidth="1.3" vectorEffect="non-scaling-stroke" />
                <text x={point.x + 7} y={point.y - 7} fill={previewStroke} fontSize="10" fontWeight="760">
                  {labels[index]}
                </text>
              </g>
            )
          })}
        </g>
      )
    }

    return (
      <g>
        {renderPreview()}
        {renderExtraNodePreview()}
        {renderTerminalPreview()}
        {renderObjectBadges()}
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
      const layout = functionPreviewLayout(element)
      const bounds = layout.frameBounds
      const topLeft = worldToScreen({ x: bounds.minX, y: bounds.maxY })
      const bottomRight = worldToScreen({ x: bounds.maxX, y: bounds.minY })
      return (
        <g>
          {functionOptionsFor(element).showGraphFrame && (
            <rect
              {...hitProps}
              x={topLeft.x - 8}
              y={topLeft.y - 8}
              width={bottomRight.x - topLeft.x + 16}
              height={bottomRight.y - topLeft.y + 16}
            />
          )}
          {functionDisplaySeries(element).flatMap(({ points }, seriesIndex) =>
            splitDrawableSegments(points.map((point) => (point ? mapFunctionPointForPreview(point, layout) : null))).map(
              (segment, index) => (
                <polyline
                  key={`${element.id}-hit-${seriesIndex}-${index}`}
                  {...hitProps}
                  points={segment.map(worldToScreen).map((point) => `${point.x},${point.y}`).join(' ')}
                  strokeWidth="18"
                />
              ),
            ),
          )}
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
      const box = labelMetricsForElement(element)
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
      const functionOptions = functionOptionsFor(element)
      const features = functionFeaturePoints(element)
      const displaySeries = functionDisplaySeries(element)
      const layout = functionPreviewLayout(element)
      const bounds = layout.frameBounds
      const dataBounds = layout.dataBounds
      const previewPoint = (point) => mapFunctionPointForPreview(point, layout)
      const topLeft = worldToScreen({ x: bounds.minX, y: bounds.maxY })
      const bottomRight = worldToScreen({ x: bounds.maxX, y: bounds.minY })
      const xTicks = graphTicks(dataBounds.minX, dataBounds.maxX, 7)
      const yTicks = graphTicks(dataBounds.minY, dataBounds.maxY, 5)
      const legendEntries = functionLegendEntries(displaySeries)
      const markerPoints = [
        ...(functionOptions.showXIntercepts ? features.xIntercepts.slice(0, 8).map((point) => ({ ...point, label: '$x_0$' })) : []),
        ...(functionOptions.showYIntercept && features.yIntercept ? [{ ...features.yIntercept, label: '$y_0$' }] : []),
        ...(functionOptions.showExtrema ? features.extrema.slice(0, 8).map((point) => ({ ...point, label: 'ext' })) : []),
        ...(functionOptions.showSamples ? features.samples.map((point) => ({ ...point, label: '' })) : []),
        ...features.marked.map((point) => ({ ...point, label: point.label || '' })),
      ]

      const renderMarkerGlyphAt = (screenPoint, markerStyle, color, key, size = 4) => {
        const parts = markerGlyphParts(markerStyle, { ...screenPoint, size })
        if (!parts.length) return null

        return (
          <g key={key} className="function-series-marker">
            {parts.map((part, partIndex) => {
              const partKey = `${key}-${partIndex}`
              const common = {
                stroke: color,
                strokeWidth: 1.25,
                vectorEffect: 'non-scaling-stroke',
              }
              if (part.type === 'circle') {
                return <circle key={partKey} {...common} cx={part.cx} cy={part.cy} r={part.r} fill={part.filled ? color : '#ffffff'} />
              }
              if (part.type === 'rect') {
                return <rect key={partKey} {...common} x={part.x} y={part.y} width={part.width} height={part.height} fill={part.filled ? color : '#ffffff'} />
              }
              if (part.type === 'path') {
                return <path key={partKey} {...common} d={part.d} fill={part.filled ? color : '#ffffff'} strokeLinejoin="round" />
              }
              if (part.type === 'line') {
                return <line key={partKey} {...common} x1={part.x1} y1={part.y1} x2={part.x2} y2={part.y2} strokeLinecap="round" />
              }
              return null
            })}
          </g>
        )
      }
      const renderMarkerGlyph = (point, markerStyle, color, key, size = 4) =>
        renderMarkerGlyphAt(worldToScreen(previewPoint(point)), markerStyle, color, key, size)

      const renderMarker = (point, key) => {
        const screenPoint = worldToScreen(previewPoint(point))
        return (
          <g key={key} className="function-marker">
            <circle
              cx={screenPoint.x}
              cy={screenPoint.y}
              r="5"
              fill="#ffffff"
              stroke={element.stroke}
              strokeWidth="1.2"
              vectorEffect="non-scaling-stroke"
            />
            {point.label && (
              <foreignObject
                x={screenPoint.x + 8}
                y={screenPoint.y - 26}
                width="88"
                height="28"
                className="function-marker-label"
              >
                <div xmlns="http://www.w3.org/1999/xhtml" dangerouslySetInnerHTML={{ __html: renderInlineLatexHtml(point.label) }} />
              </foreignObject>
            )}
          </g>
        )
      }

      const renderFunctionLegend = () => {
        const shouldShowLegend = !halo && legendEntries.length && (displaySeries.length > 1 || functionOptions.legend?.trim())
        if (!shouldShowLegend) return null

        const rowHeight = 18
        const legendWidth = Math.min(164, Math.max(124, bottomRight.x - topLeft.x - 16))
        const legendHeight = 10 + legendEntries.length * rowHeight
        const legendX = Math.max(topLeft.x + 8, bottomRight.x - legendWidth - 8)
        const legendY = topLeft.y + 8

        return (
          <g className="function-preview-legend">
            <rect
              x={legendX}
              y={legendY}
              width={legendWidth}
              height={legendHeight}
              rx="3"
              fill="#ffffff"
              fillOpacity="0.92"
              stroke="#cbd5e1"
              strokeWidth="0.8"
              vectorEffect="non-scaling-stroke"
            />
            {legendEntries.map((entry, index) => {
              const rowY = legendY + 12 + index * rowHeight
              const swatchX = legendX + 9
              return (
                <g key={entry.id}>
                  <line
                    x1={swatchX}
                    y1={rowY}
                    x2={swatchX + 28}
                    y2={rowY}
                    stroke={entry.color}
                    strokeWidth="2"
                    strokeDasharray={functionLineStyleSvg(entry.lineStyle) || undefined}
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                  />
                  {renderMarkerGlyphAt({ x: swatchX + 14, y: rowY }, entry.markerStyle, entry.color, `${entry.id}-legend-marker`, 3.5)}
                  <foreignObject x={swatchX + 36} y={rowY - 9} width={legendWidth - 48} height="18" className="function-legend-label">
                    <div xmlns="http://www.w3.org/1999/xhtml" dangerouslySetInnerHTML={{ __html: renderInlineLatexHtml(entry.label) }} />
                  </foreignObject>
                </g>
              )
            })}
          </g>
        )
      }

      const renderGraphChrome = () => {
        if (!functionOptions.showGraphFrame && !halo) return null
        const frameWidth = bottomRight.x - topLeft.x
        const frameHeight = bottomRight.y - topLeft.y
        return (
          <g className="function-graph-chrome">
            <rect
              x={topLeft.x}
              y={topLeft.y}
              width={frameWidth}
              height={frameHeight}
              fill={halo ? 'none' : '#ffffff'}
              fillOpacity={halo ? undefined : 0.94}
              stroke={halo ? '#6b7280' : '#9aa6b8'}
              strokeWidth={halo ? 1.4 : 0.9}
              vectorEffect="non-scaling-stroke"
              opacity={halo ? 0.32 : 1}
            />
            {!halo && functionOptions.showGraphGrid && (
              <g>
                {xTicks.map((xValue) => {
                  const start = worldToScreen(previewPoint({ x: xValue, y: dataBounds.minY }))
                  const end = worldToScreen(previewPoint({ x: xValue, y: dataBounds.maxY }))
                  return (
                    <line
                      key={`gx-${xValue}`}
                      x1={start.x}
                      y1={start.y}
                      x2={end.x}
                      y2={end.y}
                      stroke="#e2e8f0"
                      strokeWidth="0.65"
                      vectorEffect="non-scaling-stroke"
                    />
                  )
                })}
                {yTicks.map((yValue) => {
                  const start = worldToScreen(previewPoint({ x: dataBounds.minX, y: yValue }))
                  const end = worldToScreen(previewPoint({ x: dataBounds.maxX, y: yValue }))
                  return (
                    <line
                      key={`gy-${yValue}`}
                      x1={start.x}
                      y1={start.y}
                      x2={end.x}
                      y2={end.y}
                      stroke="#e2e8f0"
                      strokeWidth="0.65"
                      vectorEffect="non-scaling-stroke"
                    />
                  )
                })}
              </g>
            )}
            {!halo && functionOptions.showGraphAxes && (
              <g>
                {dataBounds.minY <= 0 && dataBounds.maxY >= 0 && (
                  <line
                    x1={topLeft.x}
                    y1={worldToScreen(previewPoint({ x: dataBounds.minX, y: 0 })).y}
                    x2={bottomRight.x}
                    y2={worldToScreen(previewPoint({ x: dataBounds.maxX, y: 0 })).y}
                    stroke="#94a3b8"
                    strokeWidth="1"
                    vectorEffect="non-scaling-stroke"
                  />
                )}
                {dataBounds.minX <= 0 && dataBounds.maxX >= 0 && (
                  <line
                    x1={worldToScreen(previewPoint({ x: 0, y: dataBounds.minY })).x}
                    y1={topLeft.y}
                    x2={worldToScreen(previewPoint({ x: 0, y: dataBounds.maxY })).x}
                    y2={bottomRight.y}
                    stroke="#94a3b8"
                    strokeWidth="1"
                    vectorEffect="non-scaling-stroke"
                  />
                )}
              </g>
            )}
            {!halo && functionOptions.showGraphAxes && (
              <>
                <foreignObject x={bottomRight.x - 38} y={bottomRight.y - 22} width="38" height="22" className="function-axis-label">
                  <div xmlns="http://www.w3.org/1999/xhtml" dangerouslySetInnerHTML={{ __html: renderInlineLatexHtml(functionOptions.xLabel) }} />
                </foreignObject>
                <foreignObject x={topLeft.x + 4} y={topLeft.y + 2} width="54" height="22" className="function-axis-label">
                  <div xmlns="http://www.w3.org/1999/xhtml" dangerouslySetInnerHTML={{ __html: renderInlineLatexHtml(functionOptions.yLabel) }} />
                </foreignObject>
              </>
            )}
          </g>
        )
      }

      return (
        <g>
          {renderGraphChrome()}
          {displaySeries.flatMap(({ series, points }, seriesIndex) =>
            splitDrawableSegments(points.map((point) => (point ? previewPoint(point) : null))).map(
              (segment, index) => (
                <polyline
                  key={`${element.id}-segment-${seriesIndex}-${index}`}
                  points={segment.map(worldToScreen).map((point) => `${point.x},${point.y}`).join(' ')}
                  fill="none"
                  stroke={halo ? stroke : series.color}
                  strokeWidth={(halo ? series.width + 3 : series.width) * 1.05}
                  strokeDasharray={!halo ? functionLineStyleSvg(series.lineStyle) || undefined : undefined}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={halo ? 0.26 : 1}
                  vectorEffect="non-scaling-stroke"
                />
              ),
            ),
          )}
          {!halo &&
            displaySeries.flatMap(({ series, points }, seriesIndex) =>
              curveMarkerPoints(points, series.markerStyle, 9).map((point, pointIndex) =>
                renderMarkerGlyph(point, series.markerStyle, series.color, `${element.id}-series-marker-${seriesIndex}-${pointIndex}`),
              ),
            )}
          {!halo && markerPoints.map((point, index) => renderMarker(point, `${element.id}-marker-${index}`))}
          {renderFunctionLegend()}
        </g>
      )
    }

    if (element.type === 'text') {
      const position = worldToScreen(element.position)
      const box = labelMetricsForElement(element)
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
              fontSize: `${box.fontSize}px`,
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

  const renderPaperGuideLayer = () => {
    if (!paperGuide) return null

    const rectForBounds = (bounds) => {
      const topLeft = worldToScreen({ x: bounds.minX, y: bounds.maxY })
      const bottomRight = worldToScreen({ x: bounds.maxX, y: bounds.minY })
      return {
        x: topLeft.x,
        y: topLeft.y,
        width: bottomRight.x - topLeft.x,
        height: bottomRight.y - topLeft.y,
      }
    }
    const frameRect = rectForBounds(paperGuide.frame)
    const safeRect = rectForBounds(paperGuide.safe)
    const frameLabel = worldToScreen({ x: paperGuide.frame.minX, y: paperGuide.frame.maxY })
    const showPanelFrames = paperGuide.panels.length > 1

    return (
      <g className="paper-guide-layer" pointerEvents="none">
        <rect {...frameRect} className="paper-guide-frame" vectorEffect="non-scaling-stroke" />
        <rect {...safeRect} className="paper-guide-safe" vectorEffect="non-scaling-stroke" />
        <text className="paper-guide-size" x={frameLabel.x + 8} y={frameLabel.y - 8}>
          {paperGuide.label} - {paperGuide.displaySize}
        </text>
        {paperGuide.panels.map((panel) => {
          const panelRect = rectForBounds(panel)
          const labelPoint = worldToScreen(panel.labelPoint)
          return (
            <g key={panel.id}>
              {showPanelFrames && <rect {...panelRect} className="paper-guide-panel" vectorEffect="non-scaling-stroke" />}
              {showPanelFrames && (
                <text className="paper-guide-panel-label" x={labelPoint.x} y={labelPoint.y}>
                  {panel.label}
                </text>
              )}
            </g>
          )
        })}
      </g>
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

  const renderLibraryConfigField = (field) => {
    if (!selectedLibraryConfig) return null
    const value = selectedLibraryConfig[field.key]

    if (field.type === 'checkbox') {
      return (
        <label key={field.key} className="toggle object-option-toggle">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(event) => updateSelectedLibraryConfig({ [field.key]: event.target.checked })}
          />
          <span>{field.label}</span>
        </label>
      )
    }

    if (field.type === 'select') {
      return (
        <label key={field.key} className="field">
          <span>{field.label}</span>
          <select value={value ?? ''} onChange={(event) => updateSelectedLibraryConfig({ [field.key]: event.target.value })}>
            {field.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label ?? option.value}
              </option>
            ))}
          </select>
        </label>
      )
    }

    if (field.type === 'textarea') {
      return (
        <label key={field.key} className="field object-option-wide">
          <span>{field.label}</span>
          <textarea
            className="snippet-input compact"
            value={value ?? ''}
            placeholder={field.placeholder}
            onChange={(event) => updateSelectedLibraryConfig({ [field.key]: event.target.value })}
          />
        </label>
      )
    }

    return (
      <label key={field.key} className="field">
        <span>{field.label}</span>
        <input
          type={field.type === 'number' ? 'number' : 'text'}
          min={field.min}
          max={field.max}
          step={field.step}
          value={value ?? ''}
          placeholder={field.placeholder}
          onChange={(event) =>
            updateSelectedLibraryConfig({
              [field.key]: field.type === 'number' ? Number(event.target.value) : event.target.value,
            })
          }
        />
      </label>
    )
  }

  const renderDiagramConfigField = (field) => {
    if (!selectedDiagramConfig) return null
    const value = selectedDiagramConfig[field.key] ?? ''

    if (field.type === 'textarea') {
      return (
        <label key={field.key} className="field object-option-wide">
          <span>{field.label}</span>
          <textarea
            aria-label={field.label}
            className="snippet-input compact"
            value={value}
            placeholder={field.placeholder}
            onChange={(event) => updateSelectedDiagramConfig({ [field.key]: event.target.value })}
          />
        </label>
      )
    }

    return (
      <label key={field.key} className="field">
        <span>{field.label}</span>
        <input
          aria-label={field.label}
          type="text"
          value={value}
          placeholder={field.placeholder}
          onChange={(event) => updateSelectedDiagramConfig({ [field.key]: event.target.value })}
        />
      </label>
    )
  }

  const renderSnippetLabelField = (label) => (
    <label key={label.key} className="field">
      <span>
        {label.label} {label.kind ? `(${label.kind})` : ''}
      </span>
      <input
        aria-label={`Etiqueta ${label.label}`}
        type="text"
        value={label.value}
        placeholder={label.value}
        onChange={(event) => updateSelectedSnippetLabel(label.key, event.target.value)}
      />
    </label>
  )

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
              {renderPaperGuideLayer()}
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
            <h2>Funcion / grafico</h2>
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
          <label className="field">
            <span>Estilo de curva</span>
            <select
              value={functionDraft.lineStyle}
              onChange={(event) => setFunctionDraft((state) => ({ ...state, lineStyle: event.target.value }))}
            >
              {functionLineStyleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <div className="function-swatch-row" aria-label="Color de funcion">
            {strokeColors.slice(0, 8).map((color) => (
              <button
                key={color.value}
                type="button"
                className={`mini-swatch ${functionDraft.color === color.value ? 'is-active' : ''}`}
                title={color.label}
                style={{ '--swatch': color.value }}
                onClick={() => setFunctionDraft((state) => ({ ...state, color: color.value }))}
              />
            ))}
          </div>
          {functionError && <p className="form-error">{functionError}</p>}
          <div className="example-row">
            {functionQuickExpressions.map((expression) => (
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
            Anadir grafico
          </button>
          {selectedElement?.type === 'function' && (
            <button type="button" className="ghost-button full" onClick={addFunctionToSelectedGraph}>
              <Sigma size={17} />
              Anadir al grafico seleccionado
            </button>
          )}
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
          <div className="panel-subtitle">Diagramas comunes</div>
          <label className="field">
            <span>Buscar diagrama</span>
            <input
              type="search"
              value={diagramSearch}
              onChange={(event) => setDiagramSearch(event.target.value)}
              placeholder="OFDM, Kalman, UML, Bode..."
            />
          </label>
          <div className="library-filter-row" aria-label="Filtrar diagramas comunes">
            {diagramGroups.map((group) => (
              <button
                key={group}
                type="button"
                className={`filter-chip ${diagramGroup === group ? 'is-active' : ''}`}
                onClick={() => setDiagramGroup(group)}
              >
                {group}
              </button>
            ))}
          </div>
          <div className="library-grid diagram-library-grid">
            {visibleDiagramItems.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className="library-button diagram-library-button"
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.effectAllowed = 'copy'
                  event.dataTransfer.setData('application/x-tikz-palette-item', preset.id)
                }}
                onClick={() => addLibraryPreset(preset)}
              >
                <strong>{preset.title}</strong>
                <span>{preset.group} diagram</span>
                <small>{preset.description}</small>
              </button>
            ))}
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
              placeholder="resistor, gate, antenna, shape..."
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
                  <div className="field-pair">
                    <label className="field">
                      <span>Ancho label cm</span>
                      <input
                        type="number"
                        min="0.25"
                        step="0.05"
                        value={formatNumber(labelMetricsForElement(selectedElement).widthCm)}
                        onChange={(event) => updateSelected({ labelWidth: Math.max(0.25, Number(event.target.value) || 0.25) })}
                      />
                    </label>
                    <label className="field">
                      <span>Alto label cm</span>
                      <input
                        type="number"
                        min="0.18"
                        step="0.05"
                        value={formatNumber(labelMetricsForElement(selectedElement).heightCm)}
                        onChange={(event) => updateSelected({ labelHeight: Math.max(0.18, Number(event.target.value) || 0.18) })}
                      />
                    </label>
                  </div>
                  <label className="field">
                    <span>Tamano fuente px</span>
                    <input
                      type="number"
                      min="6"
                      max="96"
                      step="1"
                      value={formatNumber(labelMetricsForElement(selectedElement).fontSize)}
                      onChange={(event) => updateSelected({ fontSize: Math.max(6, Math.min(96, Number(event.target.value) || 18)) })}
                    />
                  </label>
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
                  <div className="field-pair">
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
                      <span>Escala Y</span>
                      <input
                        type="number"
                        min="0.05"
                        step="0.05"
                        value={selectedFunctionOptions.yScale}
                        onChange={(event) => updateSelectedFunctionOptions({ yScale: Math.max(0.05, Number(event.target.value) || 1) })}
                      />
                    </label>
                  </div>
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
                  <div className="function-series-card primary-series">
                    <div className="series-card-head">
                      <strong>Curva principal</strong>
                      <small>{selectedElement.expression}</small>
                    </div>
                    <div className="function-swatch-row" aria-label="Color de la curva principal">
                      {strokeColors.slice(0, 8).map((color) => (
                        <button
                          key={color.value}
                          type="button"
                          className={`mini-swatch ${selectedElement.stroke === color.value ? 'is-active' : ''}`}
                          title={color.label}
                          style={{ '--swatch': color.value }}
                          onClick={() => updateSelected({ stroke: color.value })}
                        />
                      ))}
                    </div>
                    <div className="field-pair">
                      <label className="field">
                        <span>Trazo</span>
                        <select
                          value={selectedFunctionOptions.lineStyle}
                          onChange={(event) => updateSelectedFunctionOptions({ lineStyle: event.target.value })}
                        >
                          {functionLineStyleOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="field">
                        <span>Grosor pt</span>
                        <input
                          type="number"
                          min="0.2"
                          max="4"
                          step="0.05"
                          value={selectedElement.width ?? 0.75}
                          onChange={(event) => updateSelected({ width: Number(event.target.value) })}
                        />
                      </label>
                    </div>
                  </div>
                  <div className="object-config">
                    <div className="toggle-grid">
                      {[
                        ['showXIntercepts', 'Cortes X'],
                        ['showYIntercept', 'Corte Y'],
                        ['showExtrema', 'Extremos'],
                        ['showSamples', 'Muestras'],
                        ['showTangent', 'Tangente'],
                        ['showAsymptotes', 'Asintotas'],
                        ['showGraphFrame', 'Marco grafico'],
                        ['showGraphAxes', 'Ejes'],
                        ['showGraphGrid', 'Grid grafico'],
                        ['usePgfplots', 'PGFPlots'],
                      ].map(([key, label]) => (
                        <label key={key} className="toggle">
                          <input
                            type="checkbox"
                            checked={selectedFunctionOptions[key]}
                            onChange={(event) => updateSelectedFunctionOptions({ [key]: event.target.checked })}
                          />
                          <span>{label}</span>
                        </label>
                      ))}
                    </div>
                    <label className="field">
                      <span>Puntos marcados (x, y, etiqueta)</span>
                      <textarea
                        className="snippet-input compact"
                        value={selectedFunctionOptions.markedPoints}
                        onChange={(event) => updateSelectedFunctionOptions({ markedPoints: event.target.value })}
                        placeholder={'0, 0, origen\npi, 0, $\\pi$'}
                      />
                    </label>
                    <div className="function-series-list">
                      <div className="series-list-head">
                        <strong>Mas funciones en el mismo grafico</strong>
                        <button type="button" className="ghost-button compact-button" onClick={addFunctionSeries}>
                          <Sigma size={15} />
                          Anadir serie
                        </button>
                      </div>
                      {selectedFunctionSeries.map((series, index) => (
                        <div key={series.id || index} className="function-series-card">
                          <div className="series-card-head">
                            <label className="toggle inline-toggle">
                              <input
                                type="checkbox"
                                checked={series.enabled}
                                onChange={(event) => updateFunctionSeries(index, { enabled: event.target.checked })}
                              />
                              <strong>Serie {index + 2}</strong>
                            </label>
                            <button
                              type="button"
                              className="icon-danger small"
                              title="Eliminar serie"
                              aria-label="Eliminar serie"
                              onClick={() => removeFunctionSeries(index)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                          <label className="field">
                            <span>f(x)</span>
                            <input
                              type="text"
                              value={series.expression}
                              onChange={(event) => updateFunctionSeries(index, { expression: event.target.value })}
                              placeholder="cos(x), besselj1(x), max(x,0)..."
                            />
                          </label>
                          <div className="function-swatch-row" aria-label={`Color serie ${index + 2}`}>
                            {strokeColors.slice(0, 8).map((color) => (
                              <button
                                key={color.value}
                                type="button"
                                className={`mini-swatch ${series.color === color.value ? 'is-active' : ''}`}
                                title={color.label}
                                style={{ '--swatch': color.value }}
                                onClick={() => updateFunctionSeries(index, { color: color.value })}
                              />
                            ))}
                          </div>
                          <div className="field-pair">
                            <label className="field">
                              <span>Trazo</span>
                              <select
                                value={series.lineStyle}
                                onChange={(event) => updateFunctionSeries(index, { lineStyle: event.target.value })}
                              >
                                {functionLineStyleOptions.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label className="field">
                              <span>Marcador</span>
                              <select
                                value={series.markerStyle}
                                onChange={(event) => updateFunctionSeries(index, { markerStyle: event.target.value })}
                              >
                                {functionMarkerOptions.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </label>
                          </div>
                          <div className="field-pair">
                            <label className="field">
                              <span>Grosor pt</span>
                              <input
                                type="number"
                                min="0.2"
                                max="4"
                                step="0.05"
                                value={series.width}
                                onChange={(event) => updateFunctionSeries(index, { width: Number(event.target.value) })}
                              />
                            </label>
                            <label className="field">
                              <span>Offset y</span>
                              <input
                                type="number"
                                step="0.25"
                                value={series.yOffset}
                                onChange={(event) => updateFunctionSeries(index, { yOffset: Number(event.target.value) })}
                              />
                            </label>
                          </div>
                          <div className="field-pair">
                            <label className="field">
                              <span>Leyenda</span>
                              <input
                                type="text"
                                value={series.legend}
                                onChange={(event) => updateFunctionSeries(index, { legend: event.target.value })}
                              />
                            </label>
                            <label className="field">
                              <span>Opciones addplot</span>
                              <input
                                type="text"
                                value={series.plotOptions}
                                onChange={(event) => updateFunctionSeries(index, { plotOptions: event.target.value })}
                                placeholder="forget plot, opacity=0.7..."
                              />
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="field-pair">
                      <label className="field">
                        <span>Tipo eje</span>
                        <select
                          value={selectedFunctionOptions.axisType}
                          onChange={(event) => updateSelectedFunctionOptions({ axisType: event.target.value })}
                        >
                          <option value="axis">axis</option>
                          <option value="semilogxaxis">semilog x</option>
                          <option value="semilogyaxis">semilog y</option>
                          <option value="loglogaxis">loglog</option>
                          <option value="polaraxis">polar</option>
                        </select>
                      </label>
                      <label className="field">
                        <span>Marcador</span>
                        <select
                          value={selectedFunctionOptions.markerStyle}
                          onChange={(event) => updateSelectedFunctionOptions({ markerStyle: event.target.value })}
                        >
                          {functionMarkerOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <div className="field-pair">
                      <label className="field">
                        <span>Ancho eje</span>
                        <input
                          value={selectedFunctionOptions.axisWidth}
                          onChange={(event) => updateSelectedFunctionOptions({ axisWidth: event.target.value })}
                          placeholder="7cm, 0.8\\linewidth"
                        />
                      </label>
                      <label className="field">
                        <span>Alto eje</span>
                        <input
                          value={selectedFunctionOptions.axisHeight}
                          onChange={(event) => updateSelectedFunctionOptions({ axisHeight: event.target.value })}
                          placeholder="4.5cm"
                        />
                      </label>
                    </div>
                    <div className="field-pair">
                      <label className="field">
                        <span>Titulo eje</span>
                        <input
                          value={selectedFunctionOptions.plotTitle}
                          onChange={(event) => updateSelectedFunctionOptions({ plotTitle: event.target.value })}
                          placeholder="Response, training loss..."
                        />
                      </label>
                      <label className="field">
                        <span>Axis lines</span>
                        <select
                          value={selectedFunctionOptions.axisLines}
                          onChange={(event) => updateSelectedFunctionOptions({ axisLines: event.target.value })}
                        >
                          {axisLineOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <div className="toggle-grid">
                      {[
                        ['logX', 'Log X'],
                        ['logY', 'Log Y'],
                        ['clip', 'Clip axis'],
                        ['errorBars', 'Error bars'],
                        ['axisEqual', 'Axis equal'],
                        ['reverseX', 'Invertir X'],
                        ['reverseY', 'Invertir Y'],
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
                        <span>xmin</span>
                        <input
                          value={functionOptionsFor(selectedElement).xmin}
                          onChange={(event) => updateSelectedFunctionOptions({ xmin: event.target.value })}
                          placeholder="-1, 0, 1e-6"
                        />
                      </label>
                      <label className="field">
                        <span>xmax</span>
                        <input
                          value={functionOptionsFor(selectedElement).xmax}
                          onChange={(event) => updateSelectedFunctionOptions({ xmax: event.target.value })}
                          placeholder="1, 10, 2*pi"
                        />
                      </label>
                    </div>
                    <div className="field-pair">
                      <label className="field">
                        <span>ymin</span>
                        <input
                          value={functionOptionsFor(selectedElement).ymin}
                          onChange={(event) => updateSelectedFunctionOptions({ ymin: event.target.value })}
                          placeholder="0, 1e-6"
                        />
                      </label>
                      <label className="field">
                        <span>ymax</span>
                        <input
                          value={functionOptionsFor(selectedElement).ymax}
                          onChange={(event) => updateSelectedFunctionOptions({ ymax: event.target.value })}
                          placeholder="1, 1e2"
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
                    <div className="field-pair">
                      <label className="field">
                        <span>Minor ticks</span>
                        <input
                          type="number"
                          min="0"
                          max="20"
                          step="1"
                          value={functionOptionsFor(selectedElement).minorTicks}
                          onChange={(event) => updateSelectedFunctionOptions({ minorTicks: Number(event.target.value) })}
                        />
                      </label>
                      <label className="field">
                        <span>Legend cols</span>
                        <input
                          type="number"
                          min="1"
                          max="8"
                          step="1"
                          value={functionOptionsFor(selectedElement).legendColumns}
                          onChange={(event) => updateSelectedFunctionOptions({ legendColumns: Number(event.target.value) })}
                        />
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
                    <div className="field-pair">
                      <label className="field">
                        <span>xlabel style</span>
                        <input
                          value={functionOptionsFor(selectedElement).xLabelStyle}
                          onChange={(event) => updateSelectedFunctionOptions({ xLabelStyle: event.target.value })}
                          placeholder="font=\\small"
                        />
                      </label>
                      <label className="field">
                        <span>ylabel style</span>
                        <input
                          value={functionOptionsFor(selectedElement).yLabelStyle}
                          onChange={(event) => updateSelectedFunctionOptions({ yLabelStyle: event.target.value })}
                          placeholder="rotate=-90"
                        />
                      </label>
                    </div>
                    <div className="field-pair">
                      <label className="field">
                        <span>Legend style</span>
                        <input
                          value={functionOptionsFor(selectedElement).legendStyle}
                          onChange={(event) => updateSelectedFunctionOptions({ legendStyle: event.target.value })}
                          placeholder="draw=none, fill=none"
                        />
                      </label>
                      <label className="field">
                        <span>Enlarge limits</span>
                        <input
                          value={functionOptionsFor(selectedElement).enlargeLimits}
                          onChange={(event) => updateSelectedFunctionOptions({ enlargeLimits: event.target.value })}
                          placeholder="false, {abs=0.1}"
                        />
                      </label>
                    </div>
                    <div className="field-pair">
                      <label className="field">
                        <span>Axis line style</span>
                        <input
                          value={functionOptionsFor(selectedElement).axisLineStyle}
                          onChange={(event) => updateSelectedFunctionOptions({ axisLineStyle: event.target.value })}
                          placeholder="line width=.45pt"
                        />
                      </label>
                      <label className="field">
                        <span>Grid style</span>
                        <input
                          value={functionOptionsFor(selectedElement).gridLineStyle}
                          onChange={(event) => updateSelectedFunctionOptions({ gridLineStyle: event.target.value })}
                          placeholder="dashed, gray!30"
                        />
                      </label>
                    </div>
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
                  {selectedDiagramConfig && (
                    <div className="object-config diagram-object-config">
                      <div className="advanced-config-header">
                        <strong>{selectedDiagramConfigTitle}</strong>
                        <span>Cada label queda en este objeto</span>
                      </div>
                      <div className="object-option-grid">{selectedDiagramConfigFields.map(renderDiagramConfigField)}</div>
                      {selectedElement.diagramKind === 'gantt' && (
                        <p className="selection-note">Una barra por linea: label,start,end,row. Anade filas para mas barras.</p>
                      )}
                      {selectedElement.diagramKind === 'dl' && (
                        <p className="selection-note">Los conteos y labels aceptan listas separadas por coma o salto de linea.</p>
                      )}
                    </div>
                  )}
                  {selectedLibraryConfig && (
                    <div className="object-config">
                      <div className="field-pair">
                        <label className="field">
                          <span>Ancho</span>
                          <input
                            type="number"
                            min="0.1"
                            max="12"
                            step="0.05"
                            value={selectedLibraryConfig.stretchX}
                            onChange={(event) => updateSelectedLibraryConfig({ stretchX: Number(event.target.value) })}
                          />
                        </label>
                        <label className="field">
                          <span>Alto</span>
                          <input
                            type="number"
                            min="0.1"
                            max="12"
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
                      {selectedSnippetLabels.length > 0 && (
                        <details className="config-details snippet-label-details" open>
                          <summary>Etiquetas del objeto</summary>
                          <div className="object-option-grid snippet-label-grid">
                            {selectedSnippetLabels.map(renderSnippetLabelField)}
                          </div>
                        </details>
                      )}
                      {selectedCircuitQuickComponent && (
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
                                max="12"
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
                      {showExtraNodeConfig && (
                        <>
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
                        </>
                      )}
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
                      <div className="advanced-config">
                        <div className="advanced-config-header">
                          <strong>Perfil: {selectedLibraryProfile?.title ?? 'Objeto'}</strong>
                          <span>{selectedLibraryConfigSections.length} grupos exactos</span>
                        </div>
                        {selectedLibraryConfigSections.map((section, sectionIndex) => {
                          const fields = section.fields.filter((field) => !visibleQuickLibraryConfigKeys.has(field.key))
                          if (!fields.length) return null
                          return (
                            <details key={section.id} className="config-details" open={sectionIndex === 0 || section.id === 'paperStyle'}>
                              <summary>{section.title}</summary>
                              <div className="object-option-grid">{fields.map(renderLibraryConfigField)}</div>
                            </details>
                          )
                        })}
                      </div>
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
          <div className="panel-title paper-composer-title">
            <BookOpen size={18} />
            <h2>Paper Composer</h2>
          </div>
          <div className="paper-composer">
            <div className="paper-composer-head">
              <strong>Target</strong>
              <span>{paperComposer.displaySize}</span>
            </div>
            <label className="field">
              <span>Target paper</span>
              <select value={paperComposer.id} onChange={(event) => applyPaperTarget(event.target.value)}>
                {paperTargets.map((target) => (
                  <option key={target.id} value={target.id}>
                    {target.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="field-pair">
              <label className="field">
                <span>Ancho paper cm</span>
                <input
                  type="number"
                  min="1"
                  max="30"
                  step="0.1"
                  value={settings.paperWidthCm}
                  disabled={!paperComposer.hasFixedSize}
                  onChange={(event) => setSettings((state) => ({ ...state, paperWidthCm: event.target.value }))}
                />
              </label>
              <label className="field">
                <span>Alto paper cm</span>
                <input
                  type="number"
                  min="1"
                  max="30"
                  step="0.1"
                  value={settings.paperHeightCm}
                  disabled={!paperComposer.hasFixedSize}
                  onChange={(event) => setSettings((state) => ({ ...state, paperHeightCm: event.target.value }))}
                />
              </label>
            </div>
            <div className="field-pair">
              <label className="field">
                <span>Margen seguro cm</span>
                <input
                  type="number"
                  min="0"
                  max="3"
                  step="0.05"
                  value={settings.paperMarginCm}
                  disabled={!paperComposer.hasFixedSize}
                  onChange={(event) => setSettings((state) => ({ ...state, paperMarginCm: Number(event.target.value) }))}
                />
              </label>
              <label className="field">
                <span>Subfiguras</span>
                <select value={settings.subfigureLayout} onChange={(event) => setSettings((state) => ({ ...state, subfigureLayout: event.target.value }))}>
                  {subfigureLayouts.map((layout) => (
                    <option key={layout.id} value={layout.id}>
                      {layout.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="field">
              <span>Labels paneles</span>
              <input
                type="text"
                value={settings.subfigureLabels}
                onChange={(event) => setSettings((state) => ({ ...state, subfigureLabels: event.target.value }))}
                placeholder="(a), (b), (c), (d)"
              />
            </label>
            <div className="paper-wrapper-preview">
              <span>Wrapper preview</span>
              <code>{paperWrapperPreview.join('\n')}</code>
            </div>
            <label className="toggle export-toggle">
              <input
                type="checkbox"
                checked={settings.showPaperGuides}
                onChange={(event) => setSettings((state) => ({ ...state, showPaperGuides: event.target.checked }))}
              />
              <span>Mostrar guias paper</span>
            </label>
            <div className="paper-checklist">
              {paperChecklist.map((item) => (
                <span key={item.id} className={`paper-checklist-item is-${item.level}`}>
                  {item.text}
                </span>
              ))}
            </div>
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
          {figureWrapperControls.showWrapToggle && (
            <label className="toggle export-toggle">
              <input
                type="checkbox"
                checked={settings.wrapFigure}
                onChange={(event) => setSettings((state) => ({ ...state, wrapFigure: event.target.checked }))}
              />
              <span>Envolver en figure</span>
            </label>
          )}
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
          {figureWrapperControls.showMetadataFields && (
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
          <div className="panel-title code-output-title">
            <Code2 size={18} />
            <h2>Codigo TikZ</h2>
          </div>
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
