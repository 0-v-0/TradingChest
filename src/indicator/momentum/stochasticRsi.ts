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

    // ---- 第二步：在 RSI 序列上计算随机指标 ----
    const stochRsi: number[] = Array(len).fill(NaN)
    for (let i = 0; i < len; i++) {
      if (isNaN(rsi[i])) continue
      // 回溯 stochPeriod 个有效 RSI 值
      let lowest = Infinity
      let highest = -Infinity
      let validCount = 0
      for (let j = i; j >= 0 && validCount < stochPeriod; j--) {
        if (!isNaN(rsi[j])) {
          const v = rsi[j]
          if (v < lowest) lowest = v
          if (v > highest) highest = v
          validCount++
        }
      }
      if (validCount < stochPeriod) continue
      // 分母为零时（RSI 区间内无变化），输出 0
      if (highest === lowest) {
        stochRsi[i] = 0
      } else {
        stochRsi[i] = (rsi[i] - lowest) / (highest - lowest)
      }
    }

    // ---- 第三步：K = SMA(StochRSI, kSmooth)，D = SMA(K, dSmooth) ----
    // 对有效值序列做 SMA
    const kLine: number[] = Array(len).fill(NaN)
    const dLine: number[] = Array(len).fill(NaN)

    // K 线：对 stochRsi 做滑动窗口平均（O(n)，无需重新求和修正浮点漂移）
    const kBuf: number[] = []
    let kSum = 0
    for (let i = 0; i < len; i++) {
      if (!isNaN(stochRsi[i])) {
        kBuf.push(stochRsi[i])
        kSum += stochRsi[i]
        if (kBuf.length > kSmooth) {
          kSum -= kBuf[kBuf.length - kSmooth - 1]
        }
        if (kBuf.length >= kSmooth) {
          kLine[i] = kSum / kSmooth
        }
      }
    }

    // D 线：对 K 线做滑动窗口平均（O(n)，移入/移出窗口同时增减和）
    const dBuf: number[] = []
    let dSum = 0
    for (let i = 0; i < len; i++) {
      if (!isNaN(kLine[i])) {
        dBuf.push(kLine[i])
        dSum += kLine[i]
        if (dBuf.length > dSmooth) {
          dSum -= dBuf[dBuf.length - dSmooth - 1]
        }
        if (dBuf.length >= dSmooth) {
          dLine[i] = dSum / dSmooth
        }
      }
    }

    // ---- 组装输出 ----
    const result: StochasticRsiResult[] = []
    for (let i = 0; i < len; i++) {
      result.push({
        k: kLine[i],
        d: dLine[i],
      })
    }
    return result
  },
}

export default stochasticRsi
