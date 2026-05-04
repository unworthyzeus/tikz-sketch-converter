export function moveElementBy(element, deltaX, deltaY) {
  const movePoint = (point) => ({ x: point.x + deltaX, y: point.y + deltaY })

  if (element.type === 'line' || element.type === 'arrow' || element.type === 'rect' || element.type === 'ellipse') {
    return {
      ...element,
      start: movePoint(element.start),
      end: movePoint(element.end),
    }
  }

  if (element.type === 'path') {
    return {
      ...element,
      points: element.points.map(movePoint),
    }
  }

  if (element.type === 'text') {
    return {
      ...element,
      position: movePoint(element.position),
    }
  }

  if (element.type === 'function') {
    return {
      ...element,
      xOffset: (Number(element.xOffset) || 0) + deltaX,
      yOffset: (Number(element.yOffset) || 0) + deltaY,
    }
  }

  if (element.type === 'diagram' || element.type === 'library') {
    return {
      ...element,
      origin: movePoint(element.origin),
    }
  }

  return element
}
