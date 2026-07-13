/**
 * Chaikin Volatility - 蔡金波动率
 * 先计算 (High - Low) 的 EMA，再计算该 EMA 的变化率（ROC）
 */
import type { IndicatorTemplate, KLineData } from 'klinecharts'

type ChaikinVolatilityResult = { cv: number }

const chaikinVolatility: IndicatorTemplate<ChaikinVolatilityResult, number> = {
  name: 'CV',
  shortName: 'CV',
  calcParams: [10],
  figures: [{ key: 'cv', title: 'CV: ', type: 'line' }],
  calc: (dataList: KLineData[], { calcParams: [period] }) => {
    const result: ChaikinVolatilityResult[] = []

    // EMA 平滑系数
    const emaK = 2 / (period + 1)

    // 第一步：计算 (High - Low) 的 EMA 序列
    const hlEma: number[] = []
    let emaValue = 0
    let cumSum = 0

    for (let i = 0; i < dataList.length; i++) {
      const hl = dataList[i].high - dataList[i].low

      if (i < period) {
        // 累积阶段
        cumSum += hl
        if (i === period - 1) {
          // 首个 EMA 值为 SMA
          emaValue = cumSum / period
          hlEma.push(emaValue)
        } else {
          hlEma.push(0)
        }
      } else {
        // EMA 递推
        emaValue = hl * emaK + emaValue * (1 - emaK)
        hlEma.push(emaValue)
      }
    }

    // 第二步：计算 EMA 的变化率（ROC）
    // ROC = (当前 EMA - period 前的 EMA) / period 前的 EMA * 100
    // 需要至少 2 * period - 1 个数据点
    for (let i = 0; i < dataList.length; i++) {
      // EMA 从 index = period - 1 开始有效
      // ROC 需要 period 前的 EMA 也有效，即 i - period >= period - 1
      // 即 i >= 2 * period - 1
      let cv = NaN
      if (i >= 2 * period - 1) {
        const currentEma = hlEma[i]
        const prevEma = hlEma[i - period]
        // 防止除零
        cv = prevEma === 0 ? 0 : ((currentEma - prevEma) / prevEma) * 100
      }
      result.push({ cv })
    }

    return result
  },
}

export default chaikinVolatility
