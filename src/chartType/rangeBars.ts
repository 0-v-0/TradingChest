import type { IndicatorTemplate, KLineData } from 'klinecharts'
import { calcATR, drawBricks } from './utils'

export interface RangeBar {
  barOpen: number
  barClose: number
  barHigh: number
  barLow: number
  trend: number
  timestamp: number
}

export function calcRangeBars(dataList: KLineData[], rangeSize: number): RangeBar[] {
  if (dataList.length === 0 || rangeSize <= 0) return []

  const bars: RangeBar[] = []
  let currentPrice = dataList[0].close

  for (let i = 0; i < dataList.length; i++) {
    const d = dataList[i]

    while (d.high >= currentPrice + rangeSize) {
      const open = currentPrice
      const close = currentPrice + rangeSize
      bars.push({ barOpen: open, barClose: close, barHigh: close, barLow: open, trend: 1, timestamp: d.timestamp })
      currentPrice = close
    }

    while (d.low <= currentPrice - rangeSize) {
      const open = currentPrice
      const close = currentPrice - rangeSize
      bars.push({ barOpen: open, barClose: close, barHigh: open, barLow: close, trend: -1, timestamp: d.timestamp })
      currentPrice = close
    }
  }

  return bars
}

interface RangeBarsCacheKey {
  dataLen: number
  lastTs: number
  period: number
  lastClose: number
  lastHigh: number
  lastLow: number
}

interface RangeBarsCache {
  key?: RangeBarsCacheKey
  bars: RangeBar[]
}

const _rangeBarsCache = new WeakMap<object, RangeBarsCache>()

const rangeBars: IndicatorTemplate<object, number> = {
  name: 'RangeBars',
  shortName: 'RB',
  calcParams: [14],
  figures: [],
  calc: (dataList: KLineData[]) => {
    return dataList.map(() => ({}))
  },
  draw: ({ ctx, chart, indicator: { calcParams: [period = 14] }, bounding, yAxis }) => {
    const dataList = chart.getDataList()
    if (!dataList || dataList.length < 2) return false

    const adjustedPeriod = Math.max(2, period)
    const atrVal = calcATR(dataList, adjustedPeriod)
    const rangeSize = Math.max(atrVal, 0.01)
    if (rangeSize <= 0) return false

    const lastBar = dataList[dataList.length - 1]
    const cacheKey: RangeBarsCacheKey = {
      dataLen: dataList.length,
      lastTs: lastBar.timestamp,
      period: adjustedPeriod,
      lastClose: lastBar.close,
      lastHigh: lastBar.high,
      lastLow: lastBar.low,
    }
    let cache = _rangeBarsCache.get(chart)
    if (!cache) {
      cache = { bars: [] }
      _rangeBarsCache.set(chart, cache)
    }
    if (
      !cache.key ||
      cache.key.dataLen !== cacheKey.dataLen ||
      cache.key.lastTs !== cacheKey.lastTs ||
      cache.key.period !== cacheKey.period ||
      cache.key.lastClose !== cacheKey.lastClose ||
      cache.key.lastHigh !== cacheKey.lastHigh ||
      cache.key.lastLow !== cacheKey.lastLow
    ) {
      cache.bars = calcRangeBars(dataList, rangeSize)
      cache.key = cacheKey
    }

    const bars = cache.bars
    if (bars.length === 0) return false

    const visibleRange = chart.getVisibleRange()
    const from = Math.max(0, visibleRange.from)
    const to = Math.min(bars.length, visibleRange.to)

    drawBricks(ctx, bars, b => b.barHigh, b => b.barLow, b => b.trend, from, to, bounding, yAxis)
    return true
  },
}

export default rangeBars
