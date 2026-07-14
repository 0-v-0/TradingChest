/**
 * TEMA - 三重指数移动平均线
 * TEMA = 3 * EMA - 3 * EMA(EMA) + EMA(EMA(EMA))
 * 进一步减少滞后，比 DEMA 响应更快
 */
import type { IndicatorTemplate, KLineData } from 'klinecharts'
import { calcMultiLayerEMA } from '../utils'

type TemaResult = { tema: number }

const tema: IndicatorTemplate<TemaResult, number> = {
  name: 'TEMA',
  shortName: 'TEMA',
  calcParams: [21],
  figures: [{ key: 'tema', title: 'TEMA: ', type: 'line' }],
  calc: (dataList: KLineData[], { calcParams: [period] }) => {
    const n = dataList.length
    const closes = new Array<number>(n)
    for (let i = 0; i < n; i++) closes[i] = dataList[i].close

    const [ema1, ema2, ema3] = calcMultiLayerEMA(closes, period, 3)

    const result: TemaResult[] = new Array(n)
    for (let i = 0; i < n; i++) {
      result[i] = i < period - 1 ? { tema: NaN } : { tema: 3 * ema1[i] - 3 * ema2[i] + ema3[i] }
    }
    return result
  },
}

export default tema
