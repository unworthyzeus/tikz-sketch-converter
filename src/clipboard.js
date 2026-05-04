export async function writeClipboardText(value, environment = globalThis) {
  const text = `${value ?? ''}`
  const clipboard = environment.navigator?.clipboard

  if (typeof clipboard?.writeText === 'function') {
    try {
      await clipboard.writeText(text)
      return true
    } catch {
      // Fall through to the legacy textarea path; browsers can deny clipboard writes.
    }
  }

  const documentRef = environment.document
  if (
    !documentRef ||
    typeof documentRef.createElement !== 'function' ||
    typeof documentRef.execCommand !== 'function' ||
    !documentRef.body
  ) {
    return false
  }

  const textarea = documentRef.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.left = '-9999px'
  textarea.style.top = '0'
  textarea.style.opacity = '0'

  documentRef.body.appendChild(textarea)
  textarea.select()
  textarea.setSelectionRange?.(0, text.length)

  try {
    return Boolean(documentRef.execCommand('copy'))
  } catch {
    return false
  } finally {
    documentRef.body.removeChild(textarea)
  }
}
