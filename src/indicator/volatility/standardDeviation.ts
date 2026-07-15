/**
 * Standard Deviation - 标准差
 * 收盘价在回看窗口内的总体标准差
 */
import { calcStdDev, extractField } from '../utils'
import type { IndicatorTemplate, KLineData } from 'klinecharts'

type StandardDeviationResult = { stddev: number }

const standardDeviation: IndicatorTemplate<StandardDeviationResult, number> = {
  name: 'STDDEV',
  shortName: 'StdDev',
  calcParams: [20],
  figures: [{ key: 'stddev', title: 'STDDEV: ', type: 'line' }],
  calc: (dataList: KLineData[], { calcParams: [period] }) => {
    const n = dataList.length
    const closes = extractField(dataList, 'close')
    const stddevs = calcStdDev(closes, period)
    const result: StandardDeviationResult[] = new Array(n)
    for (let i = 0; i < n; i++) {
      result[i] = { stddev: stddevs[i] }
    }
    return result
  },
}

export default standardDeviation
