import type { IndicatorTemplate, KLineData } from 'klinecharts'
import { COLOR_UP, COLOR_DOWN } from '../types'

export interface PnFBox {
  priceLevel: number
  timestamp: number
}

export interface PnFColumn {
  boxes: PnFBox[]
  trend: number
  startPrice: number
  endPrice: number
}

export function calcPointAndFigure(dataList: KLineData[], boxSize: number, reversal: number): PnFColumn[] {
  if (dataList.length === 0 || boxSize <= 0) return []

  const columns: PnFColumn[] = []

  for (let i = 0; i < dataList.length; i++) {
    const d = dataList[i]

    if (columns.length === 0) {
      const trend = d.close >= d.open ? 1 : -1
      const startPrice = trend === 1
        ? Math.floor(d.close / boxSize) * boxSize
        : Math.ceil(d.close / boxSize) * boxSize

      const boxes: PnFBox[] = []
      if (trend === 1) {
        const highestBox = Math.floor(d.high / boxSize) * boxSize
        for (let p = startPrice; p <= highestBox; p += boxSize) {
          boxes.push({ priceLevel: p, timestamp: d.timestamp })
        }
      } else {
        const lowestBox = Math.ceil(d.low / boxSize) * boxSize
        for (let p = startPrice; p >= lowestBox; p -= boxSize) {
          boxes.push({ priceLevel: p, timestamp: d.timestamp })
        }
      }

      if (boxes.length > 0) {
        columns.push({
          boxes,
          trend,
          startPrice: boxes[0].priceLevel,
          endPrice: boxes[boxes.length - 1].priceLevel,
        })
      }
    } else {
      const lastCol = columns[columns.length - 1]

      if (lastCol.trend === 1) {
        if (d.high >= lastCol.endPrice + boxSize) {
          const highestBox = Math.floor(d.high / boxSize) * boxSize
          for (let p = lastCol.endPrice + boxSize; p <= highestBox; p += boxSize) {
            lastCol.boxes.push({ priceLevel: p, timestamp: d.timestamp })
          }
          lastCol.endPrice = highestBox
        }
        if (d.low <= lastCol.endPrice - boxSize * reversal) {
          const lowestBox = Math.ceil(d.low / boxSize) * boxSize
          const boxes: PnFBox[] = []
          for (let p = lastCol.endPrice - boxSize; p >= lowestBox; p -= boxSize) {
            boxes.push({ priceLevel: p, timestamp: d.timestamp })
          }
          if (boxes.length > 0) {
            columns.push({
              boxes,
              trend: -1,
              startPrice: boxes[0].priceLevel,
              endPrice: boxes[boxes.length - 1].priceLevel,
            })
          }
        }
      } else {
        if (d.low <= lastCol.endPrice - boxSize) {
          const lowestBox = Math.ceil(d.low / boxSize) * boxSize
          for (let p = lastCol.endPrice - boxSize; p >= lowestBox; p -= boxSize) {
            lastCol.boxes.push({ priceLevel: p, timestamp: d.timestamp })
          }
          lastCol.endPrice = lowestBox
        }
        if (d.high >= lastCol.endPrice + boxSize * reversal) {
          const highestBox = Math.floor(d.high / boxSize) * boxSize
          const boxes: PnFBox[] = []
          for (let p = lastCol.endPrice + boxSize; p <= highestBox; p += boxSize) {
            boxes.push({ priceLevel: p, timestamp: d.timestamp })
          }
          if (boxes.length > 0) {
            columns.push({
              boxes,
              trend: 1,
              startPrice: boxes[0].priceLevel,
              endPrice: boxes[boxes.length - 1].priceLevel,
            })
          }
        }
      }
    }
  }

  return columns
}

/** Cache key for PnF columns: data length + last timestamp + params */
interface PnFCacheKey {
  dataLen: number
  lastTs: number
  boxSize: number
  reversal: number
}

let _pnfCacheKey: PnFCacheKey | null = null
let _pnfCacheColumns: PnFColumn[] = []

const pointAndFigure: IndicatorTemplate<object, number> = {
  name: 'PointAndFigure',
  shortName: 'PF',
  calcParams: [1, 3],
  figures: [],
  calc: (dataList: KLineData[]) => {
    return dataList.map(() => ({}))
  },
  draw: ({ ctx, chart, indicator: { calcParams: [boxSize = 1, reversal = 3] }, bounding, yAxis }) => {
    const dataList = chart.getDataList()
    if (!dataList || dataList.length === 0) return false

    const adjustedBoxSize = Math.max(boxSize, 0.01)
    const adjustedReversal = Math.max(reversal, 1)

    // Cache columns: only recalculate when data or params change
    const cacheKey: PnFCacheKey = {
      dataLen: dataList.length,
      lastTs: dataList[dataList.length - 1].timestamp,
      boxSize: adjustedBoxSize,
      reversal: adjustedReversal,
    }
    if (
      !_pnfCacheKey ||
      _pnfCacheKey.dataLen !== cacheKey.dataLen ||
      _pnfCacheKey.lastTs !== cacheKey.lastTs ||
      _pnfCacheKey.boxSize !== cacheKey.boxSize ||
      _pnfCacheKey.reversal !== cacheKey.reversal
    ) {
      _pnfCacheColumns = calcPointAndFigure(dataList, adjustedBoxSize, adjustedReversal)
      _pnfCacheKey = cacheKey
    }

    const columns = _pnfCacheColumns
    if (columns.length === 0) return false

    const visibleRange = chart.getVisibleRange()
    const from = Math.max(0, visibleRange.from)
    const to = Math.min(columns.length, visibleRange.to)
    const visibleCount = to - from
    if (visibleCount <= 0) return false

    const colWidth = Math.max(1, bounding.width / visibleCount)
    const fontSize = Math.max(8, colWidth * 0.7)

    ctx.font = `${fontSize}px monospace`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    for (let ci = from; ci < to; ci++) {
      const col = columns[ci]
      const x = bounding.left + (ci - from) * colWidth + colWidth / 2

      for (const box of col.boxes) {
        const yTop = yAxis.convertToPixel(box.priceLevel + adjustedBoxSize)
        const yBottom = yAxis.convertToPixel(box.priceLevel)
        const yCenter = (yTop + yBottom) / 2
        const boxHeight = yBottom - yTop

        if (col.trend > 0) {
          ctx.fillStyle = COLOR_UP
          ctx.strokeStyle = COLOR_UP
          ctx.fillRect(x - colWidth / 4, yTop, colWidth / 2, boxHeight)
          ctx.strokeRect(x - colWidth / 4, yTop, colWidth / 2, boxHeight)
        } else {
          ctx.fillStyle = COLOR_DOWN
          ctx.strokeStyle = COLOR_DOWN
          ctx.beginPath()
          ctx.arc(x, yCenter, Math.min(colWidth / 4, boxHeight / 2.5), 0, Math.PI * 2)
          ctx.fill()
          ctx.stroke()
        }
      }
    }

    return true
  },
}

export default pointAndFigure
