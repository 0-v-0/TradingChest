import { createBaseOverlay, getRotateCoordinate, getLineAngle } from './utils'

export default createBaseOverlay('arrow', 3, ({ coordinates }) => {
  if (coordinates.length > 1) {
    const offsetAngle = getLineAngle(coordinates[0], coordinates[1])
    const rotateCoordinate1 = getRotateCoordinate(
      { x: coordinates[1].x - 8, y: coordinates[1].y + 4 },
      coordinates[1],
      offsetAngle,
    )
    const rotateCoordinate2 = getRotateCoordinate(
      { x: coordinates[1].x - 8, y: coordinates[1].y - 4 },
      coordinates[1],
      offsetAngle,
    )
    return [
      {
        type: 'line',
        attrs: { coordinates },
      },
      {
        type: 'line',
        ignoreEvent: true,
        attrs: { coordinates: [rotateCoordinate1, coordinates[1], rotateCoordinate2] },
      },
    ]
  }
  return []
})
