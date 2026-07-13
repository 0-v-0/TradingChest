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
    const valueDif = points[1].value! - points[0].value!
    const yDif = coordinates[1].y - coordinates[0].y
    const percents = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1]
    const { lines: fbLines, texts } = createFibHorizontalLines(
      percents,
      coordinates[1].x,
      coordinates[2].x,
      coordinates[2].y,
      yDif,
      (percent) => `${(points[2].value! + valueDif * percent).toFixed(precision)} (${(percent * 100).toFixed(1)}%)`,
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
