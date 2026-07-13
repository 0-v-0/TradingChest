/**
 * Pivot Points - 轴心点
 * 基于前一根 K 线的最高价、最低价、收盘价计算支撑与阻力位
 *
 * 模式：
 *   0 = Standard（标准）
 *     Pivot (P)  = (H + L + C) / 3
 *     R1 = 2P - L, S1 = 2P - H
 *     R2 = P + (H - L), S2 = P - (H - L)
 *     R3 = H + 2(P - L), S3 = L - 2(H - P)
 *
 *   1 = Fibonacci（斐波那契）
 *     P = (H + L + C) / 3
 *     R1 = P + 0.382 * (H - L)
 *     R2 = P + 0.618 * (H - L)
 *     R3 = P + 1.000 * (H - L)
 *     S1 = P - 0.382 * (H - L)
 *     S2 = P - 0.618 * (H - L)
 *     S3 = P - 1.000 * (H - L)
 *
 *   2 = Camarilla（卡米拉）
 *     P = (H + L + C) / 3
 *     R1 = C + 1.1 * (H - L) / 12
 *     R2 = C + 1.1 * (H - L) / 6
 *     R3 = C + 1.1 * (H - L) / 4
 *     S1 = C - 1.1 * (H - L) / 12
 *     S2 = C - 1.1 * (H - L) / 6
 *     S3 = C - 1.1 * (H - L) / 4
 */
import type { IndicatorTemplate, KLineData } from 'klinecharts'

type PivotPointsResult = { pivot: number; r1: number; r2: number; r3: number; s1: number; s2: number; s3: number }

const pivotPoints: IndicatorTemplate<PivotPointsResult, number> = {
  name: 'PIVOTPOINTS',
  shortName: 'PivotPoints',
  calcParams: [0],
  figures: [
    { key: 'pivot', title: 'P: ', type: 'line' },
    { key: 'r1', title: 'R1: ', type: 'line' },
    { key: 'r2', title: 'R2: ', type: 'line' },
    { key: 'r3', title: 'R3: ', type: 'line' },
    { key: 's1', title: 'S1: ', type: 'line' },
    { key: 's2', title: 'S2: ', type: 'line' },
    { key: 's3', title: 'S3: ', type: 'line' },
  ],
  calc: (dataList: KLineData[], { calcParams: [mode] }) => {
    const n = dataList.length
    const result: PivotPointsResult[] = new Array(n)

    for (let i = 0; i < n; i++) {
      let pivot = NaN
      let r1 = NaN
      let r2 = NaN
      let r3 = NaN
      let s1 = NaN
      let s2 = NaN
      let s3 = NaN

      if (i > 0) {
        const prev = dataList[i - 1]
        const h = prev.high
        const l = prev.low
        const c = prev.close
        const hl = h - l

        pivot = (h + l + c) / 3

        if (mode === 1) {
          // Fibonacci
          r1 = pivot + 0.382 * hl
          r2 = pivot + 0.618 * hl
          r3 = pivot + 1.000 * hl
          s1 = pivot - 0.382 * hl
          s2 = pivot - 0.618 * hl
          s3 = pivot - 1.000 * hl
        } else if (mode === 2) {
          // Camarilla
          r1 = c + 1.1 * hl / 12
          r2 = c + 1.1 * hl / 6
          r3 = c + 1.1 * hl / 4
          s1 = c - 1.1 * hl / 12
          s2 = c - 1.1 * hl / 6
          s3 = c - 1.1 * hl / 4
        } else {
          // Standard (default)
          r1 = 2 * pivot - l
          s1 = 2 * pivot - h
          r2 = pivot + hl
          s2 = pivot - hl
          r3 = h + 2 * (pivot - l)
          s3 = l - 2 * (h - pivot)
        }
      }

      result[i] = { pivot, r1, r2, r3, s1, s2, s3 }
    }

    return result
  },
}

export default pivotPoints
