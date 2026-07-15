/**
 * Envelopes - 移动平均包络线
 * 在简单移动平均线上下各偏移固定百分比形成通道
 * 用于识别超买超卖区域和趋势方向
 */
import type { IndicatorTemplate, KLineData } from 'klinecharts'
import { calcSMA, extractField } from '../utils'

type EnvelopesResult = { middle: number; upper: number; lower: number }

const envelopes: IndicatorTemplate<EnvelopesResult, number> = {
  name: 'ENVELOPES',
  shortName: 'Envelopes',
  calcParams: [20, 2.5],
  figures: [
    { key: 'middle', title: '中轨: ', type: 'line' },
    { key: 'upper', title: '上轨: ', type: 'line' },
    { key: 'lower', title: '下轨: ', type: 'line' },
  ],
  calc: (dataList: KLineData[], { calcParams: [period, percentage] }) => {
    const n = dataList.length

    const closes = extractField(dataList, 'close')
    const smaValues = calcSMA(closes, period)

    const result: EnvelopesResult[] = new Array(n)
    for (let i = 0; i < n; i++) {
      const sma = smaValues[i]
      result[i] = isNaN(sma)
        ? { middle: NaN, upper: NaN, lower: NaN }
        : { middle: sma, upper: sma + sma * percentage / 100, lower: sma - sma * percentage / 100 }
    }
    return result
  },
}

export default envelopes
