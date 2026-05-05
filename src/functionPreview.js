export function functionLegendEntries(displaySeries = [], maxEntries = 6) {
  const entryLimit = Number.isFinite(+maxEntries) ? Math.max(0, Math.floor(+maxEntries)) : 6
  return displaySeries.slice(0, entryLimit).map(({ series }, index) => {
    const legend = `${series?.legend ?? ''}`.trim()
    const expression = `${series?.expression ?? ''}`.trim()
    return {
      id: series?.id || `series-${index + 1}`,
      label: legend || expression || `Serie ${index + 1}`,
      color: series?.color || '#111111',
      lineStyle: series?.lineStyle || 'solid',
      markerStyle: series?.markerStyle || 'none',
      index,
    }
  })
}

export function curveMarkerPoints(points = [], markerStyle = 'none', maxMarkers = 8) {
  if (!markerStyle || markerStyle === 'none') return []
  const markerLimit = Number.isFinite(+maxMarkers) ? Math.max(0, Math.floor(+maxMarkers)) : 8
  if (markerLimit === 0) return []

  const finitePoints = points.filter(
    (point) => point && Number.isFinite(point.x) && Number.isFinite(point.y),
  )
  if (finitePoints.length <= markerLimit) return finitePoints

  const markerCount = markerLimit
  if (markerCount === 1) return [finitePoints[Math.floor(finitePoints.length / 2)]]

  const indexes = new Set()
  const step = (finitePoints.length - 1) / (markerCount - 1)
  for (let index = 0; index < markerCount; index += 1) {
    indexes.add(Math.round(index * step))
  }

  return [...indexes].map((index) => finitePoints[index]).filter(Boolean)
}

export function markerGlyphParts(markerStyle, point) {
  const { x, y, size = 4 } = point

  if (markerStyle === '*') {
    return [{ type: 'circle', cx: x, cy: y, r: size, filled: true }]
  }

  if (markerStyle === 'o') {
    return [{ type: 'circle', cx: x, cy: y, r: size, filled: false }]
  }

  if (markerStyle === 'square*') {
    return [{ type: 'rect', x: x - size, y: y - size, width: size * 2, height: size * 2, filled: true }]
  }

  if (markerStyle === 'triangle*') {
    return [
      {
        type: 'path',
        d: `M ${x} ${y - size * 1.15} L ${x + size * 1.05} ${y + size * 0.75} L ${x - size * 1.05} ${y + size * 0.75} Z`,
        filled: true,
      },
    ]
  }

  if (markerStyle === 'diamond*') {
    return [
      {
        type: 'path',
        d: `M ${x} ${y - size} L ${x + size} ${y} L ${x} ${y + size} L ${x - size} ${y} Z`,
        filled: true,
      },
    ]
  }

  if (markerStyle === 'x') {
    return [
      { type: 'line', x1: x - size, y1: y - size, x2: x + size, y2: y + size },
      { type: 'line', x1: x + size, y1: y - size, x2: x - size, y2: y + size },
    ]
  }

  if (markerStyle === '+') {
    return [
      { type: 'line', x1: x - size, y1: y, x2: x + size, y2: y },
      { type: 'line', x1: x, y1: y - size, x2: x, y2: y + size },
    ]
  }

  return []
}
