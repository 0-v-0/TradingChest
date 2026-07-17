import { createBaseOverlay, createRectCoordinates } from './utils'
import { COLOR_PRIMARY_ALPHA_15 } from '../types'

export default createBaseOverlay('rect', 3, ({ coordinates }) => {
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
}, { styles: { polygon: { color: COLOR_PRIMARY_ALPHA_15 } } })
