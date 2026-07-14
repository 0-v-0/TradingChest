/**
 * T3 - Tillson T3 移动平均线
 * 三次平滑的 EMA，通过 volume factor 控制平滑程度
 * 比普通 EMA 更平滑且滞后更小
 *
 * 计算步骤：
 * 1. 计算 6 层 EMA（e1 到 e6）
 * 2. T3 = c1*e6 + c2*e5 + c3*e4 + c4*e3
 *    其中系数由 volume factor (vf) 决定
 */
import type { IndicatorTemplate, KLineData } from 'klinecharts'
import { calcMultiLayerEMA } from '../utils'

type T3Result = { t3: number }

const t3: IndicatorTemplate<T3Result, number> = {
  name: 'T3',
  shortName: 'T3',
  calcParams: [5, 0.7],
  figures: [{ key: 't3', title: 'T3: ', type: 'line' }],
  calc: (dataList: KLineData[], { calcParams: [period, vf] }) => {
    const n = dataList.length

    const c1 = -(vf * vf * vf)
    const c2 = 3 * vf * vf + 3 * vf * vf * vf
    const c3 = -6 * vf * vf - 3 * vf - 3 * vf * vf * vf
    const c4 = 1 + 3 * vf + vf * vf * vf + 3 * vf * vf

    const closes = new Array<number>(n)
    for (let i = 0; i < n; i++) closes[i] = dataList[i].close

    const [, , e3, e4, e5, e6] = calcMultiLayerEMA(closes, period, 6)

    const minBars = 6 * (period - 1)

    const result: T3Result[] = new Array(n)
    for (let i = 0; i < n; i++) {
      result[i] = i < minBars
        ? { t3: NaN }
        : { t3: c1 * e6[i] + c2 * e5[i] + c3 * e4[i] + c4 * e3[i] }
    }
    return result
  },
}

export default t3
