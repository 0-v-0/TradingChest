/**
 * Standard Deviation - 标准差
 * 收盘价在回看窗口内的总体标准差
 */
import { calcStdDev } from '../utils'
import type { IndicatorTemplate, KLineData } from 'klinecharts'

const standardDeviation: IndicatorTemplate = {
  name: 'STDDEV',
  shortName: 'StdDev',
  calcParams: [20],
  figures: [{ key: 'stddev', title: 'STDDEV: ', type: 'line' }],
  calc: (dataList: KLineData[], indicator) => {
    const params = indicator.calcParams
    const period = params[0] as number
    if (period <= 0) return dataList.map(() => ({ stddev: NaN }))
    const closes = dataList.map(k => k.close)
    const stddevs = calcStdDev(closes, period)
    return stddevs.map(stddev => ({ stddev }))
  },
}

export default standardDeviation
