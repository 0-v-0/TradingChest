/**
 * DEMA - 双重指数移动平均线
 * DEMA = 2 * EMA(close) - EMA(EMA(close))
 * 比普通 EMA 更贴近价格，滞后更小
 */
import type { IndicatorTemplate, KLineData } from 'klinecharts'
import { calcMultiLayerEMA } from '../utils'

type DemaResult = { dema: number }

const dema: IndicatorTemplate<DemaResult, number> = {
  name: 'DEMA',
  shortName: 'DEMA',
  calcParams: [21],
  figures: [{ key: 'dema', title: 'DEMA: ', type: 'line' }],
  calc: (dataList: KLineData[], { calcParams: [period] }) => {
    const n = dataList.length
    const closes = new Array<number>(n)
    for (let i = 0; i < n; i++) closes[i] = dataList[i].close

    const [ema1, ema2] = calcMultiLayerEMA(closes, period, 2)

    const result: DemaResult[] = new Array(n)
    for (let i = 0; i < n; i++) {
      result[i] = i < period - 1 ? { dema: NaN } : { dema: 2 * ema1[i] - ema2[i] }
    }
    return result
  },
}

export default dema
