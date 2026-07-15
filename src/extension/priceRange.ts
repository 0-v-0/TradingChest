import type { OverlayTemplate } from 'klinecharts'
import { createRectCoordinates, createRectBorderLines, computePriceRangeFigures } from './utils'

/**
 * 价格区间测量工具
 * 两次点击确定价格区间，显示价格差、涨跌幅百分比、K线根数
 * 上涨显示绿色，下跌显示红色
 */
const priceRange: OverlayTemplate = {
  name: 'priceRange',
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
      if (price1 == null || price2 == null) return []

      const { priceDiff, percentChange, fillColor, borderColor, sign, bars } = computePriceRangeFigures(
        price1, price2, coordinates[0].x, coordinates[1].x,
      )

      const displayText = `${sign}${priceDiff.toFixed(precision)}  (${sign}${percentChange.toFixed(2)}%)  ${bars} 根`

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
        // 测量文本
        {
          type: 'rectText',
          ignoreEvent: true,
          attrs: {
            x: textX,
            y: textY,
            text: displayText,
            baseline: 'middle',
            align: 'center',
          },
        },
      ]
    }
    return []
  },
}

export default priceRange
