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
    const closes: number[] = new Array(dataList.length)
    for (let i = 0; i < dataList.length; i++) closes[i] = dataList[i].close
    const reg = calcLinReg(closes, period)
    return dataList.map((_, i) => {
      const r = reg[i]
      if (Number.isNaN(r.slope)) {
        return { value: NaN, upper: NaN, lower: NaN }
      }
      const regValue = r.intercept + r.slope * (period - 1)
      const band = 2 * r.stdResid
      return {
        value: regValue,
        upper: regValue + band,
        lower: regValue - band,
      }
    })
  },
}

export default linearRegression
