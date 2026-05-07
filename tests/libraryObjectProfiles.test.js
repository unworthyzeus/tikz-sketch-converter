import assert from 'node:assert/strict'
import test from 'node:test'
import {
  libraryObjectProfileForPreset,
  libraryProfileDefaultConfig,
  libraryProfileFieldKeysForPreset,
  libraryProfileSectionSpecsForPreset,
} from '../src/libraryObjectProfiles.js'
import { diagramPaletteItems } from '../src/paletteTaxonomy.js'
import { libraryPaletteItems } from '../src/tikzPaletteItems.js'
import { modularDiagramKindForPreset, semanticDiagramFieldsForPreset } from '../src/librarySnippetConfig.js'

function preset(id) {
  return libraryPaletteItems.find((item) => item.id === id)
}

function fieldKeys(id) {
  return libraryProfileSectionSpecsForPreset(preset(id)).flatMap((section) => section.fields)
}

function assertCommonObjectControls(keys) {
  ;['lineCap', 'drawOpacity', 'dashPattern', 'fontSize', 'referenceName', 'metadataJson'].forEach((key) => {
    assert.equal(keys.includes(key), true, `missing ${key}`)
  })
}

const plotAxisLimitFields = ['xmin', 'xmax', 'ymin', 'ymax']
const plotAxisStyleFields = [
  'xLabelStyle',
  'yLabelStyle',
  'tickLabelStyle',
  'legendStyle',
  'axisLineStyle',
  'gridLineStyle',
  'enlargeLimits',
]

test('BER plots expose an exact semilog communications profile', () => {
  assert.equal(libraryObjectProfileForPreset(preset('plot-ber')).id, 'plotBer')
  const keys = fieldKeys('plot-ber')
  assert.deepEqual(keys.slice(0, 27), [
    'axisWidth',
    'axisHeight',
    'xMode',
    'yMode',
    'gridMode',
    ...plotAxisLimitFields,
    'minorTicks',
    'xlabel',
    'ylabel',
    'plotTitle',
    'legendPos',
    'legendColumns',
    ...plotAxisStyleFields,
    'markStyle',
    'plotSmooth',
    'plotDomain',
    'samples',
    'addplotExtraOptions',
  ])
  assertCommonObjectControls(keys)
  assert.equal(libraryProfileFieldKeysForPreset(preset('plot-ber')).has('terminalStyle'), false)
  assert.equal(libraryProfileDefaultConfig(preset('plot-ber')).yMode, 'log')
  assert.equal(libraryProfileDefaultConfig(preset('plot-ber')).gridMode, 'major')
})

test('constellation and spectrogram plots expose different plot-specific controls', () => {
  assert.equal(libraryObjectProfileForPreset(preset('plot-constellation')).id, 'plotConstellation')
  assert.equal(libraryProfileDefaultConfig(preset('plot-constellation')).axisEqual, true)
  assert.equal(fieldKeys('plot-constellation').includes('colorbar'), false)
  assert.equal(fieldKeys('plot-constellation').includes('markStyle'), true)
  assert.equal(fieldKeys('plot-constellation').includes('tickLabelStyle'), true)

  assert.equal(libraryObjectProfileForPreset(preset('plot-spectrogram')).id, 'plotSpectrogram')
  assert.equal(libraryProfileDefaultConfig(preset('plot-spectrogram')).colorbar, true)
  assert.equal(fieldKeys('plot-spectrogram').includes('shader'), true)
  assert.equal(fieldKeys('plot-spectrogram').includes('markStyle'), false)
})

test('bar chart and gantt diagrams expose semantic bar editors', () => {
  assert.equal(libraryObjectProfileForPreset(preset('plot-bar')).id, 'plotBar')
  assert.deepEqual(fieldKeys('plot-bar').slice(0, 11), [
    'barCount',
    'barData',
    'axisWidth',
    'axisHeight',
    'gridMode',
    'ymin',
    'ymax',
    'xlabel',
    'ylabel',
    'plotTitle',
    'axisExtraOptions',
  ])
  assert.equal(libraryProfileDefaultConfig(preset('plot-bar')).barCount, 3)
  assert.match(libraryProfileDefaultConfig(preset('plot-bar')).barData, /A,2/)

  assert.equal(libraryObjectProfileForPreset(preset('gantt-paper')).id, 'ganttTimeline')
  assert.deepEqual(fieldKeys('gantt-paper').slice(0, 7), [
    'barCount',
    'ganttStart',
    'ganttEnd',
    'ganttProgress',
    'plotTitle',
    'ganttTasks',
    'datasetTag',
  ])
  assert.equal(libraryProfileDefaultConfig(preset('gantt-paper')).barCount, 3)
  assert.match(libraryProfileDefaultConfig(preset('gantt-paper')).ganttTasks, /prep,1,2/)
})

test('every common diagram exposes at least one diagram-specific semantic editor', () => {
  const semanticKeys = new Set([
    'barCount',
    'barData',
    'ganttStart',
    'ganttEnd',
    'ganttProgress',
    'ganttTasks',
    'blockLabels',
    'nodeLabels',
    'edgeLabels',
    'matrixEntries',
    'dataTable',
    'inputLabel',
    'outputLabel',
    'componentLabels',
    'circuitLabel',
    'circuitValue',
    'terminalNames',
    'channelLabel',
    'noiseLabel',
    'signalLabel',
    'carrierLabel',
    'modulation',
    'branchCount',
    'xlabel',
    'ylabel',
    'plotDomain',
    'samples',
  ])
  const missing = diagramPaletteItems(libraryPaletteItems)
    .map((item) => ({
      id: item.id,
      profileId: libraryObjectProfileForPreset(item).id,
      semanticFields: [...libraryProfileFieldKeysForPreset(item)].filter((key) => semanticKeys.has(key)),
    }))
    .filter((entry) => entry.semanticFields.length === 0)
    .map(({ id, profileId }) => `${id}:${profileId}`)

  assert.deepEqual(missing, [])
})

test('plot diagram profiles expose editable data sources when that makes sense', () => {
  const missing = diagramPaletteItems(libraryPaletteItems)
    .filter((item) => item.preview === 'plot' && item.id !== 'plot-bar')
    .filter((item) => !libraryProfileFieldKeysForPreset(item).has('dataTable'))
    .map((item) => item.id)

  assert.deepEqual(missing, [])
})

test('modular diagram semantic fields are exposed by their editing profile', () => {
  const missing = diagramPaletteItems(libraryPaletteItems)
    .filter((item) => modularDiagramKindForPreset(item))
    .map((item) => ({
      id: item.id,
      missingFields: semanticDiagramFieldsForPreset(item).filter((field) => !libraryProfileFieldKeysForPreset(item).has(field)),
    }))
    .filter((entry) => entry.missingFields.length)

  assert.deepEqual(missing, [])
})

test('non-plot non-circuit common diagrams have a modular generation path', () => {
  const missing = diagramPaletteItems(libraryPaletteItems)
    .filter((item) => {
      const group = `${item.group ?? ''}`.toLowerCase()
      const preview = `${item.preview ?? ''}`.toLowerCase()
      const id = `${item.id ?? ''}`.toLowerCase()
      return (
        group !== 'plots' &&
        group !== 'stats' &&
        group !== 'circuit' &&
        group !== 'planning' &&
        preview !== 'plot' &&
        !id.includes('gantt')
      )
    })
    .filter((item) => !modularDiagramKindForPreset(item))
    .map((item) => item.id)

  assert.deepEqual(missing, [])
})

test('composite circuits expose circuit labels instead of generic plot controls', () => {
  assert.equal(libraryObjectProfileForPreset(preset('circuit-inverting-amplifier')).id, 'opampComposite')
  const keys = fieldKeys('circuit-inverting-amplifier')
  assert.deepEqual(keys.slice(0, 10), [
    'inputLabel',
    'outputLabel',
    'feedbackLabel',
    'componentLabels',
    'supplyLabel',
    'groundLabel',
    'circuitStyle',
    'terminalNames',
    'netName',
    'referenceName',
  ])
  assertCommonObjectControls(keys)
  assert.equal(libraryProfileFieldKeysForPreset(preset('circuit-inverting-amplifier')).has('colormap'), false)
})

test('telecom signal chains and RF blocks have different exact controls', () => {
  assert.equal(libraryObjectProfileForPreset(preset('telecom-ofdm-pilot-estimator')).id, 'telecomOfdm')
  assert.deepEqual(fieldKeys('telecom-ofdm-pilot-estimator').slice(0, 8), [
    'inputLabel',
    'outputLabel',
    'blockLabels',
    'signalLabel',
    'carrierLabel',
    'modulation',
    'symbolCount',
    'subcarrierCount',
  ])
  assert.deepEqual(fieldKeys('telecom-ofdm-pilot-estimator').slice(8, 11), [
    'pilotSpacing',
    'branchCount',
    'noiseLabel',
  ])

  assert.equal(libraryObjectProfileForPreset(preset('telecom-awgn-channel')).id, 'telecomChannel')
  assert.deepEqual(fieldKeys('telecom-awgn-channel').slice(0, 8), [
    'inputLabel',
    'outputLabel',
    'channelLabel',
    'noiseLabel',
    'snrLabel',
    'modulation',
    'carrierLabel',
    'gainDb',
  ])

  assert.equal(libraryObjectProfileForPreset(preset('rf-front-end')).id, 'rfChain')
  assert.deepEqual(fieldKeys('rf-front-end').slice(0, 7), [
    'inputLabel',
    'outputLabel',
    'blockLabels',
    'carrierLabel',
    'gainDb',
    'noiseLabel',
    'terminalNames',
  ])
})

test('more telecom diagrams expose chain, loop and antenna-specific editors', () => {
  assert.equal(libraryObjectProfileForPreset(preset('telecom-ofdm-transceiver')).id, 'telecomOfdm')
  assert.equal(fieldKeys('telecom-ofdm-transceiver').includes('symbolCount'), true)
  assert.equal(fieldKeys('telecom-ofdm-transceiver').includes('pilotSpacing'), true)

  assert.equal(libraryObjectProfileForPreset(preset('telecom-fec-chain')).id, 'fecChain')
  assert.deepEqual(fieldKeys('telecom-fec-chain').slice(0, 8), [
    'inputLabel',
    'outputLabel',
    'blockLabels',
    'signalLabel',
    'modulation',
    'branchCount',
    'noiseLabel',
    'datasetTag',
  ])

  assert.equal(libraryObjectProfileForPreset(preset('telecom-synchronization-loop')).id, 'feedbackLoop')
  assert.deepEqual(fieldKeys('telecom-synchronization-loop').slice(0, 9), [
    'inputLabel',
    'outputLabel',
    'feedbackLabel',
    'blockLabels',
    'edgeLabels',
    'signalLabel',
    'carrierLabel',
    'nodeDistance',
    'referenceName',
  ])

  assert.equal(libraryObjectProfileForPreset(preset('telecom-mimo-link')).id, 'telecomMimo')
  assert.equal(fieldKeys('telecom-mimo-link').includes('antennaCount'), true)
})

test('specialized matrix and telecom diagrams expose purpose-built modular controls', () => {
  assert.equal(libraryObjectProfileForPreset(preset('ml-confusion')).id, 'confusionMatrix')
  assert.deepEqual(fieldKeys('ml-confusion').slice(0, 5), [
    'classLabels',
    'matrixEntries',
    'inputLabel',
    'outputLabel',
    'datasetTag',
  ])

  assert.equal(libraryObjectProfileForPreset(preset('telecom-ofdm-resource-grid')).id, 'telecomResourceGrid')
  assert.deepEqual(fieldKeys('telecom-ofdm-resource-grid').slice(0, 7), [
    'symbolCount',
    'subcarrierCount',
    'pilotSpacing',
    'blockLabels',
    'inputLabel',
    'outputLabel',
    'datasetTag',
  ])

  assert.equal(libraryObjectProfileForPreset(preset('telecom-5g-nr-frame')).id, 'telecomResourceGrid')
  assert.equal(libraryObjectProfileForPreset(preset('telecom-ldpc-tanner')).id, 'tannerGraph')
  assert.deepEqual(fieldKeys('telecom-ldpc-tanner').slice(0, 6), [
    'variableCount',
    'checkCount',
    'edgeLabels',
    'nodeLabels',
    'blockLabels',
    'datasetTag',
  ])

  assert.equal(libraryObjectProfileForPreset(preset('telecom-mimo-ofdm-downlink')).id, 'mimoOfdmDiagram')
  assert.equal(fieldKeys('telecom-mimo-ofdm-downlink').includes('antennaCount'), true)
  assert.equal(fieldKeys('telecom-mimo-ofdm-downlink').includes('channelLabel'), true)

  assert.equal(libraryObjectProfileForPreset(preset('telecom-link-budget')).id, 'linkBudgetTable')
  assert.deepEqual(fieldKeys('telecom-link-budget').slice(0, 5), [
    'budgetRows',
    'inputLabel',
    'outputLabel',
    'gainDb',
    'datasetTag',
  ])
})

test('profile sections keep exact controls first without duplicating common object fields', () => {
  libraryPaletteItems.forEach((item) => {
    const keys = fieldKeys(item.id)
    assert.deepEqual([...new Set(keys)], keys, item.id)
  })
})
