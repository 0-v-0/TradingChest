/**
 * VWMA - 成交量加权移动平均线
 * VWMA = SMA(close * volume, n) / SMA(volume, n)
 * 在成交量较大的价格区域赋予更多权重
 */
import type { IndicatorTemplate, KLineData } from 'klinecharts'

type VwmaResult = { vwma: number }

const vwma: IndicatorTemplate<VwmaResult, number> = {
  name: 'VWMA',
  shortName: 'VWMA',
  calcParams: [20],
  figures: [{ key: 'vwma', title: 'VWMA: ', type: 'line' }],
  calc: (dataList: KLineData[], { calcParams: [period] }) => {
    const n = dataList.length

    const result: VwmaResult[] = new Array(n)
    for (let i = 0; i < n; i++) {
      if (i < period - 1) {
        result[i] = { vwma: NaN }
      } else {
        let cvSum = 0
        let vSum = 0
        for (let j = i - period + 1; j <= i; j++) {
          const vol = dataList[j].volume ?? 0
          cvSum += dataList[j].close * vol
          vSum += vol
        }
        // 无成交量时退化为简单均线
        if (vSum === 0) {
          let closeSum = 0
          for (let j = i - period + 1; j <= i; j++) {
            closeSum += dataList[j].close
          }
          result[i] = { vwma: closeSum / period }
        } else {
          result[i] = { vwma: cvSum / vSum }
        }
      }
    }
    return result
  },
}

export default vwma
