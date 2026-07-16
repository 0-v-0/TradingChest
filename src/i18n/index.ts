const locales: Record<string, Record<string, string>> = {}
const loadedLanguages = new Set<string>()
const inflight = new Map<string, Promise<void>>()

// Solid.js reactivity integration: bump this counter after loading locale data
// so that any reactive computation depending on translations re-evaluates.
let _version = 0
const listeners = new Set<() => void>()

function notifyListeners() {
  _version++
  for (const fn of listeners) fn()
}

export function subscribeLocaleChange(fn: () => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function getLocaleVersion() { return _version }
function parseIni(content: string): Record<string, string> {
  const result: Record<string, string> = {}
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith(';')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx)
    const value = trimmed.slice(eqIdx + 1)
    result[key] = value
  }
  return result
}

const localeImports: Record<string, () => Promise<{ default: string }>> = {
  'zh-CN': () => import('./zh-CN.ini?raw'),
  'en-US': () => import('./en-US.ini?raw'),
  'ja': () => import('./ja.ini?raw'),
  'ko': () => import('./ko.ini?raw'),
}

async function loadLocale(locale: string): Promise<void> {
  const importFn = localeImports[locale]
  if (!importFn) return
  const content = await importFn()
  locales[locale] = parseIni(content.default)
  loadedLanguages.add(locale)
  notifyListeners()
}

export function load(locale: string): Promise<void> {
  if (loadedLanguages.has(locale)) return Promise.resolve()
  const existing = inflight.get(locale)
  if (existing) return existing
  const p = loadLocale(locale).finally(() => {
    inflight.delete(locale)
  })
  inflight.set(locale, p)
  return p
}

export default (key: string, locale: string) => {
  return locales[locale]?.[key] ?? key
}
