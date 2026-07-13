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
import { calcSMA } from '../utils'

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

    // ---- 计算四条 ROC 序列 ----
    const rocs = []
    for (let r = 0; r < 4; r++) {
      const roc: number[] = Array(len).fill(NaN)
      const rocP = rocPeriods[r]
      for (let i = rocP; i < len; i++) {
        const prev = dataList[i - rocP].close
        if (prev !== 0) {
          roc[i] = (dataList[i].close / prev - 1) * 100
        }
      }
      rocs.push(roc)
    }

    // ---- 对每条 ROC 做 SMA 平滑（复用 calcSMA 滑动窗口，O(n)） ----
    // calcSMA 要求连续 number[] 输入，需将有效 ROC 值提取后传入，结果映射回原索引
    const smoothedRocs = []
    for (let r = 0; r < 4; r++) {
      const roc = rocs[r]
      const validValues = new Array<number>(len)
      const validIndices = new Array<number>(len)
      let validCount = 0
      for (let i = 0; i < len; i++) {
        if (!isNaN(roc[i])) {
          validValues[validCount] = roc[i]
          validIndices[validCount] = i
          validCount++
        }
      }
      const smaResult = calcSMA(validValues.slice(0, validCount), smaPeriods[r])
      const smoothed: number[] = Array(len).fill(NaN)
      for (let j = 0; j < validCount; j++) {
        if (!isNaN(smaResult[j])) {
          smoothed[validIndices[j]] = smaResult[j]
        }
      }
      smoothedRocs.push(smoothed)
    }

    // ---- 计算 KST = 加权求和 ----
    const kstLine: number[] = Array(len).fill(NaN)
    for (let i = 0; i < len; i++) {
      let allValid = true
      let val = 0
      for (let r = 0; r < 4; r++) {
        if (isNaN(smoothedRocs[r][i])) {
          allValid = false
          break
        }
        val += weights[r] * smoothedRocs[r][i]
      }
      if (allValid) {
        kstLine[i] = val
      }
    }

    // ---- 计算 Signal = SMA(KST, signalPeriod) ----
    const kstValidValues = new Array<number>(len)
    const kstValidIndices = new Array<number>(len)
    let kstValidCount = 0
    for (let i = 0; i < len; i++) {
      if (!isNaN(kstLine[i])) {
        kstValidValues[kstValidCount] = kstLine[i]
        kstValidIndices[kstValidCount] = i
        kstValidCount++
      }
    }
    const signalSmaResult = calcSMA(kstValidValues.slice(0, kstValidCount), signalPeriod)
    const signalLine: number[] = Array(len).fill(NaN)
    for (let j = 0; j < kstValidCount; j++) {
      if (!isNaN(signalSmaResult[j])) {
        signalLine[kstValidIndices[j]] = signalSmaResult[j]
      }
    }

    // ---- 组装输出 ----
    const result: KstResult[] = new Array(len)
    for (let i = 0; i < len; i++) {
      result[i] = {
        kst: kstLine[i],
        signal: signalLine[i],
      }
    }

    return result
  },
}

export default kst
