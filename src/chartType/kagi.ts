import type { IndicatorTemplate, KLineData } from 'klinecharts'
import { COLOR_UP, COLOR_DOWN, COLOR_NEUTRAL } from '../types'

export interface KagiSegment {
  kagiOpen: number
  kagiClose: number
  kagiHigh: number
  kagiLow: number
  trend: number
  timestamp: number
}

export function calcKagi(dataList: KLineData[], reversal: number): KagiSegment[] {
  if (dataList.length === 0 || reversal <= 0) return []

  const segments: KagiSegment[] = []
  let basePrice = dataList[0].close
  let lastTrend = basePrice >= dataList[0].close ? 1 : -1

  for (let i = 1; i < dataList.length; i++) {
    const { close, timestamp } = dataList[i]

    if (lastTrend === 1) {
      while (close >= basePrice + reversal) {
        const newClose = basePrice + reversal
        segments.push({
          kagiOpen: basePrice,
          kagiClose: newClose,
          kagiHigh: newClose,
          kagiLow: basePrice,
          trend: 1,
          timestamp,
        })
        basePrice = newClose
      }

      if (close <= basePrice - reversal) {
        segments.push({
          kagiOpen: basePrice,
          kagiClose: basePrice,
          kagiHigh: basePrice,
          kagiLow: basePrice,
          trend: 0,
          timestamp,
        })
        lastTrend = -1
        while (close <= basePrice - reversal) {
          const newClose = basePrice - reversal
          segments.push({
            kagiOpen: basePrice,
            kagiClose: newClose,
            kagiHigh: basePrice,
            kagiLow: newClose,
            trend: -1,
            timestamp,
          })
          basePrice = newClose
        }
      }
    } else {
      while (close <= basePrice - reversal) {
        const newClose = basePrice - reversal
        segments.push({
          kagiOpen: basePrice,
          kagiClose: newClose,
          kagiHigh: basePrice,
          kagiLow: newClose,
          trend: -1,
          timestamp,
        })
        basePrice = newClose
      }

      if (close >= basePrice + reversal) {
        segments.push({
          kagiOpen: basePrice,
          kagiClose: basePrice,
          kagiHigh: basePrice,
          kagiLow: basePrice,
          trend: 0,
          timestamp,
        })
        lastTrend = 1
        while (close >= basePrice + reversal) {
          const newClose = basePrice + reversal
          segments.push({
            kagiOpen: basePrice,
            kagiClose: newClose,
            kagiHigh: newClose,
            kagiLow: basePrice,
            trend: 1,
            timestamp,
          })
          basePrice = newClose
        }
      }
    }
  }

  return segments
}

/** Cache key for Kagi segments: data length + last timestamp + reversal */
interface KagiCacheKey {
  dataLen: number
  lastTs: number
  reversal: number
}

let _kagiCacheKey: KagiCacheKey | null = null
let _kagiCacheSegments: KagiSegment[] = []

const kagi: IndicatorTemplate<object, number> = {
  name: 'Kagi',
  shortName: 'KG',
  calcParams: [14],
  figures: [],
  calc: (dataList: KLineData[]) => {
    return dataList.map(() => ({}))
  },
  draw: ({ ctx, chart, indicator: { calcParams: [reversal = 14] }, bounding, yAxis }) => {
    const dataList = chart.getDataList()
    if (!dataList || dataList.length < 2) return false

    const adjustedReversal = Math.max(1, reversal)

    // Cache segments: only recalculate when data or reversal changes
    const cacheKey: KagiCacheKey = {
      dataLen: dataList.length,
      lastTs: dataList[dataList.length - 1].timestamp,
      reversal: adjustedReversal,
    }
    if (
      !_kagiCacheKey ||
      _kagiCacheKey.dataLen !== cacheKey.dataLen ||
      _kagiCacheKey.lastTs !== cacheKey.lastTs ||
      _kagiCacheKey.reversal !== cacheKey.reversal
    ) {
      _kagiCacheSegments = calcKagi(dataList, adjustedReversal)
      _kagiCacheKey = cacheKey
    }

    const segments = _kagiCacheSegments
    if (segments.length === 0) return false

    const visibleRange = chart.getVisibleRange()
    const from = Math.max(0, visibleRange.from)
    const to = Math.min(segments.length, visibleRange.to)
    const visibleCount = to - from
    if (visibleCount <= 0) return false

    const segWidth = Math.max(1, bounding.width / visibleCount)
    for (let i = from; i < to; i++) {
      const seg = segments[i]
      const x = bounding.left + (i - from) * segWidth + segWidth / 2

      if (seg.trend === 0) {
        const y = yAxis.convertToPixel(seg.kagiOpen)
        ctx.strokeStyle = COLOR_NEUTRAL
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(x - segWidth / 4, y)
        ctx.lineTo(x + segWidth / 4, y)
        ctx.stroke()
      } else if (seg.trend > 0) {
        const yTop = yAxis.convertToPixel(seg.kagiHigh)
        const yBottom = yAxis.convertToPixel(seg.kagiLow)
        ctx.strokeStyle = COLOR_UP
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.moveTo(x, yTop)
        ctx.lineTo(x, yBottom)
        ctx.stroke()
      } else {
        const yTop = yAxis.convertToPixel(seg.kagiHigh)
        const yBottom = yAxis.convertToPixel(seg.kagiLow)
        ctx.strokeStyle = COLOR_DOWN
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(x, yTop)
        ctx.lineTo(x, yBottom)
        ctx.stroke()
      }
    }

    return true
  },
}

export default kagi
