const numericTokenPattern = /^[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?$/i

function formatNumber(value) {
  if (!Number.isFinite(value)) return '0'
  const rounded = Math.round(value * 1000) / 1000
  return Object.is(rounded, -0) ? '0' : `${rounded}`
}

export function parseFunctionDataTable(value = '') {
  return `${value ?? ''}`
    .split(/\n|;/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split(/[,\s]+/).map((part) => part.trim()).filter(Boolean))
    .filter((parts) => parts.length >= 2 && parts.every((part) => numericTokenPattern.test(part)))
    .map(([x, y, yError]) => {
      const row = { x: Number(x), y: Number(y) }
      if (yError !== undefined) row.yError = Number(yError)
      return row
    })
}

export function functionDataTableUsesYError(rows = []) {
  return rows.some((row) => Number.isFinite(row?.yError))
}

export function functionDataTableRows(rows = []) {
  const includeYError = functionDataTableUsesYError(rows)
  return [
    includeYError ? 'x y yerr' : 'x y',
    ...rows.map((row) =>
      includeYError
        ? `${formatNumber(row.x)} ${formatNumber(row.y)} ${formatNumber(row.yError)}`
        : `${formatNumber(row.x)} ${formatNumber(row.y)}`,
    ),
  ]
}
