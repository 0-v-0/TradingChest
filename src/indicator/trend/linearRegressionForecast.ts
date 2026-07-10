/**
 * Linear Regression Forecast - 线性回归预测
 * 与 LINEARREGRESSION 不同，Forecast 版本只输出回归拟合值和斜率方向
 * 不画标准差通道
 *
 * 算法：最小二乘法拟合 y = a + b*x
 * 输出回归拟合值（每个点）和斜率
 *
 * 参数: period
 */
import { IndicatorTemplate, KLineData } from 'klinecharts'

const linearRegressionForecast: IndicatorTemplate = {
  name: 'LinearRegressionForecast',
  shortName: 'LinRegF',
  calcParams: [14],
  figures: [
    { key: 'forecast', title: '预测: ', type: 'line' },
    { key: 'slope', title: '斜率: ', type: 'line' },
  ],
  calc: (dataList: KLineData[], indicator) => {
    const params = indicator.calcParams
    const period = params[0] as number

    return dataList.map((_, i) => {
      if (i < period - 1) {
        return { forecast: undefined, slope: undefined }
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

      // 回归线终点值（x = period - 1）即预测值
      const forecast = a + b * (period - 1)

      return { forecast, slope: b }
    })
  },
}

export default linearRegressionForecast
