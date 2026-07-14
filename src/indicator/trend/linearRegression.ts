/**
 * Linear Regression - 线性回归通道
 * 使用最小二乘法拟合直线，并计算上下通道
 * 通道宽度基于残差总体标准差
 */
import type { IndicatorTemplate, KLineData } from 'klinecharts'
import { calcLinReg } from '../utils'

type LinearRegressionResult = { value: number; upper: number; lower: number }

const linearRegression: IndicatorTemplate<LinearRegressionResult, number> = {
  name: 'LINEARREGRESSION',
  shortName: 'LinReg',
  calcParams: [14],
  figures: [
    { key: 'value', title: '回归: ', type: 'line' },
    { key: 'upper', title: '上轨: ', type: 'line' },
    { key: 'lower', title: '下轨: ', type: 'line' },
  ],
  calc: (dataList: KLineData[], { calcParams: [period] }) => {
    const n = dataList.length
    const closes: number[] = new Array(n)
    for (let i = 0; i < n; i++) closes[i] = dataList[i].close
    const { slope, intercept, stdResid } = calcLinReg(closes, period)
    const result: LinearRegressionResult[] = new Array(n)
    for (let i = 0; i < n; i++) {
      const v = intercept[i] + slope[i] * (period - 1)
      result[i] = isNaN(slope[i])
        ? { value: NaN, upper: NaN, lower: NaN }
        : { value: v, upper: v + 2 * stdResid[i], lower: v - 2 * stdResid[i] }
    }
    return result
  },
}

export default linearRegression
