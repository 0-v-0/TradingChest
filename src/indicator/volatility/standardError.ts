/**
 * Standard Error - 标准误差
 * 计算线性回归的标准误 SE = √(Σ(y-ŷ)² / (n-2))
 * SE 衡量价格偏离回归线的程度，值越大波动越剧烈
 */
import type { IndicatorTemplate, KLineData } from 'klinecharts'
import { calcLinReg } from '../utils'

const standardError: IndicatorTemplate = {
  name: 'StandardError',
  shortName: 'SE',
  calcParams: [14],
  figures: [
    { key: 'se', title: 'SE: ', type: 'line' },
  ],
  calc: (dataList: KLineData[], indicator) => {
    const period = indicator.calcParams[0] as number
    const closes: number[] = new Array(dataList.length)
    for (let i = 0; i < dataList.length; i++) closes[i] = dataList[i].close
    const reg = calcLinReg(closes, period)
    return dataList.map((_, i) => {
      const r = reg[i]
      if (Number.isNaN(r.stdResid) || period <= 2) {
        return { se: NaN }
      }
      return { se: r.stdResid * Math.sqrt(period / (period - 2)) }
    })
  },
}

export default standardError
