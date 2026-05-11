import assert from 'node:assert/strict'
import test from 'node:test'
import { normalizeStoredBoardPayload, prependRecentBoard, safeReadJsonStorage } from '../src/boardPersistence.js'

test('safeReadJsonStorage returns parsed JSON and tolerates invalid storage data', () => {
  const storage = new Map([['board', '{"elements":[{"type":"line"}]}'], ['broken', '{']])
  const fakeStorage = {
    getItem: (key) => storage.get(key) ?? null,
  }

  assert.deepEqual(safeReadJsonStorage(fakeStorage, 'board'), { elements: [{ type: 'line' }] })
  assert.deepEqual(safeReadJsonStorage(fakeStorage, 'missing', []), [])
  assert.deepEqual(safeReadJsonStorage(fakeStorage, 'broken', { ok: false }), { ok: false })
})

test('normalizeStoredBoardPayload restores persisted editable board state', () => {
  const board = normalizeStoredBoardPayload(
    {
      elements: [{ type: 'line', id: 'a' }, null, { nope: true }],
      settings: { autosave: true },
      theme: 'dark',
      viewport: { zoom: 1.25 },
    },
    (element) => (element?.type ? { ...element, normalized: true } : null),
  )

  assert.deepEqual(board.elements, [{ type: 'line', id: 'a', normalized: true }])
  assert.deepEqual(board.settings, { autosave: true })
  assert.equal(board.theme, 'dark')
  assert.deepEqual(board.viewport, { zoom: 1.25 })
})

test('prependRecentBoard keeps the newest saved board visible first', () => {
  const recent = prependRecentBoard(
    [
      { name: 'Older', savedAt: '2026-05-10T10:00:00.000Z', count: 2 },
      { name: 'Oldest', savedAt: '2026-05-09T10:00:00.000Z', count: 1 },
    ],
    { name: 'Autosave', savedAt: '2026-05-11T10:00:00.000Z', count: 4 },
    2,
  )

  assert.deepEqual(recent, [
    { name: 'Autosave', savedAt: '2026-05-11T10:00:00.000Z', count: 4 },
    { name: 'Older', savedAt: '2026-05-10T10:00:00.000Z', count: 2 },
  ])
})
