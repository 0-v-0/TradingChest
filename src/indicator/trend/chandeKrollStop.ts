/**
 * Chande Kroll Stop - 钱德勒克罗止损
 * 趋势跟踪止损指标
 *
 * 算法：
 *   计算最高价和最低价的 Rolling Max/Min（period P）
 *   步止损_多头 = Rolling Max - X * ATR(P)
 *   步止损_空头 = Rolling Min + X * ATR(P)
 *   再对两条线分别做 Q 周期 RMA 平滑
 *
 * 参数: P(lookback), X(ATR multiplier), Q(RMA period)
 */
import type { IndicatorTemplate, KLineData } from 'klinecharts'
import { calcTR, calcRMA, calcRMA_NaNAware, calcHighest, calcLowest } from '../utils'

type ChandeKrollStopResult = {
  longStop: number
  shortStop: number
}

const chandeKrollStop: IndicatorTemplate = {
  name: 'ChanDeKrollStop',
  shortName: 'CK Stop',
  calcParams: [10, 2, 9],
  figures: [
    { key: 'longStop', title: '多头止损: ', type: 'line' },
    { key: 'shortStop', title: '空头止损: ', type: 'line' },
  ],
  calc: (dataList: KLineData[], indicator) => {
    const params = indicator.calcParams
    const p = params[0] as number
    const x = params[1] as number
    const q = params[2] as number

    const high = dataList.map(k => k.high)
    const low = dataList.map(k => k.low)
    const close = dataList.map(k => k.close)

    const highest = calcHighest(high, p)
    const lowest = calcLowest(low, p)
    const tr = calcTR(high, low, close)
    const atr = calcRMA(tr, p)

    // 计算初始止损线
    const rawLongStop: number[] = []
    const rawShortStop: number[] = []

    for (let i = 0; i < dataList.length; i++) {
      const hh = highest[i]
      const ll = lowest[i]
      const a = atr[i]
      if (isNaN(hh) || isNaN(ll) || isNaN(a)) {
        rawLongStop.push(NaN)
        rawShortStop.push(NaN)
      } else {
        rawLongStop.push(hh - x * a)
        rawShortStop.push(ll + x * a)
      }
    }

    // NaN-aware RMA 平滑：保留前导 NaN，避免把无效值替换为 0 污染累计。
    const smoothedLong = calcRMA_NaNAware(rawLongStop, q)
    const smoothedShort = calcRMA_NaNAware(rawShortStop, q)

    const result: ChandeKrollStopResult[] = []
    for (let i = 0; i < dataList.length; i++) {
      // 需要 ATR 和 highest/lowest 都有效才输出
      if (isNaN(highest[i]) || isNaN(lowest[i]) || isNaN(atr[i])) {
        result.push({ longStop: NaN, shortStop: NaN })
      } else {
        result.push({
          longStop: smoothedLong[i],
          shortStop: smoothedShort[i],
        })
      }
    }

    return result
  },
}

export default chandeKrollStop
