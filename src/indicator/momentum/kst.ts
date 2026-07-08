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

type KstResult = { kst: number | undefined; signal: number | undefined }

const kst: IndicatorTemplate = {
  name: 'KST',
  shortName: 'KST',
  calcParams: [10, 15, 20, 30, 10, 10, 10, 15, 9],
  figures: [
    { key: 'kst', title: 'KST: ', type: 'line' },
    { key: 'signal', title: 'Signal: ', type: 'line' }
  ],
  calc: (dataList: KLineData[], indicator) => {
    const p = indicator.calcParams
    const rocPeriods = [p[0] as number, p[1] as number, p[2] as number, p[3] as number]
    const smaPeriods = [p[4] as number, p[5] as number, p[6] as number, p[7] as number]
    const signalPeriod = p[8] as number
    const weights = [1, 2, 3, 4]
    const len = dataList.length
    const result: KstResult[] = []

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

    // ---- 对每条 ROC 做 SMA 平滑 ----
    const smoothedRocs: (number | null)[][] = []
    for (let r = 0; r < 4; r++) {
      const smoothed: (number | null)[] = new Array(len).fill(null)
      const smaP = smaPeriods[r]

      // 使用有效值索引缓冲区
      const validIndices: number[] = []
      for (let i = 0; i < len; i++) {
        if (rocs[r][i] !== null) {
          validIndices.push(i)
          if (validIndices.length >= smaP) {
            // 精确计算避免浮点漂移
            let s = 0
            for (let w = validIndices.length - smaP; w < validIndices.length; w++) {
              s += rocs[r][validIndices[w]] as number
            }
            smoothed[i] = s / smaP
          }
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
    const signalLine: (number | null)[] = new Array(len).fill(null)
    const kstValidIndices: number[] = []
    for (let i = 0; i < len; i++) {
      if (kstLine[i] !== null) {
        kstValidIndices.push(i)
        if (kstValidIndices.length >= signalPeriod) {
          let s = 0
          for (let w = kstValidIndices.length - signalPeriod; w < kstValidIndices.length; w++) {
            s += kstLine[kstValidIndices[w]] as number
          }
          signalLine[i] = s / signalPeriod
        }
      }
    }

    // ---- 组装输出 ----
    for (let i = 0; i < len; i++) {
      result.push({
        kst: kstLine[i] ?? undefined,
        signal: signalLine[i] ?? undefined
      })
    }

    return result
  }
}

export default kst
