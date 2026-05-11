function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function distanceToSegment(point, start, end) {
  const lengthSquared = (end.x - start.x) ** 2 + (end.y - start.y) ** 2
  if (lengthSquared === 0) return distance(point, start)
  const rawT = ((point.x - start.x) * (end.x - start.x) + (point.y - start.y) * (end.y - start.y)) / lengthSquared
  const t = Math.max(0, Math.min(1, rawT))
  return distance(point, {
    x: start.x + (end.x - start.x) * t,
    y: start.y + (end.y - start.y) * t,
  })
}

function pointOnSegment(point, segment, tolerance) {
  return distanceToSegment(point, segment.start, segment.end) <= tolerance
}

function pointsClose(a, b, tolerance) {
  return distance(a, b) <= tolerance
}

function roundedPoint(point) {
  return {
    x: Math.round(point.x * 1000) / 1000,
    y: Math.round(point.y * 1000) / 1000,
  }
}

export function rotatePointAround(point, center, degrees = 0) {
  const angle = (Number(degrees) * Math.PI) / 180
  if (!Number.isFinite(angle) || angle === 0) return { ...point }
  const dx = point.x - center.x
  const dy = point.y - center.y
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
  }
}

export function rotateNetlistPoints(points = [], center = { x: 0, y: 0 }, degrees = 0) {
  const rotation = Number(degrees) || 0
  if (!rotation) return points
  return points.map((point) => rotatePointAround(point, center, rotation))
}

export function segmentIntersection(a1, a2, b1, b2, tolerance = 1e-9) {
  const denominator = (a1.x - a2.x) * (b1.y - b2.y) - (a1.y - a2.y) * (b1.x - b2.x)
  if (Math.abs(denominator) < tolerance) return null
  const t = ((a1.x - b1.x) * (b1.y - b2.y) - (a1.y - b1.y) * (b1.x - b2.x)) / denominator
  const u = -((a1.x - a2.x) * (a1.y - b1.y) - (a1.y - a2.y) * (a1.x - b1.x)) / denominator
  if (t < -tolerance || t > 1 + tolerance || u < -tolerance || u > 1 + tolerance) return null
  return {
    x: a1.x + t * (a2.x - a1.x),
    y: a1.y + t * (a2.y - a1.y),
  }
}

function createDisjointSet() {
  const parent = []

  return {
    make() {
      const id = parent.length
      parent.push(id)
      return id
    },
    find(id) {
      if (parent[id] !== id) parent[id] = this.find(parent[id])
      return parent[id]
    },
    union(left, right) {
      const leftRoot = this.find(left)
      const rightRoot = this.find(right)
      if (leftRoot !== rightRoot) parent[rightRoot] = leftRoot
    },
  }
}

export function buildConnectivityNets({
  terminals = [],
  wireSegments = [],
  tolerance = 0.08,
  intersectSegments = segmentIntersection,
} = {}) {
  const disjointSet = createDisjointSet()
  const nodes = []
  const segmentNodeIds = new Map()
  const junctionPoints = []

  const addNode = (point, terminal = null) => {
    const id = disjointSet.make()
    nodes.push({ id, point, terminal })
    return id
  }

  const addJunctionPoint = (point) => {
    if (junctionPoints.some((candidate) => pointsClose(candidate, point, tolerance))) return
    junctionPoints.push(roundedPoint(point))
  }

  const terminalNodeIds = terminals.map((terminal) => addNode(terminal.point, terminal))

  wireSegments.forEach((segment) => {
    segmentNodeIds.set(segment.id, [addNode(segment.start), addNode(segment.end)])
  })

  wireSegments.forEach((segment, index) => {
    wireSegments.slice(index + 1).forEach((other) => {
      const point = intersectSegments(segment.start, segment.end, other.start, other.end)
      if (!point) return
      const leftId = addNode(point)
      const rightId = addNode(point)
      segmentNodeIds.get(segment.id).push(leftId)
      segmentNodeIds.get(other.id).push(rightId)
      disjointSet.union(leftId, rightId)
      addJunctionPoint(point)
    })
  })

  terminals.forEach((terminal, terminalIndex) => {
    wireSegments.forEach((segment) => {
      if (!pointOnSegment(terminal.point, segment, tolerance)) return
      segmentNodeIds.get(segment.id).push(terminalNodeIds[terminalIndex])
      if (!pointsClose(terminal.point, segment.start, tolerance) && !pointsClose(terminal.point, segment.end, tolerance)) {
        addJunctionPoint(terminal.point)
      }
    })
  })

  segmentNodeIds.forEach((nodeIds) => {
    const [first, ...rest] = nodeIds
    rest.forEach((id) => disjointSet.union(first, id))
  })

  terminalNodeIds.forEach((leftId, leftIndex) => {
    terminalNodeIds.slice(leftIndex + 1).forEach((rightId) => {
      if (pointsClose(nodes[leftId].point, nodes[rightId].point, tolerance)) disjointSet.union(leftId, rightId)
    })
  })

  const grouped = new Map()
  nodes.forEach((node) => {
    const root = disjointSet.find(node.id)
    if (!grouped.has(root)) grouped.set(root, { terminals: [], points: [] })
    const group = grouped.get(root)
    group.points.push(node.point)
    if (node.terminal) group.terminals.push(node.terminal)
  })

  const nets = [...grouped.values()]
    .map((group) => ({
      terminals: group.terminals,
      points: group.points.map(roundedPoint),
    }))
    .filter((group) => group.terminals.length > 1 || group.terminals.some((terminal) => terminal.preferredNet))

  return {
    nets,
    junctions: junctionPoints,
  }
}
