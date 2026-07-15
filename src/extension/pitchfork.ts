import type { OverlayTemplate, LineAttrs, Coordinate, Bounding } from 'klinecharts'
import { getRayLine } from './utils'

/**
 * 通用音叉绘制逻辑
 * @param adjustPivot 可选的枢轴点调整函数（希夫变体用它调整 Y 坐标）
 */
function createPitchforkFigures(
  coordinates: Coordinate[],
  bounding: Bounding,
  adjustPivot?: (pivot: Coordinate, swing1: Coordinate) => Coordinate,
) {
  if (coordinates.length < 2) return []

  // 两点时先画引导线
  if (coordinates.length === 2) {
    return [
      {
        type: 'line' as const,
        ignoreEvent: true,
        attrs: { coordinates },
      },
    ]
  }

  const originalPivot = coordinates[0]
  const swing1 = coordinates[1]
  const swing2 = coordinates[2]

  const pivot = adjustPivot ? adjustPivot(originalPivot, swing1) : originalPivot

  // 两摆动点的中点
  const midPoint = {
    x: (swing1.x + swing2.x) / 2,
    y: (swing1.y + swing2.y) / 2,
  }

  // 中线方向向量（pivot → midPoint）
  const dx = midPoint.x - pivot.x
  const dy = midPoint.y - pivot.y

  // 中线：从枢轴点出发，经过中点，延伸至图表边界
  const medianRay = getRayLine([pivot, midPoint], bounding)

  // 上外线
  const upperRay = getRayLine([swing1, { x: swing1.x + dx, y: swing1.y + dy }], bounding)

  // 下外线
  const lowerRay = getRayLine([swing2, { x: swing2.x + dx, y: swing2.y + dy }], bounding)

  // 50% 内线
  const innerUpperStart = {
    x: (midPoint.x + swing1.x) / 2,
    y: (midPoint.y + swing1.y) / 2,
  }
  const innerUpperRay = getRayLine([innerUpperStart, { x: innerUpperStart.x + dx, y: innerUpperStart.y + dy }], bounding)

  const innerLowerStart = {
    x: (midPoint.x + swing2.x) / 2,
    y: (midPoint.y + swing2.y) / 2,
  }
  const innerLowerRay = getRayLine([innerLowerStart, { x: innerLowerStart.x + dx, y: innerLowerStart.y + dy }], bounding)

  // 收集主线
  const mainLines: LineAttrs[] = []
  if (medianRay) mainLines.push(medianRay)
  if (upperRay) mainLines.push(upperRay)
  if (lowerRay) mainLines.push(lowerRay)

  // 连接线：原始枢轴 → 各摆动点（虚线辅助参考）
  const connectLines: LineAttrs[] = [
    { coordinates: [originalPivot, swing1] },
    { coordinates: [originalPivot, swing2] },
  ]

  // 内线（50%，虚线）
  const innerLines: LineAttrs[] = []
  if (innerUpperRay) innerLines.push(innerUpperRay)
  if (innerLowerRay) innerLines.push(innerLowerRay)

  return [
    { type: 'line' as const, attrs: connectLines, styles: { style: 'dashed' } },
    { type: 'line' as const, attrs: mainLines },
    { type: 'line' as const, attrs: innerLines, styles: { style: 'dashed' } },
  ]
}

/**
 * 安德鲁音叉（Andrew's Pitchfork）
 * 3 个点：枢轴点（pivot）、两个摆动点（swing high/low）
 * 绘制：中线（枢轴 → 两摆动点中点）+ 两条平行外线 + 两条 50% 内线
 */
const pitchfork: OverlayTemplate = {
  name: 'pitchfork',
  totalStep: 4,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: true,
  needDefaultYAxisFigure: true,
  createPointFigures: ({ coordinates, bounding }) => createPitchforkFigures(coordinates, bounding),
}

export { createPitchforkFigures }
export default pitchfork
