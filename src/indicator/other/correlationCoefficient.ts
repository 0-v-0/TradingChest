/**
 * Correlation Coefficient - 相关系数
 * 皮尔逊相关系数 r = Σ((xi-x̄)(yi-ȳ)) / √(Σ(xi-x̄)² × Σ(yi-ȳ)²)
 * x = close, y = volume（默认），衡量价格与成交量的相关性
 * 输出范围 [-1, 1]
 */
import { IndicatorTemplate, KLineData } from 'klinecharts'

const correlationCoefficient: IndicatorTemplate = {
  name: 'CorrelationCoefficient',
  shortName: 'Corr',
  calcParams: [14],
  figures: [
    { key: 'r', title: 'Corr: ', type: 'line' },
  ],
  calc: (dataList: KLineData[], indicator) => {
    const params = indicator.calcParams
    const period = params[0] as number

    return dataList.map((_, i) => {
      if (i < period - 1) {
        return { r: undefined }
      }

      // 计算 close 和 volume 的均值
      let sumX = 0
      let sumY = 0
      for (let j = 0; j < period; j++) {
        sumX += dataList[i - period + 1 + j].close
        sumY += dataList[i - period + 1 + j].volume ?? 0
      }
      const meanX = sumX / period
      const meanY = sumY / period

      // 皮尔逊相关系数
      let sumXY = 0
      let sumX2 = 0
      let sumY2 = 0
      for (let j = 0; j < period; j++) {
        const dx = dataList[i - period + 1 + j].close - meanX
        const dy = (dataList[i - period + 1 + j].volume ?? 0) - meanY
        sumXY += dx * dy
        sumX2 += dx * dx
        sumY2 += dy * dy
      }

      const denom = Math.sqrt(sumX2 * sumY2)
      const r = denom !== 0 ? sumXY / denom : 0
      return { r }
    })
  },
}

export default correlationCoefficient
