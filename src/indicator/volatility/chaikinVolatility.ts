/**
 * Chaikin Volatility - 蔡金波动率
 * 先计算 (High - Low) 的 EMA，再计算该 EMA 的变化率（ROC）
 */
import type { IndicatorTemplate, KLineData } from 'klinecharts'
import { calcEMA } from '../utils'

type ChaikinVolatilityResult = { cv: number }

const chaikinVolatility: IndicatorTemplate<ChaikinVolatilityResult, number> = {
  name: 'CV',
  shortName: 'CV',
  calcParams: [10],
  figures: [{ key: 'cv', title: 'CV: ', type: 'line' }],
  calc: (dataList: KLineData[], { calcParams: [period] }) => {
    const n = dataList.length
    const result: ChaikinVolatilityResult[] = new Array(n)

    const hl = new Array<number>(n)
    for (let i = 0; i < n; i++) {
      hl[i] = dataList[i].high - dataList[i].low
    }

    const hlEma = calcEMA(hl, period)

    for (let i = 0; i < n; i++) {
      let cv = NaN
      if (i >= 2 * period - 1) {
        const currentEma = hlEma[i]
        const prevEma = hlEma[i - period]
        cv = (!prevEma) ? 0 : ((currentEma - prevEma) / prevEma) * 100
      }
      result[i] = { cv }
    }

    return result
  },
}

export default chaikinVolatility
