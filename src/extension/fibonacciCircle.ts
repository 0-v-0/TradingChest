import type { OverlayTemplate } from 'klinecharts'
import { createFibConcentricCircles } from './utils'

const fibonacciCircle: OverlayTemplate = {
  name: 'fibonacciCircle',
  totalStep: 3,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: true,
  needDefaultYAxisFigure: true,
  createPointFigures: ({ coordinates }) => {
    if (coordinates.length > 1) {
      const xDis = Math.abs(coordinates[0].x - coordinates[1].x)
      const yDis = Math.abs(coordinates[0].y - coordinates[1].y)
      const radius = Math.sqrt(xDis * xDis + yDis * yDis)
      const percents = [0.236, 0.382, 0.5, 0.618, 0.786, 1]
      const { circles, texts } = createFibConcentricCircles(percents, coordinates[0], radius)
      return [
        {
          type: 'circle',
          attrs: circles,
          styles: { style: 'stroke' },
        },
        {
          type: 'text',
          ignoreEvent: true,
          attrs: texts,
        },
      ]
    }
    return []
  },
}

export default fibonacciCircle
