import { createBaseOverlay } from './utils'
import { COLOR_PRIMARY_ALPHA_15 } from '../types'

export default createBaseOverlay('triangle', 4, ({ coordinates }) => {
  return [
    {
      type: 'polygon',
      attrs: { coordinates },
      styles: { style: 'stroke_fill' },
    },
  ]
}, { styles: { polygon: { color: COLOR_PRIMARY_ALPHA_15 } } })
