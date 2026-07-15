/**
 * PPO - 百分比价格振荡器
 *
 * 与 MACD 类似，但使用百分比表示，便于跨标的比较。
 * PPO = (EMA_fast - EMA_slow) / EMA_slow * 100
 * Signal = EMA(PPO, signalPeriod)
 * Histogram = PPO - Signal
 */
import { calcEMA, extractField } from '../utils'
import type { IndicatorTemplate, KLineData } from 'klinecharts'

type PpoResult = {
  ppo: number
  signal: number
  histogram: number
}

const ppo: IndicatorTemplate<PpoResult, number> = {
  name: 'PPO',
  shortName: 'PPO',
  calcParams: [12, 26, 9],
  figures: [
    { key: 'ppo', title: 'PPO: ', type: 'line' },
    { key: 'signal', title: 'Signal: ', type: 'line' },
    { key: 'histogram', title: 'Hist: ', type: 'line' },
  ],
  calc: (dataList: KLineData[], { calcParams: [fastPeriod, slowPeriod, signalPeriod] }) => {
    const len = dataList.length
    const result: PpoResult[] = new Array(len)

    // ---- 提取收盘价序列 ----
    const closes = extractField(dataList, 'close')

    // ---- 计算快速 EMA ----
    const emaFast = calcEMA(closes, fastPeriod)

    // ---- 计算慢速 EMA ----
    const emaSlow = calcEMA(closes, slowPeriod)

    // ---- 计算 PPO 序列 ----
    const ppoLine: number[] = Array(len).fill(NaN)
    for (let i = 0; i < len; i++) {
      if (!isNaN(emaFast[i]) && !isNaN(emaSlow[i]) && emaSlow[i] !== 0) {
        ppoLine[i] = ((emaFast[i] - emaSlow[i]) / emaSlow[i]) * 100
      }
    }

    // ---- 计算 Signal 线（对 PPO 做 EMA） ----
    // Slice the valid portion (after slow EMA matures) and use calcEMA
    const slowStart = slowPeriod - 1
    const validLen = len - slowStart
    const validPpo = new Array<number>(validLen)
    for (let i = 0; i < validLen; i++) {
      validPpo[i] = ppoLine[i + slowStart]
    }
    const signalEma = calcEMA(validPpo, signalPeriod)

    const signalLine: number[] = Array(len).fill(NaN)
    for (let i = slowStart; i < len; i++) {
      const si = i - slowStart
      signalLine[i] = si < signalEma.length ? signalEma[si] : NaN
    }

    // ---- 组装输出 ----
    for (let i = 0; i < len; i++) {
      const p = ppoLine[i]
      const s = signalLine[i]
      result[i] = {
        ppo: p,
        signal: s,
        histogram: !isNaN(p) && !isNaN(s) ? p - s : NaN,
      }
    }

    return result
  },
}

export default ppo
