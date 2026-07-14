import type { OverlayTemplate } from 'klinecharts'
import { createRectCoordinates } from './utils'

const rect: OverlayTemplate = {
  name: 'rect',
  totalStep: 3,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: true,
  needDefaultYAxisFigure: true,
  styles: {
    polygon: {
      color: 'rgba(22, 119, 255, 0.15)',
    },
  },
  createPointFigures: ({ coordinates }) => {
    if (coordinates.length > 1) {
      return [
        {
          type: 'polygon',
          attrs: {
            coordinates: createRectCoordinates(coordinates[0], coordinates[1]),
          },
          styles: { style: 'stroke_fill' },
        },
      ]
    }
    return []
  },
}

export default rect
