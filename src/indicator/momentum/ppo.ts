/**
 * PPO - 百分比价格振荡器
 *
 * 与 MACD 类似，但使用百分比表示，便于跨标的比较。
 * PPO = (EMA_fast - EMA_slow) / EMA_slow * 100
 * Signal = EMA(PPO, signalPeriod)
 * Histogram = PPO - Signal
 */
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

    // ---- 计算快速 EMA ----
    const emaFast: number[] = Array(len).fill(NaN)
    const kFast = 2 / (fastPeriod + 1)
    let prevEmaFast = NaN
    for (let i = 0; i < len; i++) {
      const close = dataList[i].close
      if (i < fastPeriod - 1) {
        // 累积阶段
      } else if (i === fastPeriod - 1) {
        let sum = 0
        for (let j = 0; j < fastPeriod; j++) sum += dataList[j].close
        prevEmaFast = sum / fastPeriod
        emaFast[i] = prevEmaFast
      } else {
        prevEmaFast = close * kFast + prevEmaFast * (1 - kFast)
        emaFast[i] = prevEmaFast
      }
    }

    // ---- 计算慢速 EMA ----
    const emaSlow: number[] = Array(len).fill(NaN)
    const kSlow = 2 / (slowPeriod + 1)
    let prevEmaSlow = NaN
    for (let i = 0; i < len; i++) {
      const close = dataList[i].close
      if (i < slowPeriod - 1) {
        // 累积阶段
      } else if (i === slowPeriod - 1) {
        let sum = 0
        for (let j = 0; j < slowPeriod; j++) sum += dataList[j].close
        prevEmaSlow = sum / slowPeriod
        emaSlow[i] = prevEmaSlow
      } else {
        prevEmaSlow = close * kSlow + prevEmaSlow * (1 - kSlow)
        emaSlow[i] = prevEmaSlow
      }
    }

    // ---- 计算 PPO 序列 ----
    const ppoLine: number[] = Array(len).fill(NaN)
    for (let i = 0; i < len; i++) {
      if (!isNaN(emaFast[i]) && !isNaN(emaSlow[i]) && emaSlow[i] !== 0) {
        ppoLine[i] = ((emaFast[i] - emaSlow[i]) / emaSlow[i]) * 100
      }
    }

    // ---- 计算 Signal 线（对 PPO 做 EMA） ----
    const signalLine: number[] = Array(len).fill(NaN)
    const kSignal = 2 / (signalPeriod + 1)
    let prevSignal = NaN
    let signalSeedCount = 0
    let signalSeedSum = 0

    for (let i = 0; i < len; i++) {
      if (isNaN(ppoLine[i])) continue

      if (isNaN(prevSignal)) {
        signalSeedCount++
        signalSeedSum += ppoLine[i]
        if (signalSeedCount === signalPeriod) {
          prevSignal = signalSeedSum / signalPeriod
          signalLine[i] = prevSignal
        }
      } else {
        prevSignal = ppoLine[i] * kSignal + prevSignal * (1 - kSignal)
        signalLine[i] = prevSignal
      }
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
