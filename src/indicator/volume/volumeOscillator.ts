/**
 * Volume Oscillator - 成交量震荡
 * VO = EMA(volume, fastPeriod) - EMA(volume, slowPeriod)
 * 正值表示短期成交量均值高于长期，成交量放大
 */
import { IndicatorTemplate, KLineData } from 'klinecharts'
import { calcEMA } from '../utils'

const volumeOscillator: IndicatorTemplate = {
  name: 'VolumeOscillator',
  shortName: 'VO',
  calcParams: [14, 28],
  figures: [
    { key: 'vo', title: 'VO: ', type: 'bar' },
  ],
  calc: (dataList: KLineData[], indicator) => {
    const params = indicator.calcParams
    const fastPeriod = params[0] as number
    const slowPeriod = params[1] as number

    const volume = dataList.map(k => k.volume ?? 0)
    const fastEma = calcEMA(volume, fastPeriod)
    const slowEma = calcEMA(volume, slowPeriod)

    return dataList.map((_, i) => {
      const fast = fastEma[i]
      const slow = slowEma[i]
      if (fast === null || slow === null) {
        return { vo: undefined }
      }
      return { vo: fast - slow }
    })
  },
}

export default volumeOscillator
