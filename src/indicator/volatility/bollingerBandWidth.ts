/**
 * Bollinger Band Width - 布林带宽度
 * 衡量布林带上下轨之间的距离相对于中轨的百分比
 * BBW = (上轨 - 下轨) / 中轨 * 100
 */
import type { IndicatorTemplate, KLineData } from 'klinecharts'

type BollingerBandWidthResult = { bbw: number }

const bollingerBandWidth: IndicatorTemplate = {
  name: 'BBW',
  shortName: 'BBW',
  calcParams: [20, 2],
  figures: [{ key: 'bbw', title: 'BBW: ', type: 'line' }],
  calc: (dataList: KLineData[], indicator) => {
    const params = indicator.calcParams
    const period = params[0] as number
    const stddevMultiplier = params[1] as number
    if (period <= 0) return dataList.map(() => ({ bbw: NaN }))
    const result: BollingerBandWidthResult[] = []

    for (let i = 0; i < dataList.length; i++) {
      if (i < period - 1) {
        // 数据不足一个完整周期
        result.push({ bbw: NaN })
        continue
      }

      // 计算 SMA（中轨）
      let sum = 0
      for (let j = i - period + 1; j <= i; j++) {
        sum += dataList[j].close
      }
      const sma = sum / period

      // 计算总体标准差
      let varianceSum = 0
      for (let j = i - period + 1; j <= i; j++) {
        const diff = dataList[j].close - sma
        varianceSum += diff * diff
      }
      const stddev = Math.sqrt(varianceSum / period)

      // 上轨和下轨
      const upper = sma + stddevMultiplier * stddev
      const lower = sma - stddevMultiplier * stddev

      // 布林带宽度 = (上轨 - 下轨) / 中轨 * 100
      // 防止中轨为零的极端情况
      const bbw = sma === 0 ? 0 : ((upper - lower) / sma) * 100
      result.push({ bbw })
    }
    return result
  },
}

export default bollingerBandWidth
