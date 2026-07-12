const locales: Record<string, Record<string, string>> = {}
const loadedLanguages = new Set<string>()
const inflight = new Map<string, Promise<void>>()

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

async function loadLocale(locale: string): Promise<void> {
  let content: { default: string }
  switch (locale) {
    case 'zh-CN':
      content = await import('./zh-CN.ini?raw')
      break
    case 'en-US':
      content = await import('./en-US.ini?raw')
      break
    case 'ja':
      content = await import('./ja.ini?raw')
      break
    case 'ko':
      content = await import('./ko.ini?raw')
      break
    default:
      return
  }
  locales[locale] = parseIni(content.default)
  loadedLanguages.add(locale)
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
