/**
 * HMA - Hull 移动平均线
 * HMA = WMA(2 * WMA(n/2) - WMA(n), sqrt(n))
 * 同时保持平滑度和减少滞后
 */
import type { IndicatorTemplate, KLineData } from 'klinecharts'

/**
 * 计算 WMA 值序列
 */
function calcWmaArray(values: number[], period: number): number[] {
  const weightSum = period * (period + 1) / 2
  const result: number[] = []

  for (let i = 0; i < values.length; i++) {
    if (i < period - 1 || isNaN(values[i])) {
      result.push(NaN)
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
    result.push(valid ? sum / weightSum : NaN)
  }
  return result
}

const hma: IndicatorTemplate = {
  name: 'HMA',
  shortName: 'HMA',
  calcParams: [9],
  figures: [{ key: 'hma', title: 'HMA: ', type: 'line' }],
  calc: (dataList: KLineData[], indicator) => {
    const params = indicator.calcParams
    const period = params[0] as number
    const halfPeriod = Math.floor(period / 2)
    const sqrtPeriod = Math.round(Math.sqrt(period))

    const closes = dataList.map((k) => k.close)

    // WMA(n/2) 和 WMA(n)
    const wmaHalf = calcWmaArray(closes, halfPeriod)
    const wmaFull = calcWmaArray(closes, period)

    // 中间序列：2 * WMA(n/2) - WMA(n)
    const diffSeries: number[] = []
    for (let i = 0; i < dataList.length; i++) {
      if (!isNaN(wmaHalf[i]) && !isNaN(wmaFull[i])) {
        diffSeries.push(2 * wmaHalf[i] - wmaFull[i])
      } else {
        diffSeries.push(NaN)
      }
    }

    // 对中间序列再做 WMA(sqrt(n))
    const hmaValues = calcWmaArray(diffSeries, sqrtPeriod)

    return dataList.map((_, i) => ({
      hma: hmaValues[i],
    }))
  },
}

export default hma
