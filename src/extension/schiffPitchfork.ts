import type { OverlayTemplate } from 'klinecharts'
import pitchfork, { createPitchforkFigures } from './pitchfork'

/**
 * 希夫音叉（Schiff Pitchfork）
 * 与标准安德鲁音叉相同的 3 个输入点，但枢轴点在垂直方向上
 * 移至原始枢轴与第二个点的中点位置，使中线斜率更平缓。
 */
const schiffPitchfork: OverlayTemplate = {
  name: 'schiffPitchfork',
  totalStep: pitchfork.totalStep,
  needDefaultPointFigure: pitchfork.needDefaultPointFigure,
  needDefaultXAxisFigure: pitchfork.needDefaultXAxisFigure,
  needDefaultYAxisFigure: pitchfork.needDefaultYAxisFigure,
  createPointFigures: ({ coordinates, bounding }) =>
    createPitchforkFigures(coordinates, bounding, (pivot, swing1) => ({
      x: pivot.x,
      y: (pivot.y + swing1.y) / 2,
    })),
}

export default schiffPitchfork
