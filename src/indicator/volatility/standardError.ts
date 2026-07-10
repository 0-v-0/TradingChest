/**
 * Standard Error - 标准误差
 * 计算线性回归的标准误 SE = √(Σ(y-ŷ)² / (n-2))
 * SE 衡量价格偏离回归线的程度，值越大波动越剧烈
 */
import type { IndicatorTemplate, KLineData } from 'klinecharts'

const standardError: IndicatorTemplate = {
  name: 'StandardError',
  shortName: 'SE',
  calcParams: [14],
  figures: [
    { key: 'se', title: 'SE: ', type: 'line' },
  ],
  calc: (dataList: KLineData[], indicator) => {
    const params = indicator.calcParams
    const period = params[0] as number

    return dataList.map((_, i) => {
      if (i < period - 1) {
        return { se: undefined }
      }

      // 最小二乘法：y = a + b * x
      let sumX = 0
      let sumY = 0
      let sumXY = 0
      let sumX2 = 0

      for (let j = 0; j < period; j++) {
        const x = j
        const y = dataList[i - period + 1 + j].close
        sumX += x
        sumY += y
        sumXY += x * y
        sumX2 += x * x
      }

      const n = period
      const denominator = n * sumX2 - sumX * sumX
      const b = denominator !== 0 ? (n * sumXY - sumX * sumY) / denominator : 0
      const a = (sumY - b * sumX) / n

      // 计算标准误差 SE = √(Σ(y-ŷ)² / (n-2))
      let sumSqResid = 0
      for (let j = 0; j < period; j++) {
        const y = dataList[i - period + 1 + j].close
        const yHat = a + b * j
        sumSqResid += (y - yHat) * (y - yHat)
      }

      const se = n > 2 ? Math.sqrt(sumSqResid / (n - 2)) : 0
      return { se }
    })
  },
}

export default standardError
