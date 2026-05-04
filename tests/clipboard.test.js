import assert from 'node:assert/strict'
import test from 'node:test'
import { writeClipboardText } from '../src/clipboard.js'

test('writeClipboardText uses navigator.clipboard when available', async () => {
  const writes = []
  const ok = await writeClipboardText('TikZ code', {
    navigator: {
      clipboard: {
        writeText: async (value) => writes.push(value),
      },
    },
  })

  assert.equal(ok, true)
  assert.deepEqual(writes, ['TikZ code'])
})

test('writeClipboardText falls back to a temporary textarea when clipboard permission fails', async () => {
  const removed = []
  const textarea = {
    style: {},
    setAttribute() {},
    selectCalled: false,
    range: null,
    select() {
      this.selectCalled = true
    },
    setSelectionRange(start, end) {
      this.range = [start, end]
    },
  }
  const environment = {
    navigator: {
      clipboard: {
        writeText: async () => {
          throw new Error('denied')
        },
      },
    },
    document: {
      createElement: (tagName) => {
        assert.equal(tagName, 'textarea')
        return textarea
      },
      body: {
        appendChild: (node) => {
          assert.equal(node, textarea)
        },
        removeChild: (node) => removed.push(node),
      },
      execCommand: (command) => command === 'copy',
    },
  }

  const ok = await writeClipboardText('URL compartida', environment)

  assert.equal(ok, true)
  assert.equal(textarea.value, 'URL compartida')
  assert.equal(textarea.selectCalled, true)
  assert.deepEqual(textarea.range, [0, 'URL compartida'.length])
  assert.deepEqual(removed, [textarea])
})

test('writeClipboardText reports false when no copy mechanism succeeds', async () => {
  const ok = await writeClipboardText(null, {
    document: {
      createElement: () => ({ style: {}, setAttribute() {}, select() {} }),
      body: {
        appendChild() {},
        removeChild() {},
      },
      execCommand: () => false,
    },
  })

  assert.equal(ok, false)
})
