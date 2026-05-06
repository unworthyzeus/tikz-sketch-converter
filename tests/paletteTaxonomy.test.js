import assert from 'node:assert/strict'
import test from 'node:test'
import {
  diagramPaletteItems,
  filterPaletteItems,
  objectPaletteItems,
  paletteGroupsFor,
  paletteItemRole,
} from '../src/paletteTaxonomy.js'
import { libraryPaletteItems } from '../src/tikzPaletteItems.js'

function byId(id) {
  return libraryPaletteItems.find((item) => item.id === id)
}

test('palette taxonomy separates reusable diagrams from atomic TikZ objects', () => {
  const diagramIds = diagramPaletteItems(libraryPaletteItems).map((item) => item.id)
  const objectIds = objectPaletteItems(libraryPaletteItems).map((item) => item.id)

  ;[
    'telecom-ofdm-transmitter',
    'telecom-ofdm-receiver',
    'telecom-ofdm-transceiver',
    'telecom-5g-nr-frame',
    'telecom-mimo-ofdm-downlink',
    'telecom-fec-chain',
    'telecom-link-budget-chain',
    'telecom-synchronization-loop',
    'telecom-mimo-link',
    'telecom-ldpc-tanner',
    'telecom-transmitter-chain',
    'telecom-receiver-chain',
    'telecom-channel',
    'rf-front-end',
    'telecom-pll',
    'telecom-superhet',
    'telecom-feedback-loop',
    'control-kalman-filter',
    'circuit-inverting-amplifier',
    'circuit-common-emitter',
  ].forEach((id) => {
    assert.equal(paletteItemRole(byId(id)), 'diagram', id)
    assert.equal(diagramIds.includes(id), true, id)
    assert.equal(objectIds.includes(id), false, id)
  })

  ;[
    'circuit-resistor',
    'logic-and-gate',
    'shape-process',
    'angle-marker',
    'telecom-antenna',
    'telecom-mixer',
    'telecom-adc',
    'telecom-dac',
    'telecom-sampler',
    'telecom-summer',
    'telecom-local-oscillator',
    'rf-amplifier',
  ].forEach((id) => {
    assert.equal(paletteItemRole(byId(id)), 'object', id)
    assert.equal(objectIds.includes(id), true, id)
    assert.equal(diagramIds.includes(id), false, id)
  })

  libraryPaletteItems.forEach((item) => {
    assert.match(item.paletteKind, /^(object|diagram)$/, item.id)
    assert.equal(item.paletteKind, paletteItemRole(item), item.id)
  })
})

test('object filters search only atomic objects while diagram filters search common diagrams', () => {
  const objects = objectPaletteItems(libraryPaletteItems)
  const diagrams = diagramPaletteItems(libraryPaletteItems)

  assert.deepEqual(
    filterPaletteItems(objects, { search: 'Kalman' }).map((item) => item.id),
    [],
  )
  assert.deepEqual(
    filterPaletteItems(diagrams, { search: 'Kalman' }).map((item) => item.id),
    ['control-kalman-filter'],
  )

  assert.equal(filterPaletteItems(objects, { group: 'Telecom', search: 'mixer' }).some((item) => item.id === 'telecom-mixer'), true)
  assert.equal(filterPaletteItems(objects, { group: 'Telecom', search: 'ADC' }).some((item) => item.id === 'telecom-adc'), true)
  assert.equal(filterPaletteItems(objects, { group: 'Telecom', search: 'OFDM receiver' }).length, 0)
  assert.equal(filterPaletteItems(objects, { group: 'Telecom', search: 'front end' }).length, 0)
  assert.equal(filterPaletteItems(diagrams, { group: 'Telecom', search: 'OFDM receiver' }).some((item) => item.id === 'telecom-ofdm-receiver'), true)
  assert.equal(filterPaletteItems(diagrams, { group: 'Telecom', search: 'front end' }).some((item) => item.id === 'rf-front-end'), true)

  assert.equal(paletteGroupsFor(objects).includes('Control'), false)
  assert.equal(paletteGroupsFor(objects).includes('Plots'), false)
  assert.equal(paletteGroupsFor(diagrams).includes('Control'), true)
})
