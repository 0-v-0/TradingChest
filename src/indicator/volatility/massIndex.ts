/**
 * Mass Index - 质量指数
 * 通过计算 EMA(H-L) 与 EMA(EMA(H-L)) 的比值之和来检测趋势反转
 * 当指标超过 27 然后回落到 26.5 以下时，形成"反转膨胀"信号
 */
import type { IndicatorTemplate, KLineData } from 'klinecharts'

type MassIndexResult = { mi: number }

const massIndex: IndicatorTemplate<MassIndexResult, number> = {
  name: 'MI',
  shortName: 'MI',
  calcParams: [9, 25],
  figures: [{ key: 'mi', title: 'MI: ', type: 'line' }],
  calc: (dataList: KLineData[], { calcParams: [emaPeriod, sumPeriod] }) => {
    const n = dataList.length
    const result: MassIndexResult[] = new Array(n)

    // EMA 平滑系数
    const emaK = 2 / (emaPeriod + 1)

    // 第一步：计算 (High - Low) 的单次 EMA
    const singleEma = new Array<number>(n)
    let singleEmaVal = 0
    let singleCumSum = 0

    for (let i = 0; i < n; i++) {
      const hl = dataList[i].high - dataList[i].low

      if (i < emaPeriod) {
        singleCumSum += hl
        if (i === emaPeriod - 1) {
          singleEmaVal = singleCumSum / emaPeriod
          singleEma[i] = singleEmaVal
        } else {
          singleEma[i] = 0
        }
      } else {
        singleEmaVal = hl * emaK + singleEmaVal * (1 - emaK)
        singleEma[i] = singleEmaVal
      }
    }

    // 第二步：计算单次 EMA 的二次 EMA
    const doubleEma = new Array<number>(n)
    let doubleEmaVal = 0
    let doubleCumSum = 0
    // 二次 EMA 从 singleEma 有效的位置开始（即 index = emaPeriod - 1）
    let doubleCount = 0

    for (let i = 0; i < n; i++) {
      if (i < emaPeriod - 1) {
        // 单次 EMA 尚未有效
        doubleEma[i] = 0
        continue
      }

      if (doubleCount < emaPeriod) {
        doubleCumSum += singleEma[i]
        doubleCount++
        if (doubleCount === emaPeriod) {
          doubleEmaVal = doubleCumSum / emaPeriod
          doubleEma[i] = doubleEmaVal
        } else {
          doubleEma[i] = 0
        }
      } else {
        doubleEmaVal = singleEma[i] * emaK + doubleEmaVal * (1 - emaK)
        doubleEma[i] = doubleEmaVal
      }
    }

    // 第三步：计算比值并求和
    // 比值 = singleEma / doubleEma
    // 二次 EMA 从 index = (emaPeriod - 1) + (emaPeriod - 1) = 2 * (emaPeriod - 1) 开始有效
    const ratioStartIdx = 2 * (emaPeriod - 1)

    // 比值序列
    const ratios = new Array<number>(n)
    for (let i = 0; i < n; i++) {
      ratios[i] = (i < ratioStartIdx || doubleEma[i] === 0) ? NaN : singleEma[i] / doubleEma[i]
    }

    // 第四步：对比值序列求 sumPeriod 的滚动和（O(n) 滑动窗口）
    // 仅统计窗口内有效比值（NaN 跳过），窗口需有 sumPeriod 个有效值
    let sum = 0
    let validInWindow = 0

    for (let i = 0; i < n; i++) {
      const r = ratios[i]
      if (!isNaN(r)) {
        sum += r
        validInWindow++
      }
      if (i >= sumPeriod) {
        const oldR = ratios[i - sumPeriod]
        if (!isNaN(oldR)) {
          sum -= oldR
          validInWindow--
        }
      }
      result[i] = validInWindow === sumPeriod ? { mi: sum } : { mi: NaN }
    }

    return result
  },
}

export default massIndex
