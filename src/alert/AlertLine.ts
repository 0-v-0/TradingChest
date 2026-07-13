import type { OverlayTemplate, DeepPartial, OverlayStyle } from 'klinecharts'
import { DASH_DASHED } from '../core/buildStyles'

const alertLine: OverlayTemplate = {
  name: 'alertLine',
  totalStep: 2,
  needDefaultPointFigure: false,
  needDefaultXAxisFigure: false,
  needDefaultYAxisFigure: true,
  createPointFigures: ({ coordinates, overlay, bounding }) => {
    const color = (overlay.styles as DeepPartial<OverlayStyle>)?.line?.color ?? '#ff9800'
    if (coordinates.length < 1) return []
    const y = coordinates[0].y
    return [
      {
        type: 'line',
        attrs: {
          coordinates: [
            { x: 0, y },
            { x: bounding.width, y },
          ],
        },
        styles: {
          color,
          size: 1,
          style: 'dashed',
          dashedValue: DASH_DASHED,
        },
      },
    ]
  },
}

export default alertLine
