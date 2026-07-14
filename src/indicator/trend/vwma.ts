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

    const closeTimesVol = new Array<number>(n)
    const volumes = new Array<number>(n)
    const closes = new Array<number>(n)
    for (let i = 0; i < n; i++) {
      const d = dataList[i]
      const vol = d.volume ?? 0
      closeTimesVol[i] = d.close * vol
      volumes[i] = vol
      closes[i] = d.close
    }

    const cvSums = calcSum(closeTimesVol, period)
    const vSums = calcSum(volumes, period)
    const closeSums = calcSum(closes, period)

    const result: VwmaResult[] = new Array(n)
    for (let i = 0; i < n; i++) {
      result[i] = isNaN(cvSums[i])
        ? { vwma: NaN }
        : {
          vwma: vSums[i] === 0 ?
            // 无成交量时退化为简单均线
            closeSums[i] / period : cvSums[i] / vSums[i]
        }
    }
    return result
  },
}

export default vwma
