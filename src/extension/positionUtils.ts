import type { OverlayTemplate, OverlayFigure } from 'klinecharts'
import type { Direction } from '../types'

// 交易视觉颜色常量
const STOP_LOSS_FILL = 'rgba(239, 83, 80, 0.15)'
const STOP_LOSS_BORDER = 'rgba(239, 83, 80, 0.6)'
const STOP_LOSS_TEXT = 'rgba(239, 83, 80, 1)'
const TAKE_PROFIT_FILL = 'rgba(38, 166, 154, 0.15)'
const TAKE_PROFIT_BORDER = 'rgba(38, 166, 154, 0.6)'
const TAKE_PROFIT_TEXT = 'rgba(38, 166, 154, 1)'
const ENTRY_LINE = '#1677FF'
const RR_BG = 'rgba(22, 119, 255, 0.1)'
const RR_BORDER = 'rgba(22, 119, 255, 0.4)'

function createPositionFigures(
  side: Direction,
): NonNullable<OverlayTemplate['createPointFigures']> {
  return ({ coordinates, overlay, chart }) => {
    const precision = chart.getSymbol()?.pricePrecision ?? 2
    if (coordinates.length < 2) {
      return []
    }

    const points = overlay.points
    const entryPrice = points[0].value!
    const stopLossPrice = points[1].value!

    const entryY = coordinates[0].y
    const stopLossY = coordinates[1].y
    const leftX = coordinates[0].x
    const rightX = coordinates[1].x

    const figures: OverlayFigure[] = []

    figures.push({
      type: 'polygon',
      ignoreEvent: true,
      attrs: {
        coordinates: [
          { x: leftX, y: entryY },
          { x: rightX, y: entryY },
          { x: rightX, y: stopLossY },
          { x: leftX, y: stopLossY },
        ],
      },
      styles: { style: 'fill', color: STOP_LOSS_FILL },
    })

    figures.push({
      type: 'line',
      attrs: {
        coordinates: [
          { x: leftX, y: entryY },
          { x: rightX, y: entryY },
        ],
      },
      styles: { color: ENTRY_LINE, style: 'dashed' },
    })

    figures.push({
      type: 'line',
      ignoreEvent: true,
      attrs: {
        coordinates: [
          { x: leftX, y: stopLossY },
          { x: rightX, y: stopLossY },
        ],
      },
      styles: { color: STOP_LOSS_BORDER },
    })

    const riskAmount = Math.abs(entryPrice - stopLossPrice)
    figures.push({
      type: 'rectText',
      ignoreEvent: true,
      attrs: {
        x: rightX,
        y: (entryY + stopLossY) / 2,
        text: `SL: ${stopLossPrice.toFixed(precision)} (-${riskAmount.toFixed(precision)})`,
        baseline: 'middle',
        align: 'left',
      },
      styles: {
        color: STOP_LOSS_TEXT,
        size: 11,
      },
    })

    if (coordinates.length > 2) {
      const takeProfitPrice = points[2].value!
      const takeProfitY = coordinates[2].y

      figures.push({
        type: 'polygon',
        ignoreEvent: true,
        attrs: {
          coordinates: [
            { x: leftX, y: entryY },
            { x: rightX, y: entryY },
            { x: rightX, y: takeProfitY },
            { x: leftX, y: takeProfitY },
          ],
        },
        styles: { style: 'fill', color: TAKE_PROFIT_FILL },
      })

      figures.push({
        type: 'line',
        ignoreEvent: true,
        attrs: {
          coordinates: [
            { x: leftX, y: takeProfitY },
            { x: rightX, y: takeProfitY },
          ],
        },
        styles: { color: TAKE_PROFIT_BORDER },
      })

      const rewardAmount = side === 'long'
        ? Math.abs(takeProfitPrice - entryPrice)
        : Math.abs(entryPrice - takeProfitPrice)
      const ratio = riskAmount > 0 ? (rewardAmount / riskAmount).toFixed(2) : '--'

      figures.push({
        type: 'rectText',
        ignoreEvent: true,
        attrs: {
          x: rightX,
          y: (entryY + takeProfitY) / 2,
          text: `TP: ${takeProfitPrice.toFixed(precision)} (+${rewardAmount.toFixed(precision)})`,
          baseline: 'middle',
          align: 'left',
        },
        styles: {
          color: TAKE_PROFIT_TEXT,
          size: 11,
        },
      })

      const rrY = side === 'long' ? entryY - 16 : entryY + 16
      const rrBaseline = side === 'long' ? 'bottom' : 'top'

      figures.push({
        type: 'rectText',
        ignoreEvent: true,
        attrs: {
          x: (leftX + rightX) / 2,
          y: rrY,
          text: `R/R: 1:${ratio}`,
          baseline: rrBaseline,
          align: 'center',
        },
        styles: {
          style: 'stroke_fill',
          color: ENTRY_LINE,
          backgroundColor: RR_BG,
          borderColor: RR_BORDER,
          borderSize: 1,
          borderRadius: 3,
          paddingLeft: 6,
          paddingRight: 6,
          paddingTop: 2,
          paddingBottom: 2,
          size: 12,
        },
      })
    }

    return figures
  }
}

export function createPositionOverlay(name: string, side: Direction): OverlayTemplate {
  return {
    name,
    totalStep: 4,
    needDefaultPointFigure: true,
    needDefaultXAxisFigure: true,
    needDefaultYAxisFigure: true,
    createPointFigures: createPositionFigures(side),
  }
}
