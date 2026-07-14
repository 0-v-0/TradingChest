import type { OverlayTemplate } from 'klinecharts'
import { getDistance, getRotateCoordinate, getRayLines, getLineAngle } from './utils'

const fibonacciSpiral: OverlayTemplate = {
  name: 'fibonacciSpiral',
  totalStep: 3,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: true,
  needDefaultYAxisFigure: true,
  createPointFigures: ({ coordinates, bounding }) => {
    if (coordinates.length > 1) {
      const startRadius = getDistance(coordinates[0], coordinates[1]) / Math.sqrt(24)
      const offsetAngle = getLineAngle(coordinates[0], coordinates[1])
      const rotateCoordinate1 = getRotateCoordinate(
        { x: coordinates[0].x - startRadius, y: coordinates[0].y },
        coordinates[0],
        offsetAngle,
      )
      const rotateCoordinate2 = getRotateCoordinate(
        { x: coordinates[0].x - startRadius, y: coordinates[0].y - startRadius },
        coordinates[0],
        offsetAngle,
      )
      const arcs = [
        {
          ...rotateCoordinate1,
          r: startRadius,
          startAngle: offsetAngle,
          endAngle: offsetAngle + Math.PI / 2,
        },
        {
          ...rotateCoordinate2,
          r: startRadius * 2,
          startAngle: offsetAngle + Math.PI / 2,
          endAngle: offsetAngle + Math.PI,
        },
      ]
      let x = coordinates[0].x - startRadius
      let y = coordinates[0].y - startRadius
      for (let i = 2; i < 9; i++) {
        const r = arcs[i - 2].r + arcs[i - 1].r
        const index = i % 4
        const startAngle = offsetAngle + (Math.PI / 2) * index
        x += (index - 1) % 2 * arcs[i - 2].r
        y += index % 2 * (index - 2) * arcs[i - 2].r
        const endAngle = startAngle + Math.PI / 2
        const rotateCoordinate = getRotateCoordinate({ x, y }, coordinates[0], offsetAngle)
        arcs.push({
          ...rotateCoordinate,
          r,
          startAngle,
          endAngle,
        })
      }
      return [
        {
          type: 'arc',
          attrs: arcs,
        },
        {
          type: 'line',
          attrs: getRayLines(coordinates, bounding),
        },
      ]
    }
    return []
  },
}

export default fibonacciSpiral
