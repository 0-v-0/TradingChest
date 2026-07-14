import { createTextEditingOverlay } from './utils'

const textAnnotation = createTextEditingOverlay(
  'textAnnotation',
  2,
  {
    color: '#1677FF',
    backgroundColor: 'rgba(22, 119, 255, 0.15)',
    borderColor: 'rgba(22, 119, 255, 0.6)',
    borderRadius: 4,
  },
  { baseline: 'middle', align: 'center' },
  'Text',
  '输入标注文字 / Enter text:',
)

export default textAnnotation
