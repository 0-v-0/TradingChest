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
import { calcHighest, calcLowest } from '../utils'

type StochasticRsiResult = { k: number; d: number }

/**
 * NaN 感知的滑动窗口 SMA：跳过 NaN，只在连续有效值上计算。
 */
function calcSparseSMA(source: number[], period: number): number[] {
  const len = source.length
  const result: number[] = Array(len).fill(NaN)
  const buf = new Array<number>(len)
  let bufLen = 0
  let sum = 0
  for (let i = 0; i < len; i++) {
    if (isNaN(source[i])) continue
    buf[bufLen] = source[i]
    bufLen++
    sum += source[i]
    if (bufLen > period) {
      sum -= buf[bufLen - period - 1]
    }
    if (bufLen >= period) {
      result[i] = sum / period
    }
  }
  return result
}

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

    // ---- 第一步：计算 RSI（Wilder 平滑法） ----
    const rsi: number[] = Array(len).fill(NaN)
    let avgGain = 0
    let avgLoss = 0

    for (let i = 1; i < len; i++) {
      const diff = dataList[i].close - dataList[i - 1].close
      const gain = diff > 0 ? diff : 0
      const loss = diff < 0 ? -diff : 0

      if (i < rsiPeriod) {
        // 累积阶段
        avgGain += gain
        avgLoss += loss
      } else if (i === rsiPeriod) {
        // 首个 RSI：用 SMA 作为种子
        avgGain = (avgGain + gain) / rsiPeriod
        avgLoss = (avgLoss + loss) / rsiPeriod
        if (avgLoss === 0) {
          rsi[i] = 100
        } else {
          rsi[i] = 100 - 100 / (1 + avgGain / avgLoss)
        }
      } else {
        // Wilder 递归平滑
        avgGain = (avgGain * (rsiPeriod - 1) + gain) / rsiPeriod
        avgLoss = (avgLoss * (rsiPeriod - 1) + loss) / rsiPeriod
        if (avgLoss === 0) {
          rsi[i] = 100
        } else {
          rsi[i] = 100 - 100 / (1 + avgGain / avgLoss)
        }
      }
    }

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
    const kLine = calcSparseSMA(stochRsi, kSmooth)
    const dLine = calcSparseSMA(kLine, dSmooth)

    // ---- 组装输出 ----
    const result: StochasticRsiResult[] = new Array(len)
    for (let i = 0; i < len; i++) {
      result[i] = { k: kLine[i], d: dLine[i] }
    }
    return result
  },
}

export default stochasticRsi
