/**
 * WMA - 加权移动平均线
 * 对近期数据赋予更高权重：权重 = 1, 2, 3, ..., n
 * WMA = Σ(close_i * weight_i) / Σ(weight_i)
 */
import type { IndicatorTemplate, KLineData } from 'klinecharts'
import { calcWMA, extractField } from '../utils'

type WmaResult = { wma: number }

const wma: IndicatorTemplate<WmaResult, number> = {
  name: 'WMA',
  shortName: 'WMA',
  calcParams: [9],
  figures: [{ key: 'wma', title: 'WMA: ', type: 'line' }],
  calc: (dataList: KLineData[], { calcParams: [period] }) => {
    const n = dataList.length
    const closes = extractField(dataList, 'close')
    const wmaValues = calcWMA(closes, period)
    const result: WmaResult[] = new Array(n)
    for (let i = 0; i < n; i++) result[i] = { wma: wmaValues[i] }
    return result
  },
}

export default wma
