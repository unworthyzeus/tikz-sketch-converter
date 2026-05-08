function fallbackFormatNumber(value) {
  if (!Number.isFinite(value)) return '0'
  const rounded = Math.round(value * 1000) / 1000
  return Object.is(rounded, -0) ? '0' : `${rounded}`
}

function boundsCenter(bounds) {
  return { x: (bounds.minX + bounds.maxX) / 2, y: (bounds.minY + bounds.maxY) / 2 }
}

function positiveBoundsSize(min, max, fallback = 1) {
  const value = max - min
  return Number.isFinite(value) && value > 0.0001 ? value : fallback
}

export function parseAxisDimensionCm(value, fallback) {
  const text = `${value ?? ''}`.trim()
  const match = text.match(/^([-+]?(?:\d+\.?\d*|\.\d+))(?:\s*cm)?$/i)
  const number = match ? Number(match[1]) : Number(text)
  return Number.isFinite(number) && number > 0 ? number : fallback
}

export function functionFrameBoundsForDataBounds(dataBounds, options = {}) {
  const dataWidth = positiveBoundsSize(dataBounds.minX, dataBounds.maxX)
  const dataHeight = positiveBoundsSize(dataBounds.minY, dataBounds.maxY)
  const width = parseAxisDimensionCm(options.axisWidth, dataWidth)
  const height = parseAxisDimensionCm(options.axisHeight, dataHeight)
  const center = boundsCenter(dataBounds)

  return {
    minX: center.x - width / 2,
    maxX: center.x + width / 2,
    minY: center.y - height / 2,
    maxY: center.y + height / 2,
  }
}

export function mapFunctionPointToFrame(point, dataBounds, frameBounds) {
  const dataWidth = positiveBoundsSize(dataBounds.minX, dataBounds.maxX)
  const dataHeight = positiveBoundsSize(dataBounds.minY, dataBounds.maxY)
  const frameWidth = positiveBoundsSize(frameBounds.minX, frameBounds.maxX)
  const frameHeight = positiveBoundsSize(frameBounds.minY, frameBounds.maxY)

  return {
    x: frameBounds.minX + ((point.x - dataBounds.minX) / dataWidth) * frameWidth,
    y: frameBounds.minY + ((point.y - dataBounds.minY) / dataHeight) * frameHeight,
  }
}

export function resizeFunctionPlotToBounds(element, nextBounds, currentBounds, options = {}, formatNumber = fallbackFormatNumber) {
  const currentCenter = boundsCenter(currentBounds)
  const nextCenter = boundsCenter(nextBounds)
  const nextWidth = Math.max(0.05, nextBounds.maxX - nextBounds.minX)
  const nextHeight = Math.max(0.05, nextBounds.maxY - nextBounds.minY)

  return {
    ...element,
    xOffset: (Number(element.xOffset) || 0) + nextCenter.x - currentCenter.x,
    yOffset: (Number(element.yOffset) || 0) + nextCenter.y - currentCenter.y,
    functionOptions: {
      ...options,
      axisWidth: `${formatNumber(nextWidth)}cm`,
      axisHeight: `${formatNumber(nextHeight)}cm`,
    },
  }
}
