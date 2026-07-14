/**
 * HMA - Hull 移动平均线
 * HMA = WMA(2 * WMA(n/2) - WMA(n), sqrt(n))
 * 同时保持平滑度和减少滞后
 */
import type { IndicatorTemplate, KLineData } from 'klinecharts'
import { calcWMA } from '../utils'

type HmaResult = { hma: number }

const hma: IndicatorTemplate<HmaResult, number> = {
  name: 'HMA',
  shortName: 'HMA',
  calcParams: [9],
  figures: [{ key: 'hma', title: 'HMA: ', type: 'line' }],
  calc: (dataList: KLineData[], { calcParams: [period] }) => {
    const n = dataList.length
    const halfPeriod = Math.floor(period / 2)
    const sqrtPeriod = Math.round(Math.sqrt(period))

    const closes = dataList.map(k => k.close)

    // WMA(n/2) 和 WMA(n)
    const wmaHalf = calcWMA(closes, halfPeriod)
    const wmaFull = calcWMA(closes, period)

    // 中间序列：2 * WMA(n/2) - WMA(n)
    const diffSeries = new Array<number>(n)
    for (let i = 0; i < n; i++) {
      if (!Number.isNaN(wmaHalf[i]) && !Number.isNaN(wmaFull[i])) {
        diffSeries[i] = 2 * wmaHalf[i] - wmaFull[i]
      } else {
        diffSeries[i] = NaN
      }
    }

    // 对中间序列再做 WMA(sqrt(n))
    // diffSeries 的 NaN 仅出现在前缀，找到第一个有效值后使用 calcWMA
    let firstValid = -1
    for (let k = 0; k < n; k++) {
      if (!Number.isNaN(diffSeries[k])) {
        firstValid = k
        break
      }
    }

    const hmaValues = new Array<number>(n).fill(NaN)
    if (firstValid >= 0) {
      const validSlice = diffSeries.slice(firstValid)
      const wmaResult = calcWMA(validSlice, sqrtPeriod)
      for (let k = 0; k < wmaResult.length; k++) {
        hmaValues[firstValid + k] = wmaResult[k]
      }
    }

    const result: HmaResult[] = new Array(n)
    for (let i = 0; i < n; i++) {
      result[i] = { hma: hmaValues[i] }
    }
    return result
  },
}

export default hma
