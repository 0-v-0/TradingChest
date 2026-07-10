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

import type { SelectDataSourceItem } from '../../component'
import t from '../../i18n'

// oxfmt-ignore
export function translateTimezone(timezone: string, locale: string): string {
  switch (timezone) {
    case 'Etc/UTC': return t('utc', locale)
    case 'Pacific/Honolulu': return t('honolulu', locale)
    case 'America/Juneau': return t('juneau', locale)
    case 'America/Los_Angeles': return t('los_angeles', locale)
    case 'America/Chicago': return t('chicago', locale)
    case 'America/Toronto': return t('toronto', locale)
    case 'America/Sao_Paulo': return t('sao_paulo', locale)
    case 'Europe/London': return t('london', locale)
    case 'Europe/Berlin': return t('berlin', locale)
    case 'Asia/Bahrain': return t('bahrain', locale)
    case 'Asia/Dubai': return t('dubai', locale)
    case 'Asia/Ashkhabad': return t('ashkhabad', locale)
    case 'Asia/Almaty': return t('almaty', locale)
    case 'Asia/Bangkok': return t('bangkok', locale)
    case 'Asia/Shanghai': return t('shanghai', locale)
    case 'Asia/Tokyo': return t('tokyo', locale)
    case 'Australia/Sydney': return t('sydney', locale)
    case 'Pacific/Norfolk': return t('norfolk', locale)
  }
  return timezone
}

export function createTimezoneSelectOptions(locale: string): SelectDataSourceItem[] {
  return [
    { key: 'Etc/UTC', text: t('utc', locale) },
    { key: 'Pacific/Honolulu', text: t('honolulu', locale) },
    { key: 'America/Juneau', text: t('juneau', locale) },
    { key: 'America/Los_Angeles', text: t('los_angeles', locale) },
    { key: 'America/Chicago', text: t('chicago', locale) },
    { key: 'America/Toronto', text: t('toronto', locale) },
    { key: 'America/Sao_Paulo', text: t('sao_paulo', locale) },
    { key: 'Europe/London', text: t('london', locale) },
    { key: 'Europe/Berlin', text: t('berlin', locale) },
    { key: 'Asia/Bahrain', text: t('bahrain', locale) },
    { key: 'Asia/Dubai', text: t('dubai', locale) },
    { key: 'Asia/Ashkhabad', text: t('ashkhabad', locale) },
    { key: 'Asia/Almaty', text: t('almaty', locale) },
    { key: 'Asia/Bangkok', text: t('bangkok', locale) },
    { key: 'Asia/Shanghai', text: t('shanghai', locale) },
    { key: 'Asia/Tokyo', text: t('tokyo', locale) },
    { key: 'Australia/Sydney', text: t('sydney', locale) },
    { key: 'Pacific/Norfolk', text: t('norfolk', locale) },
  ]
}
