/**
 * Qstick - Q棒指标
 * 衡量买方与卖方主导程度
 * Qstick = SMA(close - open, period)
 * 正值表示买方主导（收盘>开盘），负值表示卖方主导
 */
import type { IndicatorTemplate, KLineData } from 'klinecharts'
import { calcSMA } from '../utils'

const qstick: IndicatorTemplate = {
  name: 'Qstick',
  shortName: 'Qstick',
  calcParams: [14],
  figures: [
    { key: 'qstick', title: 'Qstick: ', type: 'bar' },
  ],
  calc: (dataList: KLineData[], indicator) => {
    const params = indicator.calcParams
    const period = params[0] as number

    const diff = dataList.map(k => k.close - k.open)
    const sma = calcSMA(diff, period)

    return dataList.map((_, i) => ({
      qstick: sma[i],
    }))
  },
}

export default qstick
