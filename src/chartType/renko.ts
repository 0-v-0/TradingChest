import type { IndicatorTemplate, KLineData } from 'klinecharts'
import { calcATR, drawBricks } from './utils'

export interface RenkoBrick {
  brickOpen: number
  brickClose: number
  brickHigh: number
  brickLow: number
  trend: number
  timestamp: number
}

export function calcRenkoBricks(dataList: KLineData[], brickSize: number): RenkoBrick[] {
  if (dataList.length === 0 || brickSize <= 0) return []

  const bricks: RenkoBrick[] = []
  let lastClose = dataList[0].close

  for (let i = 0; i < dataList.length; i++) {
    const d = dataList[i]

    while (d.high >= lastClose + brickSize) {
      const open = lastClose
      const close = lastClose + brickSize
      bricks.push({ brickOpen: open, brickClose: close, brickHigh: close, brickLow: open, trend: 1, timestamp: d.timestamp })
      lastClose = close
    }

    while (d.low <= lastClose - brickSize) {
      const open = lastClose
      const close = lastClose - brickSize
      bricks.push({ brickOpen: open, brickClose: close, brickHigh: open, brickLow: close, trend: -1, timestamp: d.timestamp })
      lastClose = close
    }
  }

  return bricks
}

/** Cache key for Renko bricks: data length + last timestamp + period + last candle OHLC */
interface RenkoCacheKey {
  dataLen: number
  lastTs: number
  period: number
  lastClose: number
  lastHigh: number
  lastLow: number
}

interface RenkoCache {
  key?: RenkoCacheKey
  bricks: RenkoBrick[]
}

// Per-chart cache (WeakMap keyed by the klinecharts Chart instance):
//  - realtime ticks change the last candle's OHLC without altering its length or
//    timestamp, so the last-candle identity must be part of the key;
//  - a module-level singleton would let multiple chart instances overwrite each other.
const _renkoCache = new WeakMap<object, RenkoCache>()

const renko: IndicatorTemplate<object, number> = {
  name: 'Renko',
  shortName: 'RN',
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
    const brickSize = Math.max(atrVal, 0.01)
    if (brickSize <= 0) return false

    // Cache bricks: only recalculate when data, params, or the last candle change.
    const lastBar = dataList[dataList.length - 1]
    const cacheKey: RenkoCacheKey = {
      dataLen: dataList.length,
      lastTs: lastBar.timestamp,
      period: adjustedPeriod,
      lastClose: lastBar.close,
      lastHigh: lastBar.high,
      lastLow: lastBar.low,
    }
    let cache = _renkoCache.get(chart)
    if (!cache) {
      cache = { bricks: [] }
      _renkoCache.set(chart, cache)
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
      cache.bricks = calcRenkoBricks(dataList, brickSize)
      cache.key = cacheKey
    }

    const bricks = cache.bricks
    if (bricks.length === 0) return false

    const visibleRange = chart.getVisibleRange()
    const from = Math.max(0, visibleRange.from)
    const to = Math.min(bricks.length, visibleRange.to)

    drawBricks(ctx, bricks, b => b.brickHigh, b => b.brickLow, b => b.trend, from, to, bounding, yAxis)
    return true
  },
}

export default renko
