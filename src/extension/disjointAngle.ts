import { type OverlayTemplate } from 'klinecharts'

const disjointAngle: OverlayTemplate = {
  name: 'disjointAngle',
  totalStep: 4,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: true,
  needDefaultYAxisFigure: true,
  createPointFigures: ({ coordinates }) => {
    if (coordinates.length === 3) {
      const dx1 = coordinates[0].x - coordinates[1].x
      const dy1 = coordinates[0].y - coordinates[1].y
      const dx2 = coordinates[2].x - coordinates[1].x
      const dy2 = coordinates[2].y - coordinates[1].y
      const angleRad = Math.atan2(dy2, dx2) - Math.atan2(dy1, dx1)
      let angleDeg = Math.abs(angleRad * 180 / Math.PI)
      if (angleDeg > 180) angleDeg = 360 - angleDeg
      const angleText = `${angleDeg.toFixed(1)}°`

      return [
        {
          type: 'line',
          attrs: { coordinates: [coordinates[0], coordinates[1]] },
        },
        {
          type: 'line',
          attrs: { coordinates: [coordinates[1], coordinates[2]] },
        },
        {
          type: 'text',
          ignoreEvent: true,
          attrs: {
            x: coordinates[1].x + 10,
            y: coordinates[1].y - 10,
            text: angleText,
          },
          styles: { color: '#3498db', size: 12 },
        },
      ]
    }
    return []
  },
}

export default disjointAngle
