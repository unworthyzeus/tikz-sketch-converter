import assert from 'node:assert/strict'
import test from 'node:test'
import { createEditorKeydownHandler, isEditableShortcutTarget } from '../src/editorKeyboard.js'

function keyboardEvent(overrides = {}) {
  const event = {
    key: 'v',
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    target: { tagName: 'BODY' },
    prevented: false,
    preventDefault() {
      this.prevented = true
    },
    ...overrides,
  }
  return event
}

test('editor keyboard handler reads the latest action ref instead of stale closures', () => {
  const calls = []
  const actionsRef = {
    current: {
      copySelection: () => calls.push('old-copy'),
    },
  }
  const handler = createEditorKeydownHandler(actionsRef)
  actionsRef.current = {
    copySelection: () => calls.push('new-copy'),
  }

  const event = keyboardEvent({ key: 'c', ctrlKey: true })
  handler(event)

  assert.equal(event.prevented, true)
  assert.deepEqual(calls, ['new-copy'])
})

test('editor keyboard handler ignores form and editable targets', () => {
  assert.equal(isEditableShortcutTarget({ tagName: 'INPUT' }), true)
  assert.equal(isEditableShortcutTarget({ tagName: 'textarea' }), true)
  assert.equal(isEditableShortcutTarget({ tagName: 'SELECT' }), true)
  assert.equal(isEditableShortcutTarget({ tagName: 'DIV', isContentEditable: true }), true)
  assert.equal(isEditableShortcutTarget({ tagName: 'BUTTON' }), false)

  const calls = []
  const handler = createEditorKeydownHandler({
    current: {
      setTool: (tool) => calls.push(tool),
    },
  })
  const event = keyboardEvent({ target: { tagName: 'INPUT' } })
  handler(event)

  assert.equal(event.prevented, false)
  assert.deepEqual(calls, [])
})

test('editor keyboard handler maps command and tool shortcuts', () => {
  const calls = []
  const handler = createEditorKeydownHandler({
    current: {
      undo: () => calls.push('undo'),
      redo: () => calls.push('redo'),
      pasteSelection: () => calls.push('paste'),
      duplicateSelection: () => calls.push('duplicate'),
      downloadTikz: () => calls.push('download'),
      deleteSelected: () => calls.push('delete'),
      setTool: (tool) => calls.push(`tool:${tool}`),
      toggleSnap: () => calls.push('snap'),
      toggleTerminalSnap: () => calls.push('terminal-snap'),
      zoomIn: () => calls.push('zoom-in'),
      zoomOut: () => calls.push('zoom-out'),
    },
  })

  ;[
    keyboardEvent({ key: 'z', ctrlKey: true }),
    keyboardEvent({ key: 'z', ctrlKey: true, shiftKey: true }),
    keyboardEvent({ key: 'v', metaKey: true }),
    keyboardEvent({ key: 'd', ctrlKey: true }),
    keyboardEvent({ key: 'e', ctrlKey: true }),
    keyboardEvent({ key: 'Delete' }),
    keyboardEvent({ key: 'h' }),
    keyboardEvent({ key: 'g' }),
    keyboardEvent({ key: 't' }),
    keyboardEvent({ key: '+' }),
    keyboardEvent({ key: '-' }),
  ].forEach(handler)

  assert.deepEqual(calls, [
    'undo',
    'redo',
    'paste',
    'duplicate',
    'download',
    'delete',
    'tool:pan',
    'snap',
    'terminal-snap',
    'zoom-in',
    'zoom-out',
  ])
})

test('editor keyboard handler closes modals with Escape even when focus is inside a field', () => {
  const calls = []
  const handler = createEditorKeydownHandler({
    current: {
      closeModal: () => calls.push('close-modal'),
      setTool: (tool) => calls.push(`tool:${tool}`),
    },
  })
  const event = keyboardEvent({ key: 'Escape', target: { tagName: 'INPUT' } })

  handler(event)

  assert.equal(event.prevented, true)
  assert.deepEqual(calls, ['close-modal'])
})
