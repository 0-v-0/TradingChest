import type { OverlayTemplate } from 'klinecharts'
import { formatDuration, createRectCoordinates, createRectBorderLines, computePriceRangeFigures } from './utils'

/**
 * 综合测量工具（类似 TradingView 的日期和价格区间测量）
 * 两次点击确定矩形区域，同时显示价格变动、涨跌幅、K 线根数及时间跨度
 * 上涨绿色，下跌红色
 */
const dateAndPriceRange: OverlayTemplate = {
  name: 'dateAndPriceRange',
  totalStep: 3,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: true,
  needDefaultYAxisFigure: true,
  createPointFigures: ({ coordinates, overlay, chart }) => {
    const precision = chart.getSymbol()?.pricePrecision ?? 2
    if (coordinates.length > 1) {
      const points = overlay.points
      const price1 = points[0].value
      const price2 = points[1].value
      const ts1 = points[0].timestamp
      const ts2 = points[1].timestamp
      if (price1 == null || price2 == null || ts1 == null || ts2 == null) return []

      const { priceDiff, percentChange, fillColor, borderColor, sign, bars } = computePriceRangeFigures(
        price1, price2, coordinates[0].x, coordinates[1].x,
      )

      // 计算时间跨度
      const timeDiffMs = Math.abs(ts2 - ts1)
      const durationText = formatDuration(timeDiffMs)

      const line1 = `${sign}${priceDiff.toFixed(precision)}  (${sign}${percentChange.toFixed(2)}%)`
      const line2 = `${bars} 根  |  ${durationText}`

      // 文本位置：矩形中间
      const textX = (coordinates[0].x + coordinates[1].x) / 2
      const textY = (coordinates[0].y + coordinates[1].y) / 2

      return [
        // 填充矩形
        {
          type: 'polygon',
          ignoreEvent: true,
          attrs: {
            coordinates: createRectCoordinates(coordinates[0], coordinates[1]),
          },
          styles: { style: 'fill', color: fillColor },
        },
        // 边框线
        {
          type: 'line',
          attrs: createRectBorderLines(coordinates[0], coordinates[1]),
          styles: { color: borderColor },
        },
        // 对角连线（起点到终点）
        {
          type: 'line',
          attrs: { coordinates: [coordinates[0], coordinates[1]] },
          styles: { style: 'dashed', color: borderColor },
        },
        // 第一行文本：价格差和涨跌幅
        {
          type: 'rectText',
          ignoreEvent: true,
          attrs: {
            x: textX,
            y: textY - 10,
            text: line1,
            baseline: 'bottom',
            align: 'center',
          },
        },
        // 第二行文本：K 线数和时间跨度
        {
          type: 'rectText',
          ignoreEvent: true,
          attrs: {
            x: textX,
            y: textY + 10,
            text: line2,
            baseline: 'top',
            align: 'center',
          },
        },
      ]
    }
    return []
  },
}

export default dateAndPriceRange
