/**
 * SuperTrend - 超级趋势指标
 * 基于 ATR 波段的趋势方向判断指标
 */
import type { IndicatorTemplate, KLineData } from 'klinecharts'

type SuperTrendResult = { up: number | undefined; down: number | undefined }

const superTrend: IndicatorTemplate = {
  name: 'SUPERTREND',
  shortName: 'SuperTrend',
  calcParams: [10, 3],
  figures: [
    { key: 'up', title: 'Up: ', type: 'line' },
    { key: 'down', title: 'Down: ', type: 'line' },
  ],
  calc: (dataList: KLineData[], indicator) => {
    const params = indicator.calcParams
    const period = params[0] as number
    const multiplier = params[1] as number
    const result: SuperTrendResult[] = []

    // 先计算 ATR（Wilder 平滑）
    const atrValues: number[] = []
    let rma = 0
    for (let i = 0; i < dataList.length; i++) {
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
      if (i < period) {
        rma += tr
        if (i === period - 1) {
          rma = rma / period
        }
        atrValues.push(i === period - 1 ? rma : 0)
      } else {
        rma = (rma * (period - 1) + tr) / period
        atrValues.push(rma)
      }
    }

    // 计算 SuperTrend
    let prevUpperBand = 0
    let prevLowerBand = 0
    let prevSuperTrend = 0
    // 趋势方向：1 = 上升, -1 = 下降
    let direction: number

    for (let i = 0; i < dataList.length; i++) {
      let up = undefined
      let down = undefined

      if (i >= period) {
        const kline = dataList[i]
        const atrVal = atrValues[i]
        const hl2 = (kline.high + kline.low) / 2

        // 基础上下轨
        let upperBand = hl2 + multiplier * atrVal
        let lowerBand = hl2 - multiplier * atrVal

        // 与前值比较，确保波段不会反向收缩
        if (i > period) {
          if (lowerBand <= prevLowerBand && dataList[i - 1].close >= prevLowerBand) {
            lowerBand = prevLowerBand
          }
          if (upperBand >= prevUpperBand && dataList[i - 1].close <= prevUpperBand) {
            upperBand = prevUpperBand
          }
        }

        // 判断趋势方向
        if (i === period) {
          direction = kline.close <= upperBand ? 1 : -1
        } else {
          if (prevSuperTrend === prevUpperBand) {
            // 之前在下降趋势
            direction = kline.close > upperBand ? 1 : -1
          } else {
            // 之前在上升趋势
            direction = kline.close < lowerBand ? -1 : 1
          }
        }

        const superTrendVal = direction === 1 ? lowerBand : upperBand

        up = direction === 1 ? superTrendVal : undefined
        down = direction === -1 ? superTrendVal : undefined

        prevUpperBand = upperBand
        prevLowerBand = lowerBand
        prevSuperTrend = superTrendVal
      }
      result.push({ up, down })
    }

    return result
  },
}

export default superTrend
