/**
 * Aroon - 阿隆指标
 *
 * 衡量自最近最高价/最低价以来经过的时间，判断趋势方向与强度。
 * AroonUp = ((period - 距最高价天数) / period) * 100
 * AroonDown = ((period - 距最低价天数) / period) * 100
 * Aroon Oscillator = AroonUp - AroonDown
 */
import type { IndicatorTemplate, KLineData } from 'klinecharts'
import { calcHighestIdx, calcLowestIdx } from '../utils'

type AroonResult = {
  aroonUp: number
  aroonDown: number
  oscillator: number
}

const aroon: IndicatorTemplate<AroonResult, number> = {
  name: 'AROON',
  shortName: 'Aroon',
  calcParams: [25],
  figures: [
    { key: 'aroonUp', title: 'Up: ', type: 'line' },
    { key: 'aroonDown', title: 'Down: ', type: 'line' },
    { key: 'oscillator', title: 'Osc: ', type: 'line' },
  ],
  calc: (dataList: KLineData[], { calcParams: [period] }) => {
    const len = dataList.length
    const result: AroonResult[] = new Array(len)

    const highs = dataList.map(d => d.high)
    const lows = dataList.map(d => d.low)

    // Aroon 窗口为 period+1 个元素（含当前 bar）
    const highestIdxs = calcHighestIdx(highs, period + 1)
    const lowestIdxs = calcLowestIdx(lows, period + 1)

    for (let i = 0; i < len; i++) {
      let aroonUp = NaN
      let aroonDown = NaN
      let oscillator = NaN

      if (i >= period) {
        const daysSinceHigh = i - highestIdxs[i]
        const daysSinceLow = i - lowestIdxs[i]

        aroonUp = ((period - daysSinceHigh) / period) * 100
        aroonDown = ((period - daysSinceLow) / period) * 100
        oscillator = aroonUp - aroonDown
      }

      result[i] = { aroonUp, aroonDown, oscillator }
    }

    return result
  },
}

export default aroon
