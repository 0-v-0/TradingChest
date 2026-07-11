import type { IndicatorTemplate, KLineData } from 'klinecharts'

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

function calcATR(dataList: KLineData[], period: number): number {
  if (dataList.length < 2) return 0
  let sum = 0
  const count = Math.min(period, dataList.length - 1)
  for (let i = 1; i <= count; i++) {
    const d = dataList[i]
    const prev = dataList[i - 1]
    sum += Math.max(d.high - d.low, Math.abs(d.high - prev.close), Math.abs(d.low - prev.close))
  }
  return sum / count
}

const rangeBars: IndicatorTemplate = {
  name: 'RangeBars',
  shortName: 'RB',
  calcParams: [14],
  figures: [],
  calc: (dataList: KLineData[]) => {
    return dataList.map(() => ({}))
  },
  draw: ({ ctx, chart, indicator, bounding, yAxis }) => {
    const dataList = chart.getDataList()
    if (!dataList || dataList.length < 2) return false

    const period = Math.max(2, (indicator.calcParams[0] as number) || 14)
    const atrVal = calcATR(dataList, period)
    const rangeSize = Math.max(atrVal, 0.01)
    if (rangeSize <= 0) return false

    const bars = calcRangeBars(dataList, rangeSize)
    if (bars.length === 0) return false

    const visibleRange = chart.getVisibleRange()
    const from = Math.max(0, visibleRange.from)
    const to = Math.min(bars.length, visibleRange.to)
    const visibleCount = to - from
    if (visibleCount <= 0) return false

    const barWidth = Math.max(1, bounding.width / visibleCount)
    const gap = 1

    for (let i = from; i < to; i++) {
      const bar = bars[i]
      const x = bounding.left + (i - from) * barWidth
      const yTop = yAxis.convertToPixel(bar.barHigh)
      const yBottom = yAxis.convertToPixel(bar.barLow)
      const height = Math.max(yBottom - yTop, 1)

      if (bar.trend > 0) {
        ctx.fillStyle = '#26a69a'
        ctx.fillRect(x + gap, yTop, barWidth - gap * 2, height)
        ctx.strokeStyle = '#26a69a'
        ctx.lineWidth = 1
        ctx.strokeRect(x + gap, yTop, barWidth - gap * 2, height)
      } else {
        ctx.fillStyle = '#ef5350'
        ctx.fillRect(x + gap, yTop, barWidth - gap * 2, height)
        ctx.strokeStyle = '#ef5350'
        ctx.lineWidth = 1
        ctx.strokeRect(x + gap, yTop, barWidth - gap * 2, height)
      }
    }

    return true
  },
}

export default rangeBars
