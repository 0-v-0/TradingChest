import { createTextEditingOverlay } from './utils'

const callout = createTextEditingOverlay(
  'callout',
  3,
  {
    color: '#1677FF',
    backgroundColor: 'rgba(22, 119, 255, 0.15)',
    borderColor: 'rgba(22, 119, 255, 0.6)',
    borderRadius: 4,
  },
  { baseline: 'middle', align: 'center' },
  'Note',
  '输入标注文字 / Enter text:',
  (coordinates) => [
    {
      type: 'line',
      attrs: {
        coordinates: [coordinates[0], coordinates[1]],
      },
    },
    {
      type: 'circle',
      ignoreEvent: true,
      attrs: {
        x: coordinates[0].x,
        y: coordinates[0].y,
        r: 4,
      },
      styles: {
        style: 'fill',
        color: '#1677FF',
      },
    },
  ],
)

export default callout
