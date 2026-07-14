import type { Period } from '../types'

const MS_PER_SECOND = 1000
const MS_PER_MINUTE = 60 * MS_PER_SECOND
const MS_PER_HOUR = 60 * MS_PER_MINUTE
const MS_PER_DAY = 24 * MS_PER_HOUR
const MS_PER_WEEK = 7 * MS_PER_DAY

/**
 * Calculates an aligned [from, to] timestamp pair for a given period and bar count.
 *
 * The returned `to` is snapped to the period boundary (e.g. minute, hour) and
 * `from` is calculated by stepping back `count * period.multiplier` units from `to`.
 *
 * @param period       - The chart period descriptor (timespan + multiplier).
 * @param toTimestamp  - The raw upper-bound timestamp in milliseconds (epoch).
 * @param count        - Number of bars to include in the range.
 * @returns A tuple `[from, alignedTo]` both in milliseconds since epoch.
 */
export function adjustFromTo(period: Period, toTimestamp: number, count: number): [number, number] {
  let to = toTimestamp
  let from = to
  switch (period.timespan) {
    case 'ms':
      to = to - to % MS_PER_SECOND
      from = to - count * period.multiplier
      break
    case 'second':
      to = to - to % MS_PER_SECOND
      from = to - count * period.multiplier * MS_PER_SECOND
      break
    case 'minute':
      to = to - to % MS_PER_MINUTE
      from = to - count * period.multiplier * MS_PER_MINUTE
      break
    case 'hour':
      to = to - to % MS_PER_HOUR
      from = to - count * period.multiplier * MS_PER_HOUR
      break
    case 'day': {
      const date = new Date(to)
      to = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
      from = to - count * period.multiplier * MS_PER_DAY
      break
    }
    case 'week': {
      const date = new Date(to)
      const day = date.getUTCDay()
      const dif = day === 0 ? 6 : day - 1
      to = to - dif * MS_PER_DAY
      const d = new Date(to)
      to = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
      from = to - count * period.multiplier * MS_PER_WEEK
      break
    }
    case 'month': {
      const date = new Date(to)
      to = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1)
      const fromDate = new Date(to)
      fromDate.setUTCMonth(fromDate.getUTCMonth() - count * period.multiplier)
      from = Date.UTC(fromDate.getUTCFullYear(), fromDate.getUTCMonth(), 1)
      break
    }
    case 'year': {
      const date = new Date(to)
      to = Date.UTC(date.getUTCFullYear(), 0, 1)
      const fromDate = new Date(to)
      fromDate.setUTCFullYear(fromDate.getUTCFullYear() - count * period.multiplier)
      from = Date.UTC(fromDate.getUTCFullYear(), 0, 1)
      break
    }
  }
  return [from, to]
}
