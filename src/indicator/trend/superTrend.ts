/**
 * SuperTrend - 超级趋势指标
 * 基于 ATR 波段的趋势方向判断指标
 */
import type { IndicatorTemplate, KLineData } from 'klinecharts'

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

    const atrValues = new Array<number>(n)
    let rma = 0
    for (let i = 0; i < n; i++) {
      const kline = dataList[i]
      let tr: number
      if (i === 0) {
        tr = kline.high - kline.low
      } else {
        const prevClose = dataList[i - 1].close
        tr = Math.max(
          kline.high - kline.low,
          Math.abs(kline.high - prevClose),
          Math.abs(kline.low - prevClose),
        )
      }
      if (i < period - 1) {
        rma += tr
        atrValues[i] = NaN
      } else if (i === period - 1) {
        rma = (rma + tr) / period
        atrValues[i] = rma
      } else {
        rma = (rma * (period - 1) + tr) / period
        atrValues[i] = rma
      }
    }

    let prevUpperBand = NaN
    let prevLowerBand = NaN
    let direction: number = 0 // 0 = 未初始化, 1 = 上升, -1 = 下降

    for (let i = 0; i < n; i++) {
      let up = NaN
      let down = NaN

      if (i >= period - 1) {
        const kline = dataList[i]
        const atrVal = atrValues[i]
        const hl2 = (kline.high + kline.low) / 2

        let upperBand = hl2 + multiplier * atrVal
        let lowerBand = hl2 - multiplier * atrVal

        if (i > period - 1) {
          if (lowerBand <= prevLowerBand && dataList[i - 1].close >= prevLowerBand) {
            lowerBand = prevLowerBand
          }
          if (upperBand >= prevUpperBand && dataList[i - 1].close <= prevUpperBand) {
            upperBand = prevUpperBand
          }
        }

        if (direction === 0) {
          direction = kline.close <= upperBand ? 1 : -1
        } else if (direction === -1) {
          if (kline.close > upperBand) direction = 1
        } else if (direction === 1) {
          if (kline.close < lowerBand) direction = -1
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
