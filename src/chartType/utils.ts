/**
 * 图表类型共享工具函数
 */
import type { KLineData } from 'klinecharts'
import { COLOR_UP, COLOR_DOWN } from '../types'

/**
 * 平均真实波幅（Average True Range）
 * 用于 Renko / RangeBars 等图表类型确定砖块/柱大小
 */
export function calcATR(dataList: KLineData[], period: number): number {
  if (dataList.length < 2) return 0
  let sum = 0
  const count = Math.min(period, dataList.length - 1)
  for (let i = 1; i <= count; i++) {
    const d = dataList[i]
    const prev = dataList[i - 1]
    sum += Math.max(d.high - d.low, Math.abs(d.high - prev.close), Math.abs(d.low - prev.close))
  }
  return sum / count
}

/**
 * 绘制砖块/柱状图（Renko / RangeBars / LineBreak 共用）
 */
export function drawBricks<T>(
  ctx: CanvasRenderingContext2D,
  bricks: T[],
  getHigh: (b: T) => number,
  getLow: (b: T) => number,
  getTrend: (b: T) => number,
  from: number,
  to: number,
  bounding: { left: number; width: number },
  yAxis: { convertToPixel: (value: number) => number },
): void {
  const visibleCount = to - from
  if (visibleCount <= 0) return

  const brickWidth = Math.max(1, bounding.width / visibleCount)
  const gap = 1

  for (let i = from; i < to; i++) {
    const brick = bricks[i]
    const x = bounding.left + (i - from) * brickWidth
    const yTop = yAxis.convertToPixel(getHigh(brick))
    const yBottom = yAxis.convertToPixel(getLow(brick))
    const height = Math.max(yBottom - yTop, 1)

    const color = getTrend(brick) > 0 ? COLOR_UP : COLOR_DOWN
    ctx.fillStyle = color
    ctx.fillRect(x + gap, yTop, brickWidth - gap * 2, height)
    ctx.strokeStyle = color
    ctx.lineWidth = 1
    ctx.strokeRect(x + gap, yTop, brickWidth - gap * 2, height)
  }
}
