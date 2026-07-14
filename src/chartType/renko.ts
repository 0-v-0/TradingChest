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

    const bricks = calcRenkoBricks(dataList, brickSize)
    if (bricks.length === 0) return false

    const visibleRange = chart.getVisibleRange()
    const from = Math.max(0, visibleRange.from)
    const to = Math.min(bricks.length, visibleRange.to)

    drawBricks(ctx, bricks, b => b.brickHigh, b => b.brickLow, b => b.trend, from, to, bounding, yAxis)
    return true
  },
}

export default renko
