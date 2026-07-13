/**
 * WMA - 加权移动平均线
 * 对近期数据赋予更高权重：权重 = 1, 2, 3, ..., n
 * WMA = Σ(close_i * weight_i) / Σ(weight_i)
 */
import type { IndicatorTemplate, KLineData } from 'klinecharts'

type WmaResult = { wma: number }

const wma: IndicatorTemplate<WmaResult, number> = {
  name: 'WMA',
  shortName: 'WMA',
  calcParams: [9],
  figures: [{ key: 'wma', title: 'WMA: ', type: 'line' }],
  calc: (dataList: KLineData[], { calcParams: [period] }) => {
    const n = dataList.length
    // 权重之和 = n * (n + 1) / 2
    const weightSum = (period * (period + 1)) / 2

    const result: WmaResult[] = new Array(n)
    for (let i = 0; i < n; i++) {
      if (i < period - 1) {
        result[i] = { wma: NaN }
      } else {
        let sum = 0
        for (let j = 0; j < period; j++) {
          // 权重从 1（最旧）到 period（最新）
          sum += dataList[i - period + 1 + j].close * (j + 1)
        }
        result[i] = { wma: sum / weightSum }
      }
    }
    return result
  },
}

export default wma
