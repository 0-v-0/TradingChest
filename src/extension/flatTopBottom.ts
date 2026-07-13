import type { OverlayTemplate } from 'klinecharts'

const flatTopBottom: OverlayTemplate = {
  name: 'flatTopBottom',
  totalStep: 3,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: true,
  needDefaultYAxisFigure: true,
  createPointFigures: ({ coordinates }) => {
    if (coordinates.length > 1) {
      const isTop = coordinates[0].y <= coordinates[1].y
      const label = isTop ? 'Top' : 'Bottom'
      const color = isTop ? 'rgba(239, 83, 80, 0.8)' : 'rgba(38, 166, 154, 0.8)'
      return [
        {
          type: 'line',
          attrs: { coordinates: [coordinates[0], { x: coordinates[1].x, y: coordinates[0].y }] },
          styles: { color },
        },
        {
          type: 'text',
          ignoreEvent: true,
          attrs: {
            x: coordinates[0].x,
            y: coordinates[0].y - (isTop ? 8 : -8),
            text: label,
            baseline: isTop ? 'bottom' : 'top',
          },
          styles: { color, size: 12 },
        },
      ]
    }
    return []
  },
}

export default flatTopBottom
