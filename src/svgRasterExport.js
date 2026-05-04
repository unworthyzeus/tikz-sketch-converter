export function rasterSafeSvgText(svgText) {
  return String(svgText ?? '')
    .replace(/<foreignObject\b[\s\S]*?<\/foreignObject>/gi, '')
    .replace(/@font-face\s*\{[\s\S]*?\}/gi, '')
    .replace(/url\([^)]*\)/gi, 'none')
}
