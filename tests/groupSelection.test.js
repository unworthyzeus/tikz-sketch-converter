import assert from 'node:assert/strict'
import test from 'node:test'
import { selectableGroupIds, toggleGroupedSelection } from '../src/groupSelection.js'

test('selectableGroupIds expands a grouped object to unlocked visible group members', () => {
  const elements = [
    { id: 'a', groupId: 'g1' },
    { id: 'b', groupId: 'g1' },
    { id: 'c', groupId: 'g1', hidden: true },
    { id: 'd', groupId: 'g1', locked: true },
    { id: 'e', groupId: 'g2' },
  ]

  assert.deepEqual(selectableGroupIds(elements, elements[0]), ['a', 'b'])
  assert.deepEqual(selectableGroupIds(elements, elements[4]), ['e'])
})

test('toggleGroupedSelection adds or removes a whole grouped selection together', () => {
  assert.deepEqual(toggleGroupedSelection(['solo'], ['a', 'b']), ['solo', 'a', 'b'])
  assert.deepEqual(toggleGroupedSelection(['solo', 'a', 'b'], ['a', 'b']), ['solo'])
})
