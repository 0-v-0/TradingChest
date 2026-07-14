import { createTextEditingOverlay } from './utils'

const note = createTextEditingOverlay(
  'note',
  2,
  {
    color: '#333333',
    backgroundColor: 'rgba(255, 235, 59, 0.85)',
    borderColor: 'rgba(200, 180, 30, 0.8)',
    borderRadius: 2,
  },
  { baseline: 'top', align: 'left' },
  'Note',
  '输入便签内容 / Enter note:',
)

export default note
