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
import { IndicatorTemplate, KLineData } from 'klinecharts'
import { calcSMA } from '../utils'

type KstResult = { kst: number | undefined; signal: number | undefined }

const kst: IndicatorTemplate = {
  name: 'KST',
  shortName: 'KST',
  calcParams: [10, 15, 20, 30, 10, 10, 10, 15, 9],
  figures: [
    { key: 'kst', title: 'KST: ', type: 'line' },
    { key: 'signal', title: 'Signal: ', type: 'line' },
  ],
  calc: (dataList: KLineData[], indicator) => {
    const p = indicator.calcParams
    const rocPeriods = [p[0] as number, p[1] as number, p[2] as number, p[3] as number]
    const smaPeriods = [p[4] as number, p[5] as number, p[6] as number, p[7] as number]
    const signalPeriod = p[8] as number
    const weights = [1, 2, 3, 4]
    const len = dataList.length

    // ---- 计算四条 ROC 序列 ----
    const rocs: (number | null)[][] = []
    for (let r = 0; r < 4; r++) {
      const roc: (number | null)[] = new Array(len).fill(null)
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
    const smoothedRocs: (number | null)[][] = []
    for (let r = 0; r < 4; r++) {
      const roc = rocs[r]
      const validValues: number[] = []
      const validIndices: number[] = []
      for (let i = 0; i < len; i++) {
        if (roc[i] !== null) {
          validValues.push(roc[i] as number)
          validIndices.push(i)
        }
      }
      const smaResult = calcSMA(validValues, smaPeriods[r])
      const smoothed: (number | null)[] = new Array(len).fill(null)
      for (let j = 0; j < validIndices.length; j++) {
        if (smaResult[j] !== null) {
          smoothed[validIndices[j]] = smaResult[j]
        }
      }
      smoothedRocs.push(smoothed)
    }

    // ---- 计算 KST = 加权求和 ----
    const kstLine: (number | null)[] = new Array(len).fill(null)
    for (let i = 0; i < len; i++) {
      let allValid = true
      let val = 0
      for (let r = 0; r < 4; r++) {
        if (smoothedRocs[r][i] === null) {
          allValid = false
          break
        }
        val += weights[r] * (smoothedRocs[r][i] as number)
      }
      if (allValid) {
        kstLine[i] = val
      }
    }

    // ---- 计算 Signal = SMA(KST, signalPeriod) ----
    const kstValidValues: number[] = []
    const kstValidIndices: number[] = []
    for (let i = 0; i < len; i++) {
      if (kstLine[i] !== null) {
        kstValidValues.push(kstLine[i] as number)
        kstValidIndices.push(i)
      }
    }
    const signalSmaResult = calcSMA(kstValidValues, signalPeriod)
    const signalLine: (number | null)[] = new Array(len).fill(null)
    for (let j = 0; j < kstValidIndices.length; j++) {
      if (signalSmaResult[j] !== null) {
        signalLine[kstValidIndices[j]] = signalSmaResult[j]
      }
    }

    // ---- 组装输出 ----
    const result: KstResult[] = []
    for (let i = 0; i < len; i++) {
      result.push({
        kst: kstLine[i] ?? undefined,
        signal: signalLine[i] ?? undefined,
      })
    }

    return result
  },
}

export default kst
