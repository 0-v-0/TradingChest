/**
 * Linear Regression Forecast - 线性回归预测
 * 输出回归拟合值（每个点）与斜率
 *
 * 算法：最小二乘法拟合 y = a + b*x，x=0..period-1
 * 输出每个 i 处的预测值 fitAt(period-1) 与斜率 b
 *
 * 参数: period
 */
import type { IndicatorTemplate, KLineData } from 'klinecharts'
import { calcLinReg } from '../utils'

type LinearRegressionForecastResult = { forecast: number; slope: number }

const linearRegressionForecast: IndicatorTemplate<LinearRegressionForecastResult, number> = {
  name: 'LinearRegressionForecast',
  shortName: 'LinRegF',
  calcParams: [14],
  figures: [
    { key: 'forecast', title: '预测: ', type: 'line' },
    { key: 'slope', title: '斜率: ', type: 'line' },
  ],
  calc: (dataList: KLineData[], { calcParams: [period] }) => {
    const closes: number[] = new Array(dataList.length)
    for (let i = 0; i < dataList.length; i++) closes[i] = dataList[i].close
    const reg = calcLinReg(closes, period)
    return dataList.map((_, i) => {
      const r = reg[i]
      if (Number.isNaN(r.slope)) {
        return { forecast: NaN, slope: NaN }
      }
      return {
        forecast: r.intercept + r.slope * (period - 1),
        slope: r.slope,
      }
    })
  },
}

export default linearRegressionForecast
