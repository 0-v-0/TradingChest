import type { IndicatorTemplate, KLineData } from 'klinecharts'

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

    const lookback = result.slice(-lines)
    const highestHigh = Math.max(...lookback.map(l => l.lbHigh))
    const lowestLow = Math.min(...lookback.map(l => l.lbLow))

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

    const lineWidth = Math.max(1, bounding.width / visibleCount)
    const gap = 1

    for (let i = from; i < to; i++) {
      const lb = lineBreakLines[i]
      const x = bounding.left + (i - from) * lineWidth
      const yTop = yAxis.convertToPixel(lb.lbHigh)
      const yBottom = yAxis.convertToPixel(lb.lbLow)
      const height = Math.max(yBottom - yTop, 1)

      if (lb.trend > 0) {
        ctx.fillStyle = '#26a69a'
        ctx.fillRect(x + gap, yTop, lineWidth - gap * 2, height)
        ctx.strokeStyle = '#26a69a'
        ctx.lineWidth = 1
        ctx.strokeRect(x + gap, yTop, lineWidth - gap * 2, height)
      } else {
        ctx.fillStyle = '#ef5350'
        ctx.fillRect(x + gap, yTop, lineWidth - gap * 2, height)
        ctx.strokeStyle = '#ef5350'
        ctx.lineWidth = 1
        ctx.strokeRect(x + gap, yTop, lineWidth - gap * 2, height)
      }
    }

    return true
  },
}

export default lineBreak
