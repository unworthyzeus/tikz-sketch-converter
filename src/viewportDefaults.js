const MIN_CANVAS_ZOOM = 0.55
const MAX_CANVAS_ZOOM = 2.25

export function clampCanvasZoom(value) {
  const numeric = Number(value)
  const safeValue = Number.isFinite(numeric) ? numeric : 1
  return Math.min(MAX_CANVAS_ZOOM, Math.max(MIN_CANVAS_ZOOM, safeValue))
}

export function initialCanvasZoom(sharedZoom, viewportWidth) {
  if (sharedZoom !== undefined && sharedZoom !== null) return clampCanvasZoom(sharedZoom)

  const width = Number(viewportWidth)
  if (!Number.isFinite(width)) return 1
  if (width < 560) return MIN_CANVAS_ZOOM
  if (width < 900) return 0.75
  return 1
}
