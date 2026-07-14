/**
 * WMA - 加权移动平均线
 * 对近期数据赋予更高权重：权重 = 1, 2, 3, ..., n
 * WMA = Σ(close_i * weight_i) / Σ(weight_i)
 */
import type { IndicatorTemplate, KLineData } from 'klinecharts'
import { calcWMA } from '../utils'

type WmaResult = { wma: number }

const wma: IndicatorTemplate<WmaResult, number> = {
  name: 'WMA',
  shortName: 'WMA',
  calcParams: [9],
  figures: [{ key: 'wma', title: 'WMA: ', type: 'line' }],
  calc: (dataList: KLineData[], { calcParams: [period] }) => {
    const closes = dataList.map(d => d.close)
    const wmaValues = calcWMA(closes, period)
    return wmaValues.map(v => ({ wma: v }))
  },
}

export default wma
