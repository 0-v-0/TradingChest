/**
 * Williams %R - 威廉指标（独立版）
 * %R = (HighestHigh - Close) / (HighestHigh - LowestLow) × (-100)
 * 范围 [-100, 0]，超买区 < -20，超卖区 > -80
 */
import type { IndicatorTemplate, KLineData } from 'klinecharts'
import { calcHighest, calcLowest } from '../utils'

const williamsR: IndicatorTemplate = {
  name: 'WilliamsR',
  shortName: 'Williams %R',
  calcParams: [14],
  figures: [
    { key: 'wr', title: '%R: ', type: 'line' },
  ],
  calc: (dataList: KLineData[], indicator) => {
    const params = indicator.calcParams
    const period = params[0] as number

    const high = dataList.map(k => k.high)
    const low = dataList.map(k => k.low)
    const highest = calcHighest(high, period)
    const lowest = calcLowest(low, period)

    return dataList.map((k, i) => {
      const hh = highest[i]
      const ll = lowest[i]
      if (hh === null || ll === null || hh === ll) {
        return { wr: undefined }
      }
      return { wr: ((hh - k.close) / (hh - ll)) * -100 }
    })
  },
}

export default williamsR
