/**
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at

 * http://www.apache.org/licenses/LICENSE-2.0

 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { utils, type Coordinate, type Bounding, type LineAttrs, type CircleAttrs, type TextAttrs } from 'klinecharts'

export function getRotateCoordinate(
  coordinate: Coordinate,
  targetCoordinate: Coordinate,
  angle: number,
): Coordinate {
  const x =
    (coordinate.x - targetCoordinate.x) * Math.cos(angle) -
    (coordinate.y - targetCoordinate.y) * Math.sin(angle) +
    targetCoordinate.x
  const y =
    (coordinate.x - targetCoordinate.x) * Math.sin(angle) +
    (coordinate.y - targetCoordinate.y) * Math.cos(angle) +
    targetCoordinate.y
  return { x, y }
}

export function getRayLine(coordinates: Coordinate[], bounding: Bounding): LineAttrs | LineAttrs[] {
  if (coordinates.length > 1) {
    let coordinate: Coordinate
    if (coordinates[0].x === coordinates[1].x && coordinates[0].y !== coordinates[1].y) {
      if (coordinates[0].y < coordinates[1].y) {
        coordinate = {
          x: coordinates[0].x,
          y: bounding.height,
        }
      } else {
        coordinate = {
          x: coordinates[0].x,
          y: 0,
        }
      }
    } else if (coordinates[0].x > coordinates[1].x) {
      coordinate = {
        x: 0,
        y: utils.getLinearYFromCoordinates(coordinates[0], coordinates[1], {
          x: 0,
          y: coordinates[0].y,
        }),
      }
    } else {
      coordinate = {
        x: bounding.width,
        y: utils.getLinearYFromCoordinates(coordinates[0], coordinates[1], {
          x: bounding.width,
          y: coordinates[0].y,
        }),
      }
    }
    return { coordinates: [coordinates[0], coordinate] }
  }
  return []
}

export function getDistance(coordinate1: Coordinate, coordinate2: Coordinate): number {
  const xDis = Math.abs(coordinate1.x - coordinate2.x)
  const yDis = Math.abs(coordinate1.y - coordinate2.y)
  return Math.sqrt(xDis * xDis + yDis * yDis)
}

/**
 * Creates horizontal line segments at fibonacci percentage levels.
 * Each line spans from leftX to rightX at a y-position computed as:
 *   y = baseY + yDiff * percent
 *
 * @param percents - Fibonacci percentage levels (e.g. [1, 0.786, 0.618, ...])
 * @param leftX - X coordinate of the left end of each line
 * @param rightX - X coordinate of the right end of each line
 * @param baseY - The y coordinate corresponding to percent=0
 * @param yDiff - The y-difference (topY - bottomY) used to compute y for each percent
 * @param priceMapper - Function that maps a percent to its price label string
 */
export function createFibHorizontalLines(
  percents: number[],
  leftX: number,
  rightX: number,
  baseY: number,
  yDiff: number,
  priceMapper: (percent: number) => string,
): { lines: LineAttrs[], texts: TextAttrs[] } {
  const lines: LineAttrs[] = []
  const texts: TextAttrs[] = []
  const textX = leftX < rightX ? leftX : rightX
  for (const percent of percents) {
    const y = baseY + yDiff * percent
    lines.push({
      coordinates: [
        { x: leftX, y },
        { x: rightX, y },
      ],
    })
    texts.push({
      x: textX,
      y,
      text: priceMapper(percent),
      baseline: 'bottom',
    })
  }
  return { lines, texts }
}

/**
 * Creates concentric circles at fibonacci percentage levels around a center point.
 *
 * @param percents - Fibonacci percentage levels (e.g. [0.236, 0.382, ...])
 * @param center - Center coordinate of the circles
 * @param radius - Full radius (100%) from center
 */
export function createFibConcentricCircles(
  percents: number[],
  center: Coordinate,
  radius: number,
): { circles: CircleAttrs[], texts: TextAttrs[] } {
  const circles: CircleAttrs[] = []
  const texts: TextAttrs[] = []
  for (const percent of percents) {
    const r = radius * percent
    circles.push({ ...center, r })
    texts.push({
      x: center.x,
      y: center.y + r + 6,
      text: `${(percent * 100).toFixed(1)}%`,
    })
  }
  return { circles, texts }
}
