/**
 * Keltner Channels - 肯特纳通道
 * 以 EMA 为中轨，ATR 乘以倍数为上下轨的波动率通道指标
 */
import type { IndicatorTemplate, KLineData } from 'klinecharts'
import { calcTR, calcEMA, calcRMA } from '../utils'

type KeltnerChannelsResult = {
  middle: number
  upper: number
  lower: number
}

const keltnerChannels: IndicatorTemplate<KeltnerChannelsResult, number> = {
  name: 'KC',
  shortName: 'KC',
  calcParams: [20, 1.5],
  figures: [
    { key: 'middle', title: 'MID: ', type: 'line' },
    { key: 'upper', title: 'UP: ', type: 'line' },
    { key: 'lower', title: 'LOW: ', type: 'line' },
  ],
  calc: (dataList: KLineData[], { calcParams: [emaPeriod, atrMultiplier] }) => {
    const n = dataList.length
    const high = new Array<number>(n)
    const low = new Array<number>(n)
    const close = new Array<number>(n)
    for (let i = 0; i < n; i++) {
      const d = dataList[i]
      high[i] = d.high
      low[i] = d.low
      close[i] = d.close
    }

    const emaArr = calcEMA(close, emaPeriod)
    const tr = calcTR(high, low, close)
    const atrArr = calcRMA(tr, emaPeriod)

    const result: KeltnerChannelsResult[] = new Array(n)
    for (let i = 0; i < n; i++) {
      const mid = emaArr[i]
      result[i] = isNaN(mid)
        ? { middle: NaN, upper: NaN, lower: NaN }
        : { middle: mid, upper: mid + atrMultiplier * atrArr[i], lower: mid - atrMultiplier * atrArr[i] }
    }
    return result
  },
}

export default keltnerChannels
