import assert from 'node:assert/strict'
import test from 'node:test'
import { buildConnectivityNets, rotateNetlistPoints, rotatePointAround, segmentIntersection } from '../src/circuitNetlist.js'

test('buildConnectivityNets propagates nets through wire segments', () => {
  const terminals = [
    { elementId: 'r1', terminal: 'out', point: { x: 0, y: 0 } },
    { elementId: 'wire', terminal: '1', point: { x: 0, y: 0 } },
    { elementId: 'wire', terminal: '2', point: { x: 2, y: 0 } },
    { elementId: 'c1', terminal: 'in', point: { x: 2, y: 0 } },
  ]
  const wireSegments = [{ id: 'wire:s0', elementId: 'wire', start: { x: 0, y: 0 }, end: { x: 2, y: 0 } }]

  const { nets } = buildConnectivityNets({ terminals, wireSegments })

  assert.equal(nets.length, 1)
  assert.deepEqual(
    nets[0].terminals.map((terminal) => terminal.elementId).sort(),
    ['c1', 'r1', 'wire', 'wire'],
  )
})

test('buildConnectivityNets splits crossing wires and terminals on segment interiors', () => {
  const terminals = [
    { elementId: 'probe', terminal: 'tip', point: { x: 1, y: 0 } },
    { elementId: 'load', terminal: 'top', point: { x: 1, y: 1 } },
  ]
  const wireSegments = [
    { id: 'horizontal:s0', elementId: 'horizontal', start: { x: 0, y: 0 }, end: { x: 2, y: 0 } },
    { id: 'vertical:s0', elementId: 'vertical', start: { x: 1, y: -1 }, end: { x: 1, y: 1 } },
  ]

  const { junctions, nets } = buildConnectivityNets({ terminals, wireSegments })

  assert.equal(nets.length, 1)
  assert.deepEqual(
    nets[0].terminals.map((terminal) => terminal.elementId).sort(),
    ['load', 'probe'],
  )
  assert.equal(junctions.some((point) => point.x === 1 && point.y === 0), true)
})

test('buildConnectivityNets keeps separated wires in separate nets', () => {
  const terminals = [
    { elementId: 'left', terminal: '1', point: { x: 0, y: 0 } },
    { elementId: 'right', terminal: '1', point: { x: 3, y: 0 } },
  ]
  const wireSegments = [
    { id: 'left-wire:s0', elementId: 'left-wire', start: { x: 0, y: 0 }, end: { x: 1, y: 0 } },
    { id: 'right-wire:s0', elementId: 'right-wire', start: { x: 2, y: 0 }, end: { x: 3, y: 0 } },
  ]

  const { nets } = buildConnectivityNets({ terminals, wireSegments })

  assert.equal(nets.length, 0)
})

test('segmentIntersection reports endpoint intersections inside segment bounds', () => {
  assert.deepEqual(
    segmentIntersection({ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }),
    { x: 1, y: 0 },
  )
  assert.equal(segmentIntersection({ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 1 }, { x: 2, y: 2 }), null)
})

test('rotateNetlistPoints maps terminal geometry to the rendered rotation', () => {
  const center = { x: 1, y: 0 }
  const closePoint = (actual, expected) => {
    assert.ok(Math.abs(actual.x - expected.x) < 1e-9, `${actual.x} ~= ${expected.x}`)
    assert.ok(Math.abs(actual.y - expected.y) < 1e-9, `${actual.y} ~= ${expected.y}`)
  }

  closePoint(rotatePointAround({ x: 2, y: 0 }, center, 90), { x: 1, y: 1 })
  const [start, end] = rotateNetlistPoints([{ x: 0, y: 0 }, { x: 2, y: 0 }], center, 90)
  closePoint(start, { x: 1, y: -1 })
  closePoint(end, { x: 1, y: 1 })
})
