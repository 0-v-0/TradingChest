/**
 * Bollinger Band Width - 布林带宽度
 * 衡量布林带上下轨之间的距离相对于中轨的百分比
 * BBW = (上轨 - 下轨) / 中轨 * 100 = 2 * multiplier * stddev / sma * 100
 */
import { calcSMA, calcStdDev } from '../utils'
import type { IndicatorTemplate, KLineData } from 'klinecharts'

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
    const closes = dataList.map(k => k.close)
    const smas = calcSMA(closes, period)
    const stddevs = calcStdDev(closes, period)
    return smas.map((sma, i) => {
      const stddev = stddevs[i]
      if (Number.isNaN(sma) || Number.isNaN(stddev)) return { bbw: NaN }
      const bbw = sma === 0 ? 0 : ((2 * stddevMultiplier * stddev) / sma) * 100
      return { bbw }
    })
  },
}

export default bollingerBandWidth
