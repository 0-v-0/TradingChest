import { utils, type Coordinate, type Bounding, type LineAttrs, type CircleAttrs, type TextAttrs, type OverlayTemplate } from 'klinecharts'

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

export function getRayLine(coordinates: Coordinate[], bounding: Bounding): LineAttrs | null {
  if (coordinates.length < 2) return null

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

export function getRayLines(coordinates: Coordinate[], bounding: Bounding): LineAttrs[] {
  const line = getRayLine(coordinates, bounding)
  return line ? [line] : []
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

/**
 * 将毫秒时间差格式化为可读文本
 * 根据跨度自动选择合适的单位
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) {
    const remainHours = hours % 24
    return remainHours > 0 ? `${days}天${remainHours}小时` : `${days}天`
  }
  if (hours > 0) {
    const remainMinutes = minutes % 60
    return remainMinutes > 0 ? `${hours}小时${remainMinutes}分` : `${hours}小时`
  }
  if (minutes > 0) {
    return `${minutes}分钟`
  }
  return `${seconds}秒`
}

/** Approximate pixel width per bar for estimating bar count from x-distance */
export const BAR_WIDTH_APPROX = 10

/** Computed price range figures shared by priceRange and dateAndPriceRange overlays */
export interface PriceRangeFigures {
  priceDiff: number
  percentChange: number
  isUp: boolean
  fillColor: string
  borderColor: string
  sign: string
  bars: number
}

export function computePriceRangeFigures(
  price1: number,
  price2: number,
  x1: number,
  x2: number,
): PriceRangeFigures {
  const priceDiff = price2 - price1
  const percentChange = (priceDiff / price1) * 100
  const isUp = priceDiff >= 0
  const bars = Math.abs(Math.round((x2 - x1) / BAR_WIDTH_APPROX))
  const fillColor = isUp ? 'rgba(38, 166, 154, 0.15)' : 'rgba(239, 83, 80, 0.15)'
  const borderColor = isUp ? 'rgba(38, 166, 154, 0.6)' : 'rgba(239, 83, 80, 0.6)'
  const sign = priceDiff >= 0 ? '+' : ''
  return { priceDiff, percentChange, isUp, fillColor, borderColor, sign, bars }
}

export function createWaveOverlay(name: string, totalStep: number): OverlayTemplate {
  return {
    name,
    totalStep,
    needDefaultPointFigure: true,
    needDefaultXAxisFigure: true,
    needDefaultYAxisFigure: true,
    createPointFigures: ({ coordinates }) => {
      const texts = coordinates.map((coordinate, i) => ({
        ...coordinate,
        text: `(${i})`,
        baseline: 'bottom',
      }))
      return [
        {
          type: 'line',
          attrs: { coordinates },
        },
        {
          type: 'text',
          ignoreEvent: true,
          attrs: texts,
        },
      ]
    },
  }
}

/**
 * From two diagonal corner coordinates, produce the 4 corners of a rectangle.
 */
export function createRectCoordinates(c0: Coordinate, c1: Coordinate): Coordinate[] {
  return [
    c0,
    { x: c1.x, y: c0.y },
    c1,
    { x: c0.x, y: c1.y },
  ]
}

/**
 * From two diagonal corners, produce 4 border line segments of a rectangle.
 */
export function createRectBorderLines(c0: Coordinate, c1: Coordinate): LineAttrs[] {
  return [
    { coordinates: [c0, { x: c1.x, y: c0.y }] },
    { coordinates: [{ x: c1.x, y: c0.y }, c1] },
    { coordinates: [c1, { x: c0.x, y: c1.y }] },
    { coordinates: [{ x: c0.x, y: c1.y }, c0] },
  ]
}

/**
 * Compute the angle of a line from c0 to c1, handling vertical lines.
 * Returns the angle in radians, oriented for use with getRotateCoordinate.
 */
export function getLineAngle(c0: Coordinate, c1: Coordinate): number {
  const flag = c1.x > c0.x ? 0 : 1
  const kb = utils.getLinearSlopeIntercept(c0, c1)
  if (kb) {
    return Math.atan(kb[0]) + Math.PI * flag
  }
  return c1.y > c0.y ? Math.PI / 2 : (Math.PI / 2) * 3
}

/**
 * Style configuration for text editing overlays (note, textAnnotation, callout, etc.).
 */
export interface TextStyle {
  color: string
  backgroundColor: string
  borderColor: string
  borderRadius: number
}

/**
 * Factory for text-editing overlays (note, textAnnotation, etc.).
 * Provides shared onDrawEnd (prompt dialog), onRightClick, and common defaults.
 */
export function createTextEditingOverlay(
  name: string,
  totalStep: number,
  style: TextStyle,
  textDefaults: { baseline: string; align: string },
  defaultText: string,
  promptMsg: string,
  extraFigures?: (coordinates: Coordinate[], overlay: { extendData: unknown }) => ReturnType<NonNullable<OverlayTemplate['createPointFigures']>>,
): OverlayTemplate {
  return {
    name,
    totalStep,
    needDefaultPointFigure: true,
    needDefaultXAxisFigure: true,
    needDefaultYAxisFigure: true,
    createPointFigures: ({ coordinates, overlay }) => {
      if (coordinates.length > 0) {
        const text = (overlay.extendData as string) || defaultText
        const rawExtras = extraFigures?.(coordinates, overlay)
        const extras = rawExtras == null ? [] : Array.isArray(rawExtras) ? rawExtras : [rawExtras]
        return [
          ...extras,
          {
            type: 'rectText',
            attrs: {
              x: coordinates[0].x,
              y: coordinates[0].y,
              text,
              baseline: textDefaults.baseline,
              align: textDefaults.align,
            },
            styles: {
              style: 'stroke_fill',
              ...style,
              borderSize: 1,
              paddingLeft: 8,
              paddingRight: 8,
              paddingTop: 6,
              paddingBottom: 6,
              size: 12,
            },
          },
        ]
      }
      return []
    },
    onDrawEnd: ({ overlay }) => {
      const input = window.prompt(
        promptMsg,
        (overlay.extendData as string) || defaultText,
      )
      if (input !== null && input.trim() !== '') {
        overlay.extendData = input.trim()
      }
      return true
    },
    onRightClick: () => false,
  }
}
