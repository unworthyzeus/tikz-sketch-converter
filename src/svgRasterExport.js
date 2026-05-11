export function rasterSafeSvgText(svgText) {
  return String(svgText ?? '')
    .replace(/<foreignObject\b[\s\S]*?<\/foreignObject>/gi, '')
    .replace(/@font-face\s*\{[\s\S]*?\}/gi, '')
    .replace(/url\([^)]*\)/gi, 'none')
}

export function svgExportDimensions(svgText, fallback = { width: 920, height: 620 }) {
  const source = String(svgText ?? '')
  const width = Number(source.match(/\bwidth="([0-9.]+)"/i)?.[1])
  const height = Number(source.match(/\bheight="([0-9.]+)"/i)?.[1])

  return {
    width: Number.isFinite(width) && width > 0 ? width : fallback.width,
    height: Number.isFinite(height) && height > 0 ? height : fallback.height,
  }
}
