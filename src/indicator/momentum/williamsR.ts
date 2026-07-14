/**
 * Williams %R - 威廉指标（独立版）
 * %R = (HighestHigh - Close) / (HighestHigh - LowestLow) × (-100)
 * 范围 [-100, 0]，超买区 < -20，超卖区 > -80
 */
import type { IndicatorTemplate, KLineData } from 'klinecharts'
import { calcHighest, calcLowest } from '../utils'

type WilliamsRResult = { wr: number }

const williamsR: IndicatorTemplate<WilliamsRResult, number> = {
  name: 'WilliamsR',
  shortName: 'Williams %R',
  calcParams: [14],
  figures: [
    { key: 'wr', title: '%R: ', type: 'line' },
  ],
  calc: (dataList: KLineData[], { calcParams: [period] }) => {
    const n = dataList.length

    const high = new Array<number>(n)
    const low = new Array<number>(n)
    const close = new Array<number>(n)
    for (let i = 0; i < n; i++) {
      const k = dataList[i]
      high[i] = k.high
      low[i] = k.low
      close[i] = k.close
    }
    const highest = calcHighest(high, period)
    const lowest = calcLowest(low, period)

    const result: WilliamsRResult[] = new Array(n)
    for (let i = 0; i < n; i++) {
      const hh = highest[i]
      const ll = lowest[i]
      result[i] = (isNaN(hh) || isNaN(ll) || hh === ll)
        ? { wr: NaN }
        : { wr: ((hh - close[i]) / (hh - ll)) * -100 }
    }
    return result
  },
}

export default williamsR
