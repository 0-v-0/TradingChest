import type { SelectDataSourceItem } from '../../component'
import t from '../../i18n'

const TIMEZONE_ENTRIES = [
  { tz: 'Etc/UTC', i18nKey: 'utc' },
  { tz: 'Pacific/Honolulu', i18nKey: 'honolulu' },
  { tz: 'America/Juneau', i18nKey: 'juneau' },
  { tz: 'America/Los_Angeles', i18nKey: 'los_angeles' },
  { tz: 'America/Chicago', i18nKey: 'chicago' },
  { tz: 'America/Toronto', i18nKey: 'toronto' },
  { tz: 'America/Sao_Paulo', i18nKey: 'sao_paulo' },
  { tz: 'Europe/London', i18nKey: 'london' },
  { tz: 'Europe/Berlin', i18nKey: 'berlin' },
  { tz: 'Asia/Bahrain', i18nKey: 'bahrain' },
  { tz: 'Asia/Dubai', i18nKey: 'dubai' },
  { tz: 'Asia/Ashkhabad', i18nKey: 'ashkhabad' },
  { tz: 'Asia/Almaty', i18nKey: 'almaty' },
  { tz: 'Asia/Bangkok', i18nKey: 'bangkok' },
  { tz: 'Asia/Shanghai', i18nKey: 'shanghai' },
  { tz: 'Asia/Tokyo', i18nKey: 'tokyo' },
  { tz: 'Australia/Sydney', i18nKey: 'sydney' },
  { tz: 'Pacific/Norfolk', i18nKey: 'norfolk' },
] as const

// oxfmt-ignore
export function translateTimezone(timezone: string, locale: string): string {
  for (const entry of TIMEZONE_ENTRIES) {
    if (entry.tz === timezone) return t(entry.i18nKey, locale)
  }
  return timezone
}

export function createTimezoneSelectOptions(locale: string): SelectDataSourceItem[] {
  return TIMEZONE_ENTRIES.map(({ tz, i18nKey }) => ({ key: tz, text: t(i18nKey, locale) }))
}
