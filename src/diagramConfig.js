const defaultDiagramConfigs = {
  circuit: {
    sourceLabel: '$V_{in}$',
    resistorLabel: '$R$',
    capacitorLabel: '$C$',
    outputLabel: '$V_{out}$',
  },
  gantt: {
    taskRows: 'Data,0.2,1.9,0\nFeatures,1.5,3.1,1\nTraining,3,5,2\nEval,4.7,6.2,3',
  },
  ml: {
    blockLabels: 'Data, Clean, Features, Train, Metrics',
  },
  dl: {
    layerLabels: 'Input, Hidden, Latent, Output',
    layerCounts: '4,5,3,2',
  },
}

const diagramFallbackKind = 'ml'

export const diagramConfigFieldSpecs = {
  circuit: [
    { key: 'sourceLabel', label: 'Fuente', type: 'text', placeholder: '$V_{in}$' },
    { key: 'resistorLabel', label: 'Resistencia', type: 'text', placeholder: '$R$' },
    { key: 'capacitorLabel', label: 'Condensador', type: 'text', placeholder: '$C$' },
    { key: 'outputLabel', label: 'Salida', type: 'text', placeholder: '$V_{out}$' },
  ],
  gantt: [
    {
      key: 'taskRows',
      label: 'Barras Gantt',
      type: 'textarea',
      placeholder: 'Data,0.2,1.9,0\nFeatures,1.5,3.1,1\nTraining,3,5,2',
    },
  ],
  ml: [{ key: 'blockLabels', label: 'Labels pipeline', type: 'textarea', placeholder: 'Data, Clean, Features, Train, Metrics' }],
  dl: [
    { key: 'layerCounts', label: 'Nodos por capa', type: 'text', placeholder: '4,5,3,2' },
    { key: 'layerLabels', label: 'Labels capas', type: 'textarea', placeholder: 'Input, Hidden, Latent, Output' },
  ],
}

export function defaultDiagramConfigForKind(kind) {
  return { ...(defaultDiagramConfigs[kind] ?? defaultDiagramConfigs[diagramFallbackKind]) }
}

export function diagramConfigForElement(element) {
  const kind = element?.diagramKind ?? diagramFallbackKind
  return {
    ...defaultDiagramConfigForKind(kind),
    ...(element?.diagramConfig ?? {}),
  }
}

function splitDiagramList(value, fallback) {
  const parts = `${value ?? ''}`
    .split(/[\n,;]+/)
    .map((item) => item.trim())
    .filter(Boolean)
  if (parts.length) return parts
  return [...fallback]
}

function finiteNumber(value, fallback) {
  const next = Number(value)
  return Number.isFinite(next) ? next : fallback
}

function clampInteger(value, fallback, min, max) {
  const next = Math.round(finiteNumber(value, fallback))
  return Math.max(min, Math.min(max, next))
}

export function circuitLabelsForConfig(config) {
  const defaults = defaultDiagramConfigForKind('circuit')
  return {
    sourceLabel: `${config?.sourceLabel ?? defaults.sourceLabel}`.trim() || defaults.sourceLabel,
    resistorLabel: `${config?.resistorLabel ?? defaults.resistorLabel}`.trim() || defaults.resistorLabel,
    capacitorLabel: `${config?.capacitorLabel ?? defaults.capacitorLabel}`.trim() || defaults.capacitorLabel,
    outputLabel: `${config?.outputLabel ?? defaults.outputLabel}`.trim() || defaults.outputLabel,
  }
}

export function ganttTasksForConfig(config) {
  const source = `${config?.taskRows ?? defaultDiagramConfigForKind('gantt').taskRows}`
  const tasks = source
    .split(/\n+/)
    .map((line, index) => {
      const cells = line
        .split(',')
        .map((cell) => cell.trim())
        .filter(Boolean)
      if (cells.length < 3) return null

      const start = finiteNumber(cells[1], Number.NaN)
      const end = finiteNumber(cells[2], Number.NaN)
      if (!Number.isFinite(start) || !Number.isFinite(end)) return null

      const left = Math.min(start, end)
      const right = Math.max(start, end)
      return {
        label: cells[0] || `Task ${index + 1}`,
        start: left,
        end: right === left ? left + 0.5 : right,
        row: clampInteger(cells[3], index, 0, 24),
      }
    })
    .filter(Boolean)

  if (tasks.length) return tasks
  return ganttTasksForConfig(defaultDiagramConfigForKind('gantt'))
}

export function ganttMetricsForTasks(tasks) {
  const safeTasks = tasks.length ? tasks : ganttTasksForConfig(defaultDiagramConfigForKind('gantt'))
  const minStart = Math.min(0, ...safeTasks.map((task) => task.start))
  const maxEnd = Math.max(6.5, ...safeTasks.map((task) => task.end))
  const rowCount = Math.max(1, ...safeTasks.map((task) => task.row + 1))
  return {
    minStart,
    maxEnd,
    rowCount,
    width: Math.max(1, maxEnd - minStart),
    height: Math.max(2.75, 0.75 + rowCount * 0.58),
  }
}

export function mlStepsForConfig(config) {
  return splitDiagramList(config?.blockLabels, splitDiagramList(defaultDiagramConfigForKind('ml').blockLabels, ['Step']))
}

export function dlLayersForConfig(config) {
  const defaultLabels = splitDiagramList(defaultDiagramConfigForKind('dl').layerLabels, [])
  const defaultCounts = splitDiagramList(defaultDiagramConfigForKind('dl').layerCounts, []).map((count) => clampInteger(count, 1, 1, 12))
  const labels = splitDiagramList(config?.layerLabels, defaultLabels)
  const counts = splitDiagramList(config?.layerCounts, defaultCounts).map((count, index) => clampInteger(count, defaultCounts[index] ?? 1, 1, 12))
  const length = Math.max(1, labels.length, counts.length)

  return Array.from({ length }, (_, index) => ({
    label: labels[index] ?? `Layer ${index + 1}`,
    count: counts[index] ?? defaultCounts[index] ?? 1,
  }))
}
