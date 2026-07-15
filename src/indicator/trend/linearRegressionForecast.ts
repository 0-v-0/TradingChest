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
import { calcLinReg, extractField } from '../utils'

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
    const n = dataList.length
    const closes = extractField(dataList, 'close')
    const { slope, intercept } = calcLinReg(closes, period)
    const result: LinearRegressionForecastResult[] = new Array(n)
    for (let i = 0; i < n; i++) {
      result[i] = isNaN(slope[i])
        ? { forecast: NaN, slope: NaN }
        : { forecast: intercept[i] + slope[i] * (period - 1), slope: slope[i] }
    }
    return result
  },
}

export default linearRegressionForecast
