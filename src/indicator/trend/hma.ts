/**
 * HMA - Hull 移动平均线
 * HMA = WMA(2 * WMA(n/2) - WMA(n), sqrt(n))
 * 同时保持平滑度和减少滞后
 */
import type { IndicatorTemplate, KLineData } from 'klinecharts'

type HmaResult = { hma: number }

/**
 * 计算 WMA 值序列
 */
function calcWmaArray(values: number[], period: number): number[] {
  const len = values.length
  const weightSum = period * (period + 1) / 2
  const result = new Array<number>(len)

  for (let i = 0; i < len; i++) {
    if (i < period - 1 || isNaN(values[i])) {
      result[i] = NaN
      continue
    }
    let sum = 0
    let valid = true
    for (let j = 0; j < period; j++) {
      const val = values[i - period + 1 + j]
      if (isNaN(val)) {
        valid = false
        break
      }
      sum += val * (j + 1)
    }
    result[i] = valid ? sum / weightSum : NaN
  }
  return result
}

const hma: IndicatorTemplate<HmaResult, number> = {
  name: 'HMA',
  shortName: 'HMA',
  calcParams: [9],
  figures: [{ key: 'hma', title: 'HMA: ', type: 'line' }],
  calc: (dataList: KLineData[], { calcParams: [period] }) => {
    const n = dataList.length
    const halfPeriod = Math.floor(period / 2)
    const sqrtPeriod = Math.round(Math.sqrt(period))

    const closes = dataList.map((k) => k.close)

    // WMA(n/2) 和 WMA(n)
    const wmaHalf = calcWmaArray(closes, halfPeriod)
    const wmaFull = calcWmaArray(closes, period)

    // 中间序列：2 * WMA(n/2) - WMA(n)
    const diffSeries = new Array<number>(n)
    for (let i = 0; i < n; i++) {
      if (!isNaN(wmaHalf[i]) && !isNaN(wmaFull[i])) {
        diffSeries[i] = 2 * wmaHalf[i] - wmaFull[i]
      } else {
        diffSeries[i] = NaN
      }
    }

    // 对中间序列再做 WMA(sqrt(n))
    const hmaValues = calcWmaArray(diffSeries, sqrtPeriod)

    const result: HmaResult[] = new Array(n)
    for (let i = 0; i < n; i++) {
      result[i] = { hma: hmaValues[i] }
    }
    return result
  },
}

export default hma
