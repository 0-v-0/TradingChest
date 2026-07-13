/**
 * Historical Volatility - 历史波动率
 * 对数收益率的年化标准差，使用 sqrt(252) 进行年化
 *
 * 实现：对数收益率预先计算一次，然后使用闭式方差
 * `var = (Σy² - (Σy)²/n) / (n-1)`（样本方差贝塞尔校正），
 * 滚动窗口内仅维护 Σy 与 Σy² 即可 O(1) 更新。
 */
import type { IndicatorTemplate, KLineData } from 'klinecharts'

type HistoricalVolatilityResult = { hv: number }

const historicalVolatility: IndicatorTemplate<HistoricalVolatilityResult, number> = {
  name: 'HV',
  shortName: 'HV',
  calcParams: [20],
  figures: [{ key: 'hv', title: 'HV: ', type: 'line' }],
  calc: (dataList: KLineData[], { calcParams: [period] }) => {
    const n = dataList.length
    const annualizationFactor = Math.sqrt(252)
    const result: HistoricalVolatilityResult[] = new Array(n)

    // 一次性预计算对数收益率（仅当相邻两个收盘价均为正时）
    const validLogReturns: number[] = new Array(n).fill(NaN)
    let prevClose = NaN
    for (let i = 0; i < n; i++) {
      const close = Number(dataList[i].close)
      if (prevClose > 0 && close > 0) {
        validLogReturns[i] = Math.log(close / prevClose)
      }
      prevClose = close
    }

    // 在有效对数收益率之上跑一个 O(period) 窗口的滚动求和。
    // 由于无效位置以 NaN 表示，sum/sumSq 累加时需跳过 NaN。
    let sum = 0
    let sumSq = 0
    let queuedCount = 0

    for (let i = 0; i < n; i++) {
      const lr = validLogReturns[i]
      if (Number.isFinite(lr)) {
        sum += lr
        sumSq += lr * lr
        queuedCount++
      }
      if (i >= period) {
        const out = validLogReturns[i - period]
        if (Number.isFinite(out)) {
          sum -= out
          sumSq -= out * out
          queuedCount--
        }
      }

      let hv = NaN
      if (i >= period && queuedCount >= 2) {
        const m = sum / queuedCount
        const variance = Math.max((sumSq - queuedCount * m * m) / (queuedCount - 1), 0)
        hv = Math.sqrt(variance) * annualizationFactor
      }
      result[i] = { hv }
    }
    return result
  },
}

export default historicalVolatility
