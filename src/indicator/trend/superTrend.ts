/**
 * SuperTrend - 超级趋势指标
 * 基于 ATR 波段的趋势方向判断指标
 */
import type { IndicatorTemplate, KLineData } from 'klinecharts'
import { calcTR, calcRMA } from '../utils'

type SuperTrendResult = { up: number; down: number }

const superTrend: IndicatorTemplate<SuperTrendResult, number> = {
  name: 'SUPERTREND',
  shortName: 'SuperTrend',
  calcParams: [10, 3],
  figures: [
    { key: 'up', title: 'Up: ', type: 'line' },
    { key: 'down', title: 'Down: ', type: 'line' },
  ],
  calc: (dataList: KLineData[], { calcParams: [period, multiplier] }) => {
    const n = dataList.length
    const result: SuperTrendResult[] = new Array(n)

    const high = new Array<number>(n)
    const low = new Array<number>(n)
    const close = new Array<number>(n)
    for (let i = 0; i < n; i++) {
      const d = dataList[i]
      high[i] = d.high
      low[i] = d.low
      close[i] = d.close
    }

    const tr = calcTR(high, low, close)
    const atrValues = calcRMA(tr, period)

    let prevUpperBand = NaN
    let prevLowerBand = NaN
    let direction: number = 0 // 0 = 未初始化, 1 = 上升, -1 = 下降

    for (let i = 0; i < n; i++) {
      let up = NaN
      let down = NaN

      if (i >= period - 1) {
        const atrVal = atrValues[i]
        const hl2 = (high[i] + low[i]) / 2

        let upperBand = hl2 + multiplier * atrVal
        let lowerBand = hl2 - multiplier * atrVal

        if (i > period - 1) {
          if (lowerBand <= prevLowerBand && close[i - 1] >= prevLowerBand) {
            lowerBand = prevLowerBand
          }
          if (upperBand >= prevUpperBand && close[i - 1] <= prevUpperBand) {
            upperBand = prevUpperBand
          }
        }

        if (direction === 0) {
          direction = close[i] <= upperBand ? 1 : -1
        } else if (direction === -1) {
          if (close[i] > upperBand) direction = 1
        } else if (direction === 1) {
          if (close[i] < lowerBand) direction = -1
        }

        const superTrendVal = direction === 1 ? lowerBand : upperBand

        up = direction === 1 ? superTrendVal : NaN
        down = direction === -1 ? superTrendVal : NaN

        prevUpperBand = upperBand
        prevLowerBand = lowerBand
      }
      result[i] = { up, down }
    }

    return result
  },
}

export default superTrend
