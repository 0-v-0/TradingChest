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

export async function load(locale: string) {
  if (loadedLanguages.has(locale)) {
    return
  }
  let mod: Record<string, string>
  switch (locale) {
    case 'zh-CN':
      mod = (await import('./zh-CN.json')).default
      break
    case 'en-US':
      mod = (await import('./en-US.json')).default
      break
    case 'ja':
      mod = (await import('./ja.json')).default
      break
    case 'ko':
      mod = (await import('./ko.json')).default
      break
    default:
      return
  }
  locales[locale] = mod
  loadedLanguages.add(locale)
}

export default (key: string, locale: string) => {
  return locales[locale]?.[key] ?? key
}
