import type { OverlayTemplate } from 'klinecharts'
import { createFibHorizontalLines } from './utils'

const fibonacciSegment: OverlayTemplate = {
  name: 'fibonacciSegment',
  totalStep: 3,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: true,
  needDefaultYAxisFigure: true,
  createPointFigures: ({ coordinates, overlay, chart }) => {
    const precision = chart.getSymbol()?.pricePrecision ?? 2
    if (coordinates.length > 1) {
      const points = overlay.points
      const v0 = points[0].value
      const v1 = points[1].value
      if (v0 == null || v1 == null) return [{ type: 'line', attrs: [] }, { type: 'text', ignoreEvent: true, attrs: [] }]
      const percents = [1, 0.786, 0.618, 0.5, 0.382, 0.236, 0]
      const yDif = coordinates[0].y - coordinates[1].y
      const valueDif = v0 - v1
      const { lines, texts } = createFibHorizontalLines(
        percents,
        coordinates[0].x,
        coordinates[1].x,
        coordinates[1].y,
        yDif,
        (percent) => `${(v1 + valueDif * percent).toFixed(precision)} (${(percent * 100).toFixed(1)}%)`,
      )
      return [
        { type: 'line', attrs: lines },
        { type: 'text', ignoreEvent: true, attrs: texts },
      ]
    }
    return [
      { type: 'line', attrs: [] },
      { type: 'text', ignoreEvent: true, attrs: [] },
    ]
  },
}

export default fibonacciSegment
