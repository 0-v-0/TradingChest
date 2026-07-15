/**
 * Bollinger Band Width - 布林带宽度
 * 衡量布林带上下轨之间的距离相对于中轨的百分比
 * BBW = (上轨 - 下轨) / 中轨 * 100 = 2 * multiplier * stddev / sma * 100
 */
import { calcSMA, calcStdDev, extractField } from '../utils'
import type { IndicatorTemplate, KLineData } from 'klinecharts'

type BollingerBandWidthResult = { bbw: number }

const bollingerBandWidth: IndicatorTemplate<BollingerBandWidthResult, number> = {
  name: 'BBW',
  shortName: 'BBW',
  calcParams: [20, 2],
  figures: [{ key: 'bbw', title: 'BBW: ', type: 'line' }],
  calc: (dataList: KLineData[], { calcParams: [period, stddevMultiplier] }) => {
    const n = dataList.length
    const closes = extractField(dataList, 'close')
    const smas = calcSMA(closes, period)
    const stddevs = calcStdDev(closes, period)
    const result: BollingerBandWidthResult[] = new Array(n)
    for (let i = 0; i < n; i++) {
      const sma = smas[i]
      const stddev = stddevs[i]
      result[i] = (isNaN(sma) || isNaN(stddev))
        ? { bbw: NaN }
        : { bbw: sma === 0 ? 0 : ((2 * stddevMultiplier * stddev) / sma) * 100 }
    }
    return result
  },
}

export default bollingerBandWidth
