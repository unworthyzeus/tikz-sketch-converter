function optionText(options = []) {
  return options.filter(Boolean).join(', ')
}

function matchingCommand(trimmed, commands) {
  return commands.find((command) => {
    if (!trimmed.startsWith(command)) return false
    const nextChar = trimmed.at(command.length) ?? ''
    return !/[A-Za-z@]/.test(nextChar)
  })
}

function optionCloseIndex(text, openIndex) {
  let braceDepth = 0
  let bracketDepth = 0
  let inMath = false
  let escaped = false
  for (let index = openIndex + 1; index < text.length; index += 1) {
    const char = text[index]

    if (escaped) {
      escaped = false
      continue
    }
    if (char === '\\') {
      escaped = true
      continue
    }
    if (char === '$') {
      inMath = !inMath
      continue
    }
    if (inMath) continue

    if (char === '{') braceDepth += 1
    if (char === '}') braceDepth = Math.max(0, braceDepth - 1)
    if (char === '[') bracketDepth += 1
    if (char === ']') {
      if (braceDepth === 0 && bracketDepth === 0) return index
      bracketDepth = Math.max(0, bracketDepth - 1)
    }
  }
  return -1
}

function injectIntoLine(line, optionString, commands) {
  const trimmed = line.trimStart()
  const prefix = line.slice(0, line.length - trimmed.length)
  const command = matchingCommand(trimmed, commands)
  if (!command) return line

  const afterCommand = trimmed.slice(command.length)
  if (afterCommand.startsWith('[')) {
    const closeIndex = optionCloseIndex(trimmed, command.length)
    if (closeIndex === -1) return line
    const beforeClose = trimmed.slice(0, closeIndex)
    const separator = beforeClose.endsWith('[') ? '' : ', '
    return `${prefix}${beforeClose}${separator}${optionString}${trimmed.slice(closeIndex)}`
  }

  return `${prefix}${command}[${optionString}]${afterCommand}`
}

export function injectTikzOptionsIntoLines(lines, options, commands) {
  const optionString = optionText(options)
  if (!optionString) return lines

  const nextLines = []
  let pendingMultiline = null

  lines.forEach((line) => {
    const trimmed = line.trimStart()
    const prefix = line.slice(0, line.length - trimmed.length)

    if (pendingMultiline && trimmed.startsWith(']')) {
      nextLines.push(`${prefix}  ${optionString},`)
      pendingMultiline = null
    }

    const command = matchingCommand(trimmed, commands)
    if (!command) {
      nextLines.push(line)
      return
    }

    const afterCommand = trimmed.slice(command.length)
    if (afterCommand.startsWith('[') && optionCloseIndex(trimmed, command.length) === -1) {
      pendingMultiline = command
      nextLines.push(line)
      return
    }

    nextLines.push(injectIntoLine(line, optionString, commands))
  })

  return nextLines
}
