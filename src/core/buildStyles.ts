/**
 * Converts simple overlay style inputs into complete klinecharts style objects.
 *
 * @remarks
 * Every call to `overrideOverlay` must supply the full style tree; partial updates
 * trigger a shallow merge in klinecharts that silently drops unspecified properties.
 * This function rebuilds the entire style object from the four canonical inputs so
 * callers never need to reason about that invariant themselves.
 */

export type LineStyle = 'solid' | 'dashed' | 'dotted'

export interface OverlayStyleInput {
  color: string
  fillColor?: string
  lineWidth: number
  lineStyle: LineStyle
}

const DASH_SOLID: readonly number[] = Object.freeze([0])
export const DASH_DASHED: readonly number[] = Object.freeze([6, 4])
export const DASH_DOTTED: readonly number[] = Object.freeze([1, 3])

export function buildStyles(s: OverlayStyleInput): Record<string, unknown> {
  const lineStyleKC = s.lineStyle === 'dashed' || s.lineStyle === 'dotted' ? 'dashed' : 'solid'
  const dashedValue: readonly number[] =
    s.lineStyle === 'dashed' ? DASH_DASHED :
    s.lineStyle === 'dotted' ? DASH_DOTTED : DASH_SOLID

  const fc = s.fillColor ?? 'rgba(0,0,0,0)'
  const hasFill = s.fillColor != null

  const lineStyles = { color: s.color, size: s.lineWidth, style: lineStyleKC, dashedValue }
  const pointStyles = { color: s.color }

  if (!hasFill) {
    return {
      line: lineStyles,
      point: pointStyles,
      arc: { color: s.color, style: lineStyleKC, dashedValue },
    }
  }

  const shapeStyles = {
    color: fc,
    borderColor: s.color,
    borderSize: s.lineWidth,
    borderStyle: lineStyleKC,
    borderDashedValue: dashedValue,
    style: 'stroke_fill',
  }
  return {
    line: lineStyles,
    point: pointStyles,
    polygon: shapeStyles,
    circle: shapeStyles,
    rect: { ...shapeStyles, borderRadius: 0 },
    arc: { color: s.color, style: lineStyleKC, dashedValue },
  }
}
