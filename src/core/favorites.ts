const STORAGE_KEY = 'trading-chest-favorites'

interface Favorites {
  indicators: string[]
  tools: string[]
}

function load(): Favorites {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return { indicators: [], tools: [] }
}

function save(f: Favorites): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(f))
}

export function getFavoriteIndicators(): string[] {
  return load().indicators
}

export function addFavoriteIndicator(name: string): void {
  const f = load()
  if (!f.indicators.includes(name)) {
    f.indicators.push(name)
    save(f)
  }
}

export function removeFavoriteIndicator(name: string): void {
  const f = load()
  f.indicators = f.indicators.filter((n) => n !== name)
  save(f)
}

export function isFavoriteIndicator(name: string): boolean {
  return load().indicators.includes(name)
}

export function getFavoriteTools(): string[] {
  return load().tools
}

export function addFavoriteTool(name: string): void {
  const f = load()
  if (!f.tools.includes(name)) {
    f.tools.push(name)
    save(f)
  }
}

export function removeFavoriteTool(name: string): void {
  const f = load()
  f.tools = f.tools.filter((n) => n !== name)
  save(f)
}

export function isFavoriteTool(name: string): boolean {
  return load().tools.includes(name)
}
