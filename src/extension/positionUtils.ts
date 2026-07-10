import { OverlayTemplate, OverlayFigure } from 'klinecharts'

type PositionSide = 'long' | 'short'

function createPositionFigures(
  side: PositionSide,
): NonNullable<OverlayTemplate['createPointFigures']> {
  return ({ coordinates, overlay, precision }) => {
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

    const redColor = 'rgba(239, 83, 80, 0.15)'
    const redBorder = 'rgba(239, 83, 80, 0.6)'

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
      styles: { style: 'fill', color: redColor },
    })

    figures.push({
      type: 'line',
      attrs: {
        coordinates: [
          { x: leftX, y: entryY },
          { x: rightX, y: entryY },
        ],
      },
      styles: { color: '#1677FF', style: 'dashed' },
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
      styles: { color: redBorder },
    })

    const riskAmount = Math.abs(entryPrice - stopLossPrice)
    figures.push({
      type: 'rectText',
      ignoreEvent: true,
      attrs: {
        x: rightX,
        y: (entryY + stopLossY) / 2,
        text: `SL: ${stopLossPrice.toFixed(precision.price)} (-${riskAmount.toFixed(precision.price)})`,
        baseline: 'middle',
        align: 'left',
      },
      styles: {
        color: 'rgba(239, 83, 80, 1)',
        size: 11,
      },
    })

    if (coordinates.length > 2) {
      const takeProfitPrice = points[2].value!
      const takeProfitY = coordinates[2].y

      const greenColor = 'rgba(38, 166, 154, 0.15)'
      const greenBorder = 'rgba(38, 166, 154, 0.6)'

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
        styles: { style: 'fill', color: greenColor },
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
        styles: { color: greenBorder },
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
          text: `TP: ${takeProfitPrice.toFixed(precision.price)} (+${rewardAmount.toFixed(precision.price)})`,
          baseline: 'middle',
          align: 'left',
        },
        styles: {
          color: 'rgba(38, 166, 154, 1)',
          size: 11,
        },
      })

      const rrY = side === 'long' ? entryY - 16 : entryY + 16
      const rrBaseline = side === 'long' ? 'bottom' as const : 'top' as const

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
          color: '#1677FF',
          backgroundColor: 'rgba(22, 119, 255, 0.1)',
          borderColor: 'rgba(22, 119, 255, 0.4)',
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

export function createPositionOverlay(name: string, side: PositionSide): OverlayTemplate {
  return {
    name,
    totalStep: 4,
    needDefaultPointFigure: true,
    needDefaultXAxisFigure: true,
    needDefaultYAxisFigure: true,
    createPointFigures: createPositionFigures(side),
  }
}
