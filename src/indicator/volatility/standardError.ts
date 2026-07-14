/**
 * Standard Error - 标准误差
 * 计算线性回归的标准误 SE = √(Σ(y-ŷ)² / (n-2))
 * SE 衡量价格偏离回归线的程度，值越大波动越剧烈
 */
import type { IndicatorTemplate, KLineData } from 'klinecharts'
import { calcLinReg } from '../utils'

type StandardErrorResult = { se: number }

const standardError: IndicatorTemplate<StandardErrorResult, number> = {
  name: 'StandardError',
  shortName: 'SE',
  calcParams: [14],
  figures: [
    { key: 'se', title: 'SE: ', type: 'line' },
  ],
  calc: (dataList: KLineData[], { calcParams: [period] }) => {
    const n = dataList.length
    const closes: number[] = new Array(n)
    for (let i = 0; i < n; i++) closes[i] = dataList[i].close
    const { stdResid } = calcLinReg(closes, period)
    const result: StandardErrorResult[] = new Array(n)
    for (let i = 0; i < n; i++) {
      if (Number.isNaN(stdResid[i]) || period <= 2) {
        result[i] = { se: NaN }
      } else {
        result[i] = { se: stdResid[i] * Math.sqrt(period / (period - 2)) }
      }
    }
    return result
  },
}

export default standardError
