import { createBaseOverlay, getDistance } from './utils'
import { COLOR_PRIMARY_ALPHA_15 } from '../types'

export default createBaseOverlay('circle', 3, ({ coordinates }) => {
  if (coordinates.length > 1) {
    const radius = getDistance(coordinates[0], coordinates[1])
    return {
      type: 'circle',
      attrs: {
        ...coordinates[0],
        r: radius,
      },
      styles: { style: 'stroke_fill' },
    }
  }
  return []
}, { styles: { circle: { color: COLOR_PRIMARY_ALPHA_15 } } })
