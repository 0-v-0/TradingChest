import type { OverlayTemplate } from 'klinecharts'
import { createFibHorizontalLines } from './utils'

const fibonacciExtension: OverlayTemplate = {
  name: 'fibonacciExtension',
  totalStep: 4,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: true,
  needDefaultYAxisFigure: true,
  createPointFigures: ({ coordinates, overlay, chart }) => {
    const precision = chart.getSymbol()?.pricePrecision ?? 2
    const points = overlay.points
    const v0 = points[0].value
    const v1 = points[1].value
    const v2 = points[2]?.value
    if (v0 == null || v1 == null || v2 == null || coordinates.length < 3) return [{ type: 'line', attrs: [] }, { type: 'text', ignoreEvent: true, attrs: [] }]
    const valueDif = v1 - v0
    const yDif = coordinates[1].y - coordinates[0].y
    const percents = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1]
    const { lines: fbLines, texts } = createFibHorizontalLines(
      percents,
      coordinates[1].x,
      coordinates[2].x,
      coordinates[2].y,
      yDif,
      (percent) => `${(v2 + valueDif * percent).toFixed(precision)} (${(percent * 100).toFixed(1)}%)`,
    )
    return [
      {
        type: 'line',
        attrs: { coordinates },
        styles: { style: 'dashed' },
      },
      {
        type: 'line',
        attrs: fbLines,
      },
      {
        type: 'text',
        ignoreEvent: true,
        attrs: texts,
      },
    ]
  },
}

export default fibonacciExtension
