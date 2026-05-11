export function selectableGroupIds(elements, element) {
  if (!element?.id) return []
  if (!element.groupId) return [element.id]

  const groupIds = elements
    .filter((candidate) => candidate.groupId === element.groupId && !candidate.hidden && !candidate.locked)
    .map((candidate) => candidate.id)

  return groupIds.includes(element.id) ? groupIds : [element.id]
}

export function toggleGroupedSelection(selectedIds, groupIds) {
  const current = new Set(Array.isArray(selectedIds) ? selectedIds : [])
  const ids = Array.isArray(groupIds) ? groupIds.filter(Boolean) : []
  if (!ids.length) return [...current]

  const shouldRemove = ids.every((id) => current.has(id))
  if (shouldRemove) {
    ids.forEach((id) => current.delete(id))
    return [...current]
  }

  ids.forEach((id) => current.add(id))
  return [...current]
}
