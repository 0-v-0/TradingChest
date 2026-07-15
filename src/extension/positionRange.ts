/**
 * 持仓区间覆盖工具
 * 两个对角点定义矩形，半透明填充 + 边框
 * 专为程序化创建设计（非用户绘图），totalStep 设为 0 表示无需用户交互
 */

import type { OverlayTemplate, OverlayFigure } from 'klinecharts'
import { COLOR_UP_ALPHA_15, COLOR_UP_ALPHA_60, COLOR_UP_ALPHA_80 } from '../types'

const positionRange: OverlayTemplate = {
  name: 'positionRange',
  totalStep: 3,
  needDefaultPointFigure: false,
  needDefaultXAxisFigure: false,
  needDefaultYAxisFigure: false,
  createPointFigures: ({ coordinates, overlay }) => {
    if (coordinates.length < 2) return []

    const x1 = coordinates[0].x
    const y1 = coordinates[0].y
    const x2 = coordinates[1].x
    const y2 = coordinates[1].y

    const minX = Math.min(x1, x2)
    const minY = Math.min(y1, y2)
    const maxX = Math.max(x1, x2)
    const maxY = Math.max(y1, y2)

    const figures: OverlayFigure[] = []

    // 半透明填充矩形
    figures.push({
      type: 'polygon',
      attrs: {
        coordinates: [
          { x: minX, y: minY },
          { x: maxX, y: minY },
          { x: maxX, y: maxY },
          { x: minX, y: maxY },
        ],
      },
      styles: {
        style: 'fill',
        color: overlay.styles?.polygon?.color ?? COLOR_UP_ALPHA_15,
      },
    })

    // 边框
    figures.push({
      type: 'polygon',
      attrs: {
        coordinates: [
          { x: minX, y: minY },
          { x: maxX, y: minY },
          { x: maxX, y: maxY },
          { x: minX, y: maxY },
        ],
      },
      styles: {
        style: 'stroke',
        borderColor: overlay.styles?.polygon?.borderColor ?? COLOR_UP_ALPHA_60,
        borderSize: overlay.styles?.polygon?.borderSize ?? 1,
        borderStyle: 'dashed',
      },
    })

    // 中间 PnL 标签
    const text = typeof overlay.extendData === 'string' ? overlay.extendData : ''
    if (text) {
      figures.push({
        type: 'rectText',
        ignoreEvent: true,
        attrs: {
          x: (minX + maxX) / 2,
          y: (minY + maxY) / 2,
          text: text,
          align: 'center',
          baseline: 'middle',
        },
        styles: {
          style: 'stroke_fill',
          color: '#fff',
          backgroundColor: overlay.styles?.polygon?.borderColor ?? COLOR_UP_ALPHA_80,
          borderColor: 'transparent',
          borderSize: 0,
          borderRadius: 3,
          paddingLeft: 6,
          paddingRight: 6,
          paddingTop: 3,
          paddingBottom: 3,
          size: 11,
        },
      })
    }

    return figures
  },
}

export default positionRange
