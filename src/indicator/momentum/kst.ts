/**
 * KST - 确然指标 (Know Sure Thing)
 *
 * Martin Pring 设计的动量指标，基于四个不同时间框架的变化率（ROC）加权求和。
 * ROC_i = (close / close[rocPeriod_i 之前] - 1) * 100
 * 各 ROC 经过 SMA 平滑后，按权重 1:2:3:4 加权求和。
 * KST = 1*SMA(ROC1) + 2*SMA(ROC2) + 3*SMA(ROC3) + 4*SMA(ROC4)
 * Signal = SMA(KST, signalPeriod)
 *
 * 默认参数: [10,15,20,30, 10,10,10,15, 9]
 *   ROC 周期: 10, 15, 20, 30
 *   SMA 周期: 10, 10, 10, 15
 *   信号线周期: 9
 */
import type { IndicatorTemplate, KLineData } from 'klinecharts'
import { calcSMA_NaNAware } from '../utils'

type KstResult = { kst: number; signal: number }

const kst: IndicatorTemplate<KstResult, number> = {
  name: 'KST',
  shortName: 'KST',
  calcParams: [10, 15, 20, 30, 10, 10, 10, 15, 9],
  figures: [
    { key: 'kst', title: 'KST: ', type: 'line' },
    { key: 'signal', title: 'Signal: ', type: 'line' },
  ],
  calc: (dataList: KLineData[], { calcParams: [roc1, roc2, roc3, roc4, sma1, sma2, sma3, sma4, signalPeriod] }) => {
    const rocPeriods = [roc1, roc2, roc3, roc4]
    const smaPeriods = [sma1, sma2, sma3, sma4]
    const weights = [1, 2, 3, 4]
    const len = dataList.length

    // ---- 计算四条 ROC 序列并直接 SMA 平滑 ----
    // 不再存储 rocs + 后处理 validValues/validIndices，改为每步直接平滑
    const smoothedRocs: number[][] = []
    for (let r = 0; r < 4; r++) {
      const rocP = rocPeriods[r]
      const roc: number[] = Array(len).fill(NaN)
      for (let i = rocP; i < len; i++) {
        const prev = dataList[i - rocP].close
        if (prev !== 0) {
          roc[i] = (dataList[i].close / prev - 1) * 100
        }
      }
      // 直接对含 NaN 的 roc 做稀疏 SMA，无需提取 validValues/validIndices
      smoothedRocs.push(calcSMA_NaNAware(roc, smaPeriods[r]))
    }
    // rocs 数组可 GC——不再引用

    // ---- 计算 KST = 加权求和 ----
    const kstLine: number[] = Array(len).fill(NaN)
    for (let i = 0; i < len; i++) {
      let allValid = true
      let val = 0
      for (let r = 0; r < 4; r++) {
        const v = smoothedRocs[r][i]
        if (isNaN(v)) {
          allValid = false
          break
        }
        val += weights[r] * v
      }
      if (allValid) {
        kstLine[i] = val
      }
    }

    // ---- 计算 Signal = SMA(KST, signalPeriod) ----
    const signalLine = calcSMA_NaNAware(kstLine, signalPeriod)

    // ---- 组装输出 ----
    const result: KstResult[] = new Array(len)
    for (let i = 0; i < len; i++) {
      result[i] = { kst: kstLine[i], signal: signalLine[i] }
    }

    return result
  },
}

export default kst
