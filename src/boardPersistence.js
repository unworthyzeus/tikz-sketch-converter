export function safeReadJsonStorage(storage, key, fallback = null) {
  if (!storage || !key) return fallback

  try {
    const raw = storage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function normalizeStoredBoardPayload(payload, normalizeElement = (element) => element) {
  if (!payload || typeof payload !== 'object') return null

  const rawElements = Array.isArray(payload) ? payload : payload.elements
  if (!Array.isArray(rawElements)) return null

  const elements = rawElements.map(normalizeElement).filter(Boolean)
  if (!elements.length) return null

  return {
    elements,
    settings: payload.settings && typeof payload.settings === 'object' ? payload.settings : null,
    theme: payload.theme === 'dark' || payload.theme === 'light' ? payload.theme : 'light',
    viewport: payload.viewport && typeof payload.viewport === 'object' ? payload.viewport : null,
  }
}

export function prependRecentBoard(recentBoards, board, limit = 5) {
  const current = Array.isArray(recentBoards) ? recentBoards : []
  const entry = {
    name: board?.name || 'Autosave',
    savedAt: board?.savedAt || new Date().toISOString(),
    count: Number.isFinite(Number(board?.count)) ? Number(board.count) : 0,
  }

  return [
    entry,
    ...current
      .filter((item) => item && typeof item === 'object')
      .map((item) => ({
        name: item.name || 'Autosave',
        savedAt: item.savedAt || '',
        count: Number.isFinite(Number(item.count)) ? Number(item.count) : 0,
      })),
  ].slice(0, Math.max(1, limit))
}
