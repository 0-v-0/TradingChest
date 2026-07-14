/**
 * Elder Ray - 艾尔德射线
 * 由 Alexander Elder 提出，分解多空力量为牛力和熊力
 *
 * 计算公式：
 * EMA = 收盘价的 n 期指数移动平均
 * 牛力（Bull Power）= 最高价 - EMA
 * 熊力（Bear Power）= 最低价 - EMA
 *
 * 牛力 > 0 表示多方控制，熊力 < 0 表示空方控制
 * EMA 权重因子 k = 2 / (n + 1)，首个有效值使用 SMA 种子
 */
import { calcEMA } from '../utils'
import type { IndicatorTemplate, KLineData } from 'klinecharts'

type ElderRayResult = { bullPower: number; bearPower: number }

const elderRay: IndicatorTemplate<ElderRayResult, number> = {
  name: 'ELDER_RAY',
  shortName: 'Elder Ray',
  calcParams: [13],
  figures: [
    { key: 'bullPower', title: 'Bull: ', type: 'line' },
    { key: 'bearPower', title: 'Bear: ', type: 'line' },
  ],
  calc: (dataList: KLineData[], { calcParams: [period] }) => {
    const n = dataList.length
    const result: ElderRayResult[] = new Array(n)
    const closes = new Array<number>(n)
    for (let i = 0; i < n; i++) closes[i] = dataList[i].close
    const ema = calcEMA(closes, period)

    for (let i = 0; i < n; i++) {
      const kline = dataList[i]
      const emaVal = ema[i]
      result[i] = {
        bullPower: !Number.isNaN(emaVal) ? kline.high - emaVal : NaN,
        bearPower: !Number.isNaN(emaVal) ? kline.low - emaVal : NaN,
      }
    }
    return result
  },
}

export default elderRay
