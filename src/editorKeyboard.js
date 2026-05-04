export function isEditableShortcutTarget(target) {
  if (!target || typeof target !== 'object') return false
  if (target.isContentEditable) return true

  const tagName = typeof target.tagName === 'string' ? target.tagName.toLowerCase() : ''
  return tagName === 'input' || tagName === 'textarea' || tagName === 'select'
}

export function createEditorKeydownHandler(actionsRef, options = {}) {
  const isEditableTarget = options.isEditableTarget ?? isEditableShortcutTarget

  return (event) => {
    const actions = actionsRef.current ?? {}
    const key = event.key.toLowerCase()
    const modifier = event.ctrlKey || event.metaKey

    if (key === 'escape' && actions.closeModal) {
      event.preventDefault()
      actions.closeModal()
      return
    }

    if (isEditableTarget(event.target)) return

    if (modifier && key === 'z') {
      event.preventDefault()
      if (event.shiftKey) actions.redo?.()
      else actions.undo?.()
    } else if (modifier && key === 'y') {
      event.preventDefault()
      actions.redo?.()
    } else if (modifier && key === 'c') {
      event.preventDefault()
      actions.copySelection?.()
    } else if (modifier && key === 'v') {
      event.preventDefault()
      actions.pasteSelection?.()
    } else if (modifier && key === 'd') {
      event.preventDefault()
      actions.duplicateSelection?.()
    } else if (modifier && key === 'e') {
      event.preventDefault()
      actions.downloadTikz?.()
    } else if (key === 'delete' || key === 'backspace') {
      event.preventDefault()
      actions.deleteSelected?.()
    } else if (key === 'v') {
      actions.setTool?.('select')
    } else if (key === 'h') {
      actions.setTool?.('pan')
    } else if (key === 'l') {
      actions.setTool?.('line')
    } else if (key === 'a') {
      actions.setTool?.('arrow')
    } else if (key === 'p') {
      actions.setTool?.('pen')
    } else if (key === 'g') {
      actions.toggleSnap?.()
    } else if (key === 't') {
      actions.toggleTerminalSnap?.()
    } else if (key === '+') {
      actions.zoomIn?.()
    } else if (key === '-') {
      actions.zoomOut?.()
    }
  }
}
