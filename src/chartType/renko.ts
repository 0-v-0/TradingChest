import type { IndicatorTemplate, KLineData } from 'klinecharts'

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

const renko: IndicatorTemplate = {
  name: 'Renko',
  shortName: 'RN',
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
    const brickSize = Math.max(atrVal, 0.01)
    if (brickSize <= 0) return false

    const bricks = calcRenkoBricks(dataList, brickSize)
    if (bricks.length === 0) return false

    const visibleRange = chart.getVisibleRange()
    const from = Math.max(0, visibleRange.from)
    const to = Math.min(bricks.length, visibleRange.to)
    const visibleCount = to - from
    if (visibleCount <= 0) return false

    const brickWidth = Math.max(1, bounding.width / visibleCount)
    const gap = 1

    for (let i = from; i < to; i++) {
      const brick = bricks[i]
      const x = bounding.left + (i - from) * brickWidth
      const yTop = yAxis.convertToPixel(brick.brickHigh)
      const yBottom = yAxis.convertToPixel(brick.brickLow)
      const height = Math.max(yBottom - yTop, 1)

      if (brick.trend > 0) {
        ctx.fillStyle = '#26a69a'
        ctx.fillRect(x + gap, yTop, brickWidth - gap * 2, height)
        ctx.strokeStyle = '#26a69a'
        ctx.lineWidth = 1
        ctx.strokeRect(x + gap, yTop, brickWidth - gap * 2, height)
      } else {
        ctx.fillStyle = '#ef5350'
        ctx.fillRect(x + gap, yTop, brickWidth - gap * 2, height)
        ctx.strokeStyle = '#ef5350'
        ctx.lineWidth = 1
        ctx.strokeRect(x + gap, yTop, brickWidth - gap * 2, height)
      }
    }

    return true
  },
}

export default renko
