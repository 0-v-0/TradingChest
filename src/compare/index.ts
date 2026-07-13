import type { KLineData } from 'klinecharts'

/**
 * Normalizes a K-line data series into percentage change values relative to
 * the first bar's close price.
 *
 * @param data - Array of KLineData entries to normalize.
 * @returns Array of percentage change values where index 0 is always 0.
 */
export function normalizeToPercent(data: KLineData[]): number[] {
  if (data.length === 0) return []
  const basePrice = data[0].close
  if (basePrice === 0) return new Array<number>(data.length).fill(0)
  return data.map((d) => ((d.close - basePrice) / basePrice) * 100)
}
