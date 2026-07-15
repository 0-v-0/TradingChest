/**
 * Stochastic RSI - 随机相对强弱指数
 *
 * 将 RSI 值代入随机指标公式，衡量 RSI 在自身历史区间内的相对位置。
 * StochRSI = (RSI - lowest(RSI, stochPeriod)) / (highest(RSI, stochPeriod) - lowest(RSI, stochPeriod))
 * K = SMA(StochRSI, kSmooth)
 * D = SMA(K, dSmooth)
 * 输出范围 0-1（部分平台显示为 0-100，此处使用 0-1）
 */
import type { IndicatorTemplate, KLineData } from 'klinecharts'
import { calcHighest, calcLowest, calcSMA_NaNAware, calcRSI, extractField } from '../utils'

type StochasticRsiResult = { k: number; d: number }

const stochasticRsi: IndicatorTemplate<StochasticRsiResult, number> = {
  name: 'StochRSI',
  shortName: 'StochRSI',
  calcParams: [14, 14, 3, 3],
  figures: [
    { key: 'k', title: 'K: ', type: 'line' },
    { key: 'd', title: 'D: ', type: 'line' },
  ],
  calc: (dataList: KLineData[], { calcParams: [rsiPeriod, stochPeriod, kSmooth, dSmooth] }) => {
    const len = dataList.length

    // ---- 第一步：计算 RSI ----
    const closes = extractField(dataList, 'close')
    const rsi = calcRSI(closes, rsiPeriod)

    // ---- 第二步：用滑动窗口 O(n) 计算 StochRSI ----
    // RSI 从 rsiPeriod 起连续有效，提取有效段后用 calcHighest/Lowest
    const validRsi = rsi.slice(rsiPeriod)
    const rsiHigh = calcHighest(validRsi, stochPeriod)
    const rsiLow = calcLowest(validRsi, stochPeriod)

    const stochRsi: number[] = Array(len).fill(NaN)
    for (let i = rsiPeriod; i < len; i++) {
      const vi = i - rsiPeriod
      if (vi >= stochPeriod - 1) {
        const h = rsiHigh[vi]
        const l = rsiLow[vi]
        stochRsi[i] = h === l ? 0 : (rsi[i] - l) / (h - l)
      }
    }

    // ---- 第三步：K = SMA(StochRSI, kSmooth)，D = SMA(K, dSmooth) ----
    const kLine = calcSMA_NaNAware(stochRsi, kSmooth)
    const dLine = calcSMA_NaNAware(kLine, dSmooth)

    // ---- 组装输出 ----
    const result: StochasticRsiResult[] = new Array(len)
    for (let i = 0; i < len; i++) {
      result[i] = { k: kLine[i], d: dLine[i] }
    }
    return result
  },
}

export default stochasticRsi
