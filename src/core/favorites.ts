const STORAGE_KEY = 'trading-chest-favorites'

interface Favorites {
  indicators: string[]
  tools: string[]
}

function isFavorites(v: unknown): v is Favorites {
  if (!v || typeof v !== 'object') return false
  const o = v as Record<string, unknown>
  return Array.isArray(o.indicators) && o.indicators.every((x) => typeof x === 'string')
    && Array.isArray(o.tools) && o.tools.every((x) => typeof x === 'string')
}

function emptyFavorites(): Favorites {
  return { indicators: [], tools: [] }
}

function read(): Favorites {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed: unknown = JSON.parse(raw)
      if (isFavorites(parsed)) return parsed
    }
  } catch { /* ignore */ }
  return emptyFavorites()
}

let cache: Favorites | null = null

function load(): Favorites {
  if (cache) return cache
  const next = read()
  cache = next
  return cache
}

function invalidate(): void {
  cache = null
}

function persist(): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(load()))
    return true
  } catch (e) {
    if (e instanceof Error && e.name !== 'QuotaExceededError') {
      console.warn('[TradingChest] save favorites failed:', e)
    }
    return false
  }
}

function withList(kind: 'indicators' | 'tools', mutator: (arr: string[]) => string[]): void {
  const f = load()
  f[kind] = mutator(f[kind].slice())
  persist()
}

export function getFavoriteIndicators(): string[] {
  return load().indicators.slice()
}

export function addFavoriteIndicator(name: string): void {
  withList('indicators', (arr) => arr.includes(name) ? arr : [...arr, name])
}

export function removeFavoriteIndicator(name: string): void {
  withList('indicators', (arr) => arr.filter((n) => n !== name))
}

export function isFavoriteIndicator(name: string): boolean {
  return load().indicators.includes(name)
}

export function getFavoriteTools(): string[] {
  return load().tools.slice()
}

export function addFavoriteTool(name: string): void {
  withList('tools', (arr) => arr.includes(name) ? arr : [...arr, name])
}

export function removeFavoriteTool(name: string): void {
  withList('tools', (arr) => arr.filter((n) => n !== name))
}

export function isFavoriteTool(name: string): boolean {
  return load().tools.includes(name)
}

export function _resetFavoritesCacheForTesting(): void {
  invalidate()
}
