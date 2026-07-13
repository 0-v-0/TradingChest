/**
 * Qstick - Q棒指标
 * 衡量买方与卖方主导程度
 * Qstick = SMA(close - open, period)
 * 正值表示买方主导（收盘>开盘），负值表示卖方主导
 */
import type { IndicatorTemplate, KLineData } from 'klinecharts'
import { calcSMA } from '../utils'

type QstickResult = { qstick: number }

const qstick: IndicatorTemplate<QstickResult, number> = {
  name: 'Qstick',
  shortName: 'Qstick',
  calcParams: [14],
  figures: [
    { key: 'qstick', title: 'Qstick: ', type: 'bar' },
  ],
  calc: (dataList: KLineData[], { calcParams: [period] }) => {
    const n = dataList.length

    const diff = dataList.map(k => k.close - k.open)
    const sma = calcSMA(diff, period)

    const result: QstickResult[] = new Array(n)
    for (let i = 0; i < n; i++) {
      result[i] = { qstick: sma[i] }
    }
    return result
  },
}

export default qstick
