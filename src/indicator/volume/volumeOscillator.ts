/**
 * Volume Oscillator - 成交量震荡
 * VO = EMA(volume, fastPeriod) - EMA(volume, slowPeriod)
 * 正值表示短期成交量均值高于长期，成交量放大
 */
import type { IndicatorTemplate, KLineData } from 'klinecharts'
import { calcEMA, extractField } from '../utils'

type VolumeOscillatorResult = { vo: number }

const volumeOscillator: IndicatorTemplate<VolumeOscillatorResult, number> = {
  name: 'VolumeOscillator',
  shortName: 'VO',
  calcParams: [14, 28],
  figures: [
    { key: 'vo', title: 'VO: ', type: 'bar' },
  ],
  calc: (dataList: KLineData[], { calcParams: [fastPeriod, slowPeriod] }) => {
    const n = dataList.length
    const result: VolumeOscillatorResult[] = new Array(n)

    const volume = extractField(dataList, 'volume')
    const fastEma = calcEMA(volume, fastPeriod)
    const slowEma = calcEMA(volume, slowPeriod)

    for (let i = 0; i < n; i++) {
      const fast = fastEma[i]
      const slow = slowEma[i]
      result[i] = (isNaN(fast) || isNaN(slow)) ? { vo: NaN } : { vo: fast - slow }
    }
    return result
  },
}

export default volumeOscillator
