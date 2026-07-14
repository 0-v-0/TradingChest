/**
 * VWMA - 成交量加权移动平均线
 * VWMA = SMA(close * volume, n) / SMA(volume, n)
 * 在成交量较大的价格区域赋予更多权重
 */
import type { IndicatorTemplate, KLineData } from 'klinecharts'
import { calcSum } from '../utils'

type VwmaResult = { vwma: number }

const vwma: IndicatorTemplate<VwmaResult, number> = {
  name: 'VWMA',
  shortName: 'VWMA',
  calcParams: [20],
  figures: [{ key: 'vwma', title: 'VWMA: ', type: 'line' }],
  calc: (dataList: KLineData[], { calcParams: [period] }) => {
    const n = dataList.length

    const closeTimesVol = dataList.map(d => d.close * (d.volume ?? 0))
    const volumes = dataList.map(d => d.volume ?? 0)
    const closes = dataList.map(d => d.close)

    const cvSums = calcSum(closeTimesVol, period)
    const vSums = calcSum(volumes, period)
    const closeSums = calcSum(closes, period)

    const result: VwmaResult[] = new Array(n)
    for (let i = 0; i < n; i++) {
      if (Number.isNaN(cvSums[i])) {
        result[i] = { vwma: NaN }
      } else if (vSums[i] === 0) {
        // 无成交量时退化为简单均线
        result[i] = { vwma: closeSums[i] / period }
      } else {
        result[i] = { vwma: cvSums[i] / vSums[i] }
      }
    }
    return result
  },
}

export default vwma
