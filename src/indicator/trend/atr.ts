/**
 * ATR - 平均真实波幅
 * 使用 Wilder 平滑法（RMA）计算真实波幅的移动平均
 */
import type { IndicatorTemplate, KLineData } from 'klinecharts'
import { calcTR, calcRMA } from '../utils'

type AtrResult = { atr: number }

const atr: IndicatorTemplate<AtrResult, number> = {
  name: 'ATR',
  shortName: 'ATR',
  calcParams: [14],
  figures: [{ key: 'atr', title: 'ATR: ', type: 'line' }],
  calc: (dataList: KLineData[], { calcParams: [period] }) => {
    const n = dataList.length
    const high = new Array<number>(n)
    const low = new Array<number>(n)
    const close = new Array<number>(n)
    for (let i = 0; i < n; i++) {
      const d = dataList[i]
      high[i] = d.high
      low[i] = d.low
      close[i] = d.close
    }

    const tr = calcTR(high, low, close)
    const atrArr = calcRMA(tr, period)

    const result: AtrResult[] = new Array(n)
    for (let i = 0; i < n; i++) {
      result[i] = { atr: atrArr[i] }
    }
    return result
  },
}

export default atr
