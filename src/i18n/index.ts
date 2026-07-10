/**
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at

 * http://www.apache.org/licenses/LICENSE-2.0

 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const locales: Record<string, Record<string, string>> = {}
const loadedLanguages = new Set<string>()

function parseIni(content: string): Record<string, string> {
  const result: Record<string, string> = {}
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx)
    const value = trimmed.slice(eqIdx + 1)
    result[key] = value
  }
  return result
}

export async function load(locale: string) {
  if (loadedLanguages.has(locale)) {
    return
  }
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

export default (key: string, locale: string) => {
  return locales[locale]?.[key] ?? key
}
