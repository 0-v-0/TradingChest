import type { OverlayTemplate } from 'klinecharts'
import { COLOR_FORECAST } from '../types'

const forecast: OverlayTemplate = {
  name: 'forecast',
  totalStep: 3,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: true,
  needDefaultYAxisFigure: true,
  createPointFigures: ({ coordinates }) => {
    if (coordinates.length > 1) {
      const c0 = coordinates[0]
      const c1 = coordinates[1]
      const dx = c1.x - c0.x
      const dy = c1.y - c0.y
      const len = Math.sqrt(dx * dx + dy * dy) || 1
      const c2 = { x: c1.x + dx, y: c1.y + dy }
      const perpX = (-dy / len) * 10
      const perpY = (dx / len) * 10
      const coneTop = { x: c1.x + perpX, y: c1.y + perpY }
      const coneBot = { x: c1.x - perpX, y: c1.y - perpY }
      const coneTopEnd = { x: c2.x + perpX * 2, y: c2.y + perpY * 2 }
      const coneBotEnd = { x: c2.x - perpX * 2, y: c2.y - perpY * 2 }

      return [
        {
          type: 'line',
          attrs: { coordinates: [c0, c2] },
          styles: { color: COLOR_FORECAST, size: 1.5 },
        },
        {
          type: 'polygon',
          ignoreEvent: true,
          attrs: { coordinates: [coneTop, coneTopEnd, coneBotEnd, coneBot] },
          styles: { color: 'rgba(52, 152, 219, 0.1)', style: 'fill' },
        },
        {
          type: 'line',
          attrs: { coordinates: [coneTop, coneTopEnd] },
          styles: { color: 'rgba(52, 152, 219, 0.4)', size: 1, style: 'dashed' },
        },
        {
          type: 'line',
          attrs: { coordinates: [coneBot, coneBotEnd] },
          styles: { color: 'rgba(52, 152, 219, 0.4)', size: 1, style: 'dashed' },
        },
        {
          type: 'text',
          ignoreEvent: true,
          attrs: { x: c2.x, y: c2.y - 12, text: 'Forecast', baseline: 'bottom' },
          styles: { color: COLOR_FORECAST, size: 11 },
        },
      ]
    }
    return []
  },
}

export default forecast