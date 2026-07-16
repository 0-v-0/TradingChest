const UNSAFE_KEYS = new Set(['__proto__', 'constructor', 'prototype'])

/**
 * Set a deeply nested property on an object using a dot-separated path.
 * Rejects __proto__/constructor/prototype segments to prevent prototype pollution.
 * Returns true if the assignment was applied, false if the path was unsafe or empty.
 */
export function deepSet(obj: object, path: string, value: unknown): boolean {
  if (!path) return false
  const keys = path.split('.')
  let current: Record<string, unknown> = obj as Record<string, unknown>
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]
    if (UNSAFE_KEYS.has(key)) return false
    if (!(key in current) || current[key] === null || typeof current[key] !== 'object') {
      current[key] = {}
    }
    current = current[key] as Record<string, unknown>
  }
  const lastKey = keys[keys.length - 1]
  if (UNSAFE_KEYS.has(lastKey)) return false
  current[lastKey] = value
  return true
}
