import type { IndicatorTemplate, KLineData } from 'klinecharts'
import { drawBricks } from './utils'

export interface LineBreakLine {
  lbOpen: number
  lbClose: number
  lbHigh: number
  lbLow: number
  trend: number
  timestamp: number
}

export function calcLineBreak(dataList: KLineData[], lines: number): LineBreakLine[] {
  if (dataList.length === 0 || lines < 2) return []

  const result: LineBreakLine[] = []

  const firstClose = dataList[0].close
  result.push({
    lbOpen: firstClose,
    lbClose: firstClose,
    lbHigh: firstClose,
    lbLow: firstClose,
    trend: 1,
    timestamp: dataList[0].timestamp,
  })

  if (dataList.length === 1) return result

  const secondClose = dataList[1].close
  if (secondClose >= firstClose) {
    result.push({
      lbOpen: firstClose,
      lbClose: secondClose,
      lbHigh: Math.max(firstClose, secondClose),
      lbLow: Math.min(firstClose, secondClose),
      trend: 1,
      timestamp: dataList[1].timestamp,
    })
  } else {
    result.push({
      lbOpen: firstClose,
      lbClose: secondClose,
      lbHigh: Math.max(firstClose, secondClose),
      lbLow: Math.min(firstClose, secondClose),
      trend: -1,
      timestamp: dataList[1].timestamp,
    })
  }

  for (let i = 2; i < dataList.length; i++) {
    const d = dataList[i]
    const close = d.close

    // 直接在尾部 lines 条记录中找最高/最低，避免 slice + map 分配
    const start = Math.max(0, result.length - lines)
    let highestHigh = result[start].lbHigh
    let lowestLow = result[start].lbLow
    for (let j = start + 1; j < result.length; j++) {
      if (result[j].lbHigh > highestHigh) highestHigh = result[j].lbHigh
      if (result[j].lbLow < lowestLow) lowestLow = result[j].lbLow
    }

    const lastLine = result[result.length - 1]

    if (lastLine.trend === 1) {
      if (close > highestHigh) {
        result.push({
          lbOpen: lastLine.lbClose,
          lbClose: close,
          lbHigh: Math.max(lastLine.lbClose, close),
          lbLow: Math.min(lastLine.lbClose, close),
          trend: 1,
          timestamp: d.timestamp,
        })
      } else if (close < lowestLow) {
        result.push({
          lbOpen: lastLine.lbClose,
          lbClose: close,
          lbHigh: Math.max(lastLine.lbClose, close),
          lbLow: Math.min(lastLine.lbClose, close),
          trend: -1,
          timestamp: d.timestamp,
        })
      } else {
        lastLine.lbClose = close
        lastLine.lbHigh = Math.max(lastLine.lbHigh, close)
        lastLine.lbLow = Math.min(lastLine.lbLow, close)
      }
    } else {
      if (close < lowestLow) {
        result.push({
          lbOpen: lastLine.lbClose,
          lbClose: close,
          lbHigh: Math.max(lastLine.lbClose, close),
          lbLow: Math.min(lastLine.lbClose, close),
          trend: -1,
          timestamp: d.timestamp,
        })
      } else if (close > highestHigh) {
        result.push({
          lbOpen: lastLine.lbClose,
          lbClose: close,
          lbHigh: Math.max(lastLine.lbClose, close),
          lbLow: Math.min(lastLine.lbClose, close),
          trend: 1,
          timestamp: d.timestamp,
        })
      } else {
        lastLine.lbClose = close
        lastLine.lbHigh = Math.max(lastLine.lbHigh, close)
        lastLine.lbLow = Math.min(lastLine.lbLow, close)
      }
    }
  }

  return result
}

const lineBreak: IndicatorTemplate<object, number> = {
  name: 'LineBreak',
  shortName: 'LB',
  calcParams: [3],
  figures: [],
  calc: (dataList: KLineData[]) => {
    return dataList.map(() => ({}))
  },
  draw: ({ ctx, chart, indicator: { calcParams: [lines = 3] }, bounding, yAxis }) => {
    const dataList = chart.getDataList()
    if (!dataList || dataList.length < 2) return false

    const adjustedLines = Math.max(2, lines)
    const lineBreakLines = calcLineBreak(dataList, adjustedLines)
    if (lineBreakLines.length === 0) return false

    const visibleRange = chart.getVisibleRange()
    const from = Math.max(0, visibleRange.from)
    const to = Math.min(lineBreakLines.length, visibleRange.to)
    const visibleCount = to - from
    if (visibleCount <= 0) return false

    drawBricks(ctx, lineBreakLines, lb => lb.lbHigh, lb => lb.lbLow, lb => lb.trend, from, to, bounding, yAxis)

    return true
  },
}

export default lineBreak
