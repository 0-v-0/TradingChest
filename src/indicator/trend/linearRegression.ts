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
    const reg = calcLinReg(closes, period)
    const result: LinearRegressionResult[] = new Array(n)
    for (let i = 0; i < n; i++) {
      const r = reg[i]
      if (Number.isNaN(r.slope)) {
        result[i] = { value: NaN, upper: NaN, lower: NaN }
      } else {
        const regValue = r.intercept + r.slope * (period - 1)
        const band = 2 * r.stdResid
        result[i] = {
          value: regValue,
          upper: regValue + band,
          lower: regValue - band,
        }
      }
    }
    return result
  },
}

export default linearRegression
