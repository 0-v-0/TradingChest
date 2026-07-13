/**
 * Correlation Coefficient - 相关系数
 * 皮尔逊相关系数 r = (nΣxy − ΣxΣy) / √((nΣx²−(Σx)²)(nΣy²−(Σy)²))
 * x = close, y = volume（默认），衡量价格与成交量的相关性
 * 输出范围 [-1, 1]
 *
 * 使用滑动窗口维护 Σx, Σy, Σx², Σy², Σxy 实现 O(n) 计算
 */
import type { IndicatorTemplate, KLineData } from 'klinecharts'

type CorrelationCoefficientResult = { r: number }

const correlationCoefficient: IndicatorTemplate<CorrelationCoefficientResult, number> = {
  name: 'CorrelationCoefficient',
  shortName: 'Corr',
  calcParams: [14],
  figures: [
    { key: 'r', title: 'Corr: ', type: 'line' },
  ],
  calc: (dataList: KLineData[], { calcParams: [period] }) => {
    const result: { r: number }[] = []

    let sumX = 0
    let sumY = 0
    let sumX2 = 0
    let sumY2 = 0
    let sumXY = 0

    for (let i = 0; i < dataList.length; i++) {
      const close = dataList[i].close
      const volume = dataList[i].volume ?? 0
      sumX += close
      sumY += volume
      sumX2 += close * close
      sumY2 += volume * volume
      sumXY += close * volume
      if (i >= period) {
        const outClose = dataList[i - period].close
        const outVol = dataList[i - period].volume ?? 0
        sumX -= outClose
        sumY -= outVol
        sumX2 -= outClose * outClose
        sumY2 -= outVol * outVol
        sumXY -= outClose * outVol
      }
      if (i >= period - 1) {
        const n = period
        const numerator = n * sumXY - sumX * sumY
        const denomX = n * sumX2 - sumX * sumX
        const denomY = n * sumY2 - sumY * sumY
        const denom = Math.sqrt(denomX * denomY)
        result.push({ r: denom !== 0 ? numerator / denom : NaN })
      } else {
        result.push({ r: NaN })
      }
    }
    return result
  },
}

export default correlationCoefficient
