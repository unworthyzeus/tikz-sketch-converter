import assert from 'node:assert/strict'
import test from 'node:test'
import {
  libraryObjectProfileForPreset,
  libraryProfileDefaultConfig,
  libraryProfileFieldKeysForPreset,
  libraryProfileSectionSpecsForPreset,
} from '../src/libraryObjectProfiles.js'
import { libraryPaletteItems } from '../src/tikzPaletteItems.js'

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

test('profile sections keep exact controls first without duplicating common object fields', () => {
  libraryPaletteItems.forEach((item) => {
    const keys = fieldKeys(item.id)
    assert.deepEqual([...new Set(keys)], keys, item.id)
  })
})
