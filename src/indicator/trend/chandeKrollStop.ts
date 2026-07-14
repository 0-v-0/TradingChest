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

const chandeKrollStop: IndicatorTemplate<ChandeKrollStopResult, number> = {
  name: 'ChanDeKrollStop',
  shortName: 'CK Stop',
  calcParams: [10, 2, 9],
  figures: [
    { key: 'longStop', title: '多头止损: ', type: 'line' },
    { key: 'shortStop', title: '空头止损: ', type: 'line' },
  ],
  calc: (dataList: KLineData[], { calcParams: [p, x, q] }) => {
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

    const highest = calcHighest(high, p)
    const lowest = calcLowest(low, p)
    const tr = calcTR(high, low, close)
    const atr = calcRMA(tr, p)

    // 计算初始止损线
    const rawLongStop = new Array<number>(n)
    const rawShortStop = new Array<number>(n)

    for (let i = 0; i < n; i++) {
      const hh = highest[i]
      const ll = lowest[i]
      const a = atr[i]
      if (isNaN(hh) || isNaN(ll) || isNaN(a)) {
        rawLongStop[i] = NaN
        rawShortStop[i] = NaN
      } else {
        rawLongStop[i] = hh - x * a
        rawShortStop[i] = ll + x * a
      }
    }

    // NaN-aware RMA 平滑：保留前导 NaN，避免把无效值替换为 0 污染累计。
    const smoothedLong = calcRMA_NaNAware(rawLongStop, q)
    const smoothedShort = calcRMA_NaNAware(rawShortStop, q)

    const result: ChandeKrollStopResult[] = new Array(n)
    for (let i = 0; i < n; i++) {
      // 需要 ATR 和 highest/lowest 都有效才输出
      result[i] = (isNaN(highest[i]) || isNaN(lowest[i]) || isNaN(atr[i]))
        ? { longStop: NaN, shortStop: NaN }
        : { longStop: smoothedLong[i], shortStop: smoothedShort[i] }
    }

    return result
  },
}

export default chandeKrollStop
