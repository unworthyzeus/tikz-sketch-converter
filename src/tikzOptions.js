export function splitTikzOptions(value = '') {
  const parts = []
  let current = ''
  let braceDepth = 0
  let bracketDepth = 0
  let parenDepth = 0
  let inMath = false
  let escaped = false

  for (const char of `${value ?? ''}`) {
    if (escaped) {
      current += char
      escaped = false
      continue
    }

    if (char === '\\') {
      current += char
      escaped = true
      continue
    }

    if (char === '$') {
      inMath = !inMath
      current += char
      continue
    }

    if (!inMath) {
      if (char === '{') braceDepth += 1
      if (char === '}') braceDepth = Math.max(0, braceDepth - 1)
      if (char === '[') bracketDepth += 1
      if (char === ']') bracketDepth = Math.max(0, bracketDepth - 1)
      if (char === '(') parenDepth += 1
      if (char === ')') parenDepth = Math.max(0, parenDepth - 1)
    }

    if (char === ',' && !inMath && braceDepth === 0 && bracketDepth === 0 && parenDepth === 0) {
      const option = current.trim()
      if (option) parts.push(option)
      current = ''
      continue
    }

    current += char
  }

  const option = current.trim()
  if (option) parts.push(option)
  return parts
}
