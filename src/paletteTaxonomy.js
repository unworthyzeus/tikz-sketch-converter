const explicitDiagramGroups = new Set(['Automata', 'ER', 'Flow', 'Graph', 'Petri', 'Planning', 'Plots', 'Stats', 'UML'])

const explicitDiagramIds = new Set([
  'circuit-common-emitter',
  'circuit-differential-pair',
  'circuit-inverting-amplifier',
  'circuit-opamp-filter',
  'circuit-opamp-lowpass',
  'circuit-rlc-parallel',
  'circuit-rlc-series',
  'circuit-wheatstone',
  'commutative-square',
  'control-kalman-filter',
  'dl-attention-head',
  'dl-autoencoder',
  'dl-cnn-stack',
  'dl-gan',
  'dl-residual',
  'dl-rnn-cell',
  'dl-transformer',
  'dl-unet',
  'gantt-paper',
  'math-comm-triangle',
  'math-venn',
  'ml-confusion',
  'ml-pipeline',
  'ml-roc',
  'ml-training-curve',
  'paper-multi-panel',
  'rf-front-end',
  'telecom-channel',
  'telecom-5g-nr-frame',
  'telecom-adaptive-equalizer',
  'telecom-awgn-channel',
  'telecom-fec-chain',
  'telecom-feedback-loop',
  'telecom-ldpc-tanner',
  'telecom-link-budget',
  'telecom-link-budget-chain',
  'telecom-mimo-link',
  'telecom-mimo-rx',
  'telecom-mimo-tx',
  'telecom-mimo-ofdm-downlink',
  'telecom-matched-filter',
  'telecom-ofdm-pilot-estimator',
  'telecom-ofdm-receiver',
  'telecom-ofdm-resource-grid',
  'telecom-ofdm-transceiver',
  'telecom-ofdm-transmitter',
  'telecom-pll',
  'telecom-receiver-chain',
  'telecom-synchronization-loop',
  'telecom-superhet',
  'telecom-transmitter-chain',
])

function paletteHaystack(preset = {}) {
  const rawText = [
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

  return `${rawText} ${normalizePaletteSearch(rawText)}`
}

function normalizePaletteSearch(value = '') {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

export function paletteItemRole(preset = {}) {
  if (preset.paletteKind === 'object') return 'object'
  if (preset.paletteKind === 'diagram') return 'diagram'
  if (explicitDiagramIds.has(preset.id)) return 'diagram'
  if (explicitDiagramGroups.has(preset.group)) return 'diagram'

  return 'object'
}

export function objectPaletteItems(items = []) {
  return items.filter((item) => paletteItemRole(item) === 'object')
}

export function diagramPaletteItems(items = []) {
  return items.filter((item) => paletteItemRole(item) === 'diagram')
}

export function paletteGroupsFor(items = []) {
  return ['All', ...Array.from(new Set(items.map((preset) => preset.group))).sort()]
}

export function filterPaletteItems(items = [], { group = 'All', search = '' } = {}) {
  const query = search.trim().toLowerCase()
  const normalizedQuery = normalizePaletteSearch(search)

  return items.filter((preset) => {
    const matchesGroup = group === 'All' || preset.group === group
    const haystack = paletteHaystack(preset)
    const matchesSearch = !query || haystack.includes(query) || (normalizedQuery && haystack.includes(normalizedQuery))

    return matchesGroup && matchesSearch
  })
}
