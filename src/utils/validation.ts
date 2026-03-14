export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export function normalizeWorkspaceKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-\s]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export function isValidWorkspaceKey(value: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)
}
