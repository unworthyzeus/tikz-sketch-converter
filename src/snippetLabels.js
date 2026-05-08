const optionLabelKeys = ['xlabel', 'ylabel', 'zlabel', 'title', 'label', 'info', 'l_', 'l', 'a_', 'a', 'v', 'i']
const axisOptionKeys = ['xlabel', 'ylabel', 'zlabel', 'title']
const commandLabelNames = ['ganttbar', 'ganttgroup', 'ganttmilestone', 'gantttitle']

function findMatchingBrace(text, openIndex) {
  let depth = 0
  for (let index = openIndex; index < text.length; index += 1) {
    const char = text[index]
    if (char === '\\') {
      index += 1
      continue
    }
    if (char === '{') depth += 1
    if (char === '}') {
      depth -= 1
      if (depth === 0) return index
    }
  }
  return -1
}

function findValueEnd(text, start) {
  let inMath = false
  for (let index = start; index < text.length; index += 1) {
    const char = text[index]
    if (char === '\\') {
      index += 1
      continue
    }
    if (char === '$') inMath = !inMath
    if (!inMath && (char === ',' || char === ']' || char === '}')) return index
  }
  return text.length
}

function pushLabel(labels, lineIndex, start, end, kind) {
  if (end <= start) return
  const text = labels.sourceLines[lineIndex].slice(start, end).trim()
  if (!text || /^__[^_]+__$/.test(text)) return
  const leading = labels.sourceLines[lineIndex].slice(start, end).match(/^\s*/)?.[0].length ?? 0
  const trailing = labels.sourceLines[lineIndex].slice(start, end).match(/\s*$/)?.[0].length ?? 0
  labels.items.push({
    lineIndex,
    start: start + leading,
    end: end - trailing,
    text,
    kind,
  })
}

function extractBalancedValue(labels, lineIndex, valueStart, kind) {
  const line = labels.sourceLines[lineIndex]
  let start = valueStart
  while (line[start] === ' ') start += 1

  if (line[start] === '{') {
    const end = findMatchingBrace(line, start)
    if (end > start) pushLabel(labels, lineIndex, start + 1, end, kind)
    return
  }

  if (line[start] === '"') {
    const end = line.indexOf('"', start + 1)
    if (end > start) pushLabel(labels, lineIndex, start + 1, end, kind)
    return
  }

  const end = findValueEnd(line, start)
  pushLabel(labels, lineIndex, start, end, kind)
}

function extractOptionLabels(labels, lineIndex, keys, kind) {
  const line = labels.sourceLines[lineIndex]
  const keyPattern = keys.map((key) => key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')
  const pattern = new RegExp(`(^|[\\s\\[,{])(${keyPattern})\\s*=\\s*`, 'g')
  let match = pattern.exec(line)
  while (match) {
    const keyStart = match.index + match[1].length
    const beforeKey = line.slice(Math.max(0, keyStart - 12), keyStart).toLowerCase()
    if (!beforeKey.includes('tick ') && !beforeKey.includes('legend ')) {
      extractBalancedValue(labels, lineIndex, pattern.lastIndex, kind)
    }
    match = pattern.exec(line)
  }
}

function extractNodeLabels(labels, lineIndex) {
  const line = labels.sourceLines[lineIndex]
  const pattern = /(^|[^A-Za-z\\])(\\node|node)(?=\s|\[)/g
  let match = pattern.exec(line)
  while (match) {
    const searchStart = pattern.lastIndex
    const semicolon = line.indexOf(';', searchStart)
    const brace = line.indexOf('{', searchStart)
    if (brace >= 0 && (semicolon < 0 || brace < semicolon)) {
      const end = findMatchingBrace(line, brace)
      if (end > brace) pushLabel(labels, lineIndex, brace + 1, end, 'node')
      pattern.lastIndex = end > brace ? end : searchStart
    }
    match = pattern.exec(line)
  }
}

function extractCommandLabels(labels, lineIndex) {
  const line = labels.sourceLines[lineIndex]
  commandLabelNames.forEach((command) => {
    const pattern = new RegExp(`\\\\${command}\\s*\\{`, 'g')
    let match = pattern.exec(line)
    while (match) {
      const openIndex = pattern.lastIndex - 1
      const end = findMatchingBrace(line, openIndex)
      if (end > openIndex) pushLabel(labels, lineIndex, openIndex + 1, end, command)
      match = pattern.exec(line)
    }
  })
}

function splitTopLevelRanges(text, offset) {
  const ranges = []
  let depth = 0
  let start = 0
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    if (char === '\\') {
      index += 1
      continue
    }
    if (char === '{') depth += 1
    if (char === '}') depth -= 1
    if (char === ',' && depth === 0) {
      ranges.push({ start: offset + start, end: offset + index })
      start = index + 1
    }
  }
  ranges.push({ start: offset + start, end: offset + text.length })
  return ranges
}

function extractLegendLabels(labels, lineIndex) {
  const line = labels.sourceLines[lineIndex]
  const pattern = /\\legend\s*\{/g
  let match = pattern.exec(line)
  while (match) {
    const openIndex = pattern.lastIndex - 1
    const end = findMatchingBrace(line, openIndex)
    if (end > openIndex) {
      splitTopLevelRanges(line.slice(openIndex + 1, end), openIndex + 1).forEach((range) =>
        pushLabel(labels, lineIndex, range.start, range.end, 'legend'),
      )
    }
    match = pattern.exec(line)
  }
}

function extractQuotedLabels(labels, lineIndex) {
  const line = labels.sourceLines[lineIndex]
  const pattern = /"([^"]+)"/g
  let match = pattern.exec(line)
  while (match) {
    pushLabel(labels, lineIndex, match.index + 1, match.index + match[0].length - 1, 'quoted')
    match = pattern.exec(line)
  }
}

function isMatrixLikeRow(line) {
  const trimmed = line.trim()
  return trimmed.includes('&') && !trimmed.startsWith('\\')
}

function extractMatrixCellLabels(labels, lineIndex) {
  const line = labels.sourceLines[lineIndex]
  if (!isMatrixLikeRow(line)) return

  let segmentStart = 0
  const flush = (segmentEnd) => {
    const segment = line.slice(segmentStart, segmentEnd)
    const commandIndex = segment.search(/\\[A-Za-z]+/)
    const contentEnd = commandIndex >= 0 ? segmentStart + commandIndex : segmentEnd
    const cleanedEnd = line.slice(segmentStart, contentEnd).replace(/\\\\\s*$/, '')
    pushLabel(labels, lineIndex, segmentStart, segmentStart + cleanedEnd.length, 'cell')
  }

  for (let index = 0; index < line.length; index += 1) {
    if (line[index] === '&') {
      flush(index)
      segmentStart = index + 1
    }
  }
  flush(line.length)
}

function collectSnippetLabels(lines = []) {
  const labels = { sourceLines: lines.map((line) => `${line ?? ''}`), items: [] }
  labels.sourceLines.forEach((_, lineIndex) => {
    extractOptionLabels(labels, lineIndex, axisOptionKeys, 'axis')
    extractLegendLabels(labels, lineIndex)
    extractNodeLabels(labels, lineIndex)
    extractCommandLabels(labels, lineIndex)
    extractQuotedLabels(labels, lineIndex)
    extractMatrixCellLabels(labels, lineIndex)
    extractOptionLabels(labels, lineIndex, optionLabelKeys, 'option')
  })

  return labels.items
    .filter((item, index, items) =>
      !items.some(
        (other, otherIndex) =>
          otherIndex < index && other.lineIndex === item.lineIndex && other.start <= item.start && other.end >= item.end,
      ),
    )
    .sort((left, right) => left.lineIndex - right.lineIndex || left.start - right.start)
    .map((item, index) => ({ ...item, key: `snippet-label-${index}` }))
}

export function editableSnippetLabelsForLines(lines = []) {
  return collectSnippetLabels(lines).map((item, index) => ({
    key: item.key,
    label: `Label ${index + 1}`,
    value: item.text,
    kind: item.kind,
  }))
}

export function applySnippetLabelOverrides(lines = [], overrides = {}, { formatText = (value) => value } = {}) {
  const items = collectSnippetLabels(lines)
  const replacementByLine = new Map()

  items.forEach((item) => {
    if (!Object.hasOwn(overrides ?? {}, item.key)) return
    const value = `${overrides[item.key] ?? ''}`
    const replacements = replacementByLine.get(item.lineIndex) ?? []
    replacements.push({ ...item, replacement: formatText(value) })
    replacementByLine.set(item.lineIndex, replacements)
  })

  return lines.map((line, lineIndex) => {
    const replacements = replacementByLine.get(lineIndex)
    if (!replacements?.length) return line
    return replacements
      .sort((left, right) => right.start - left.start)
      .reduce((nextLine, item) => `${nextLine.slice(0, item.start)}${item.replacement}${nextLine.slice(item.end)}`, line)
  })
}
