/**
 * Donchian Channels - 唐奇安通道
 * 以过去 N 周期最高价和最低价构成的价格通道
 */
import { calcHighest, calcLowest } from '../utils'
import type { IndicatorTemplate, KLineData } from 'klinecharts'

type DonchianChannelsResult = { upper: number; lower: number; middle: number }

const donchianChannels: IndicatorTemplate<DonchianChannelsResult, number> = {
  name: 'DC',
  shortName: 'DC',
  calcParams: [20],
  figures: [
    { key: 'upper', title: 'UP: ', type: 'line' },
    { key: 'lower', title: 'LOW: ', type: 'line' },
    { key: 'middle', title: 'MID: ', type: 'line' },
  ],
  calc: (dataList: KLineData[], { calcParams: [period] }) => {
    const n = dataList.length
    const highs = dataList.map(k => k.high)
    const lows = dataList.map(k => k.low)
    const uppers = calcHighest(highs, period)
    const lowers = calcLowest(lows, period)
    const result: DonchianChannelsResult[] = new Array(n)
    for (let i = 0; i < n; i++) {
      const upper = uppers[i]
      const lower = lowers[i]
      if (Number.isNaN(upper) || Number.isNaN(lower)) { result[i] = { upper: NaN, lower: NaN, middle: NaN }; continue }
      result[i] = { upper, lower, middle: (upper + lower) / 2 }
    }
    return result
  },
}

export default donchianChannels
