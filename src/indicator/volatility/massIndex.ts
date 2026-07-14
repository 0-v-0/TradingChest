/**
 * Mass Index - 质量指数
 * 通过计算 EMA(H-L) 与 EMA(EMA(H-L)) 的比值之和来检测趋势反转
 * 当指标超过 27 然后回落到 26.5 以下时，形成"反转膨胀"信号
 */
import type { IndicatorTemplate, KLineData } from 'klinecharts'
import { calcEMA } from '../utils'

type MassIndexResult = { mi: number }

const massIndex: IndicatorTemplate<MassIndexResult, number> = {
  name: 'MI',
  shortName: 'MI',
  calcParams: [9, 25],
  figures: [{ key: 'mi', title: 'MI: ', type: 'line' }],
  calc: (dataList: KLineData[], { calcParams: [emaPeriod, sumPeriod] }) => {
    const n = dataList.length
    const result: MassIndexResult[] = new Array(n)

    const hl = new Array<number>(n)
    for (let i = 0; i < n; i++) {
      hl[i] = dataList[i].high - dataList[i].low
    }

    const singleEma = calcEMA(hl, emaPeriod)
    const doubleEma = calcEMA(singleEma, emaPeriod)

    const ratioStartIdx = 2 * (emaPeriod - 1)

    const ratios = new Array<number>(n)
    for (let i = 0; i < n; i++) {
      ratios[i] = (i < ratioStartIdx || !doubleEma[i]) ? NaN : singleEma[i] / doubleEma[i]
    }

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
