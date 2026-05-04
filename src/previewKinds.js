const genericPreviewNames = new Set([
  'automata',
  'circuit',
  'cube',
  'decorations',
  'fills',
  'flow',
  'gantt',
  'gate',
  'geometry',
  'matrix',
  'mindmap',
  'network',
  'plot',
  'shapes',
  'source',
  'spy',
  'tree',
])

export function circuitPreviewKindForPreset(preset = {}) {
  const group = (preset.group ?? '').toLowerCase()
  const preview = preset.preview ?? ''
  const id = preset.id ?? ''
  const isCircuitish = group.includes('circuit') || id.startsWith('circuit-') || preview === 'circuit' || preview === 'source'
  if (!isCircuitish) return ''
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
  return preview === 'circuit' ? 'circuit-branch' : ''
}

export function previewKindForPreset(preset = {}) {
  const circuitKind = circuitPreviewKindForPreset(preset)
  if (circuitKind) return circuitKind
  if (genericPreviewNames.has(preset.preview)) {
    const semanticId = preset.id || preset.preview
    return semanticId === preset.preview ? `${semanticId}-diagram` : semanticId
  }
  return preset.preview || preset.id || 'generic'
}

export function unresolvedGenericPreviewIds(items) {
  return items
    .filter((item) => genericPreviewNames.has(item.preview))
    .filter((item) => genericPreviewNames.has(previewKindForPreset(item)))
    .map((item) => item.id)
}
