/**
 * Donchian Channels - 唐奇安通道
 * 以过去 N 周期最高价和最低价构成的价格通道
 */
import { calcHighest, calcLowest } from '../utils'
import type { IndicatorTemplate, KLineData } from 'klinecharts'

const donchianChannels: IndicatorTemplate = {
  name: 'DC',
  shortName: 'DC',
  calcParams: [20],
  figures: [
    { key: 'upper', title: 'UP: ', type: 'line' },
    { key: 'lower', title: 'LOW: ', type: 'line' },
    { key: 'middle', title: 'MID: ', type: 'line' },
  ],
  calc: (dataList: KLineData[], indicator) => {
    const params = indicator.calcParams
    const period = params[0] as number
    if (period <= 0) return dataList.map(() => ({ upper: NaN, lower: NaN, middle: NaN }))
    const highs = dataList.map(k => k.high)
    const lows = dataList.map(k => k.low)
    const uppers = calcHighest(highs, period)
    const lowers = calcLowest(lows, period)
    return uppers.map((upper, i) => {
      const lower = lowers[i]
      if (Number.isNaN(upper) || Number.isNaN(lower)) return { upper: NaN, lower: NaN, middle: NaN }
      return { upper, lower, middle: (upper + lower) / 2 }
    })
  },
}

export default donchianChannels
