/**
 * VROC - 成交量变化率（Volume Rate of Change）
 * 衡量当前成交量相对于 n 期前成交量的百分比变化
 *
 * 计算公式：
 * VROC = (当前成交量 - n 期前成交量) / n 期前成交量 * 100
 *
 * 当 n 期前成交量为零时无法计算，返回 undefined
 */
import type { IndicatorTemplate, KLineData } from 'klinecharts'

type VrocResult = { vroc: number }

const vroc: IndicatorTemplate<VrocResult, number> = {
  name: 'VROC',
  shortName: 'VROC',
  calcParams: [14],
  figures: [{ key: 'vroc', title: 'VROC: ', type: 'line' }],
  calc: (dataList: KLineData[], { calcParams: [period] }) => {
    const n = dataList.length
    const result: VrocResult[] = new Array(n)

    for (let i = 0; i < n; i++) {
      let vroc = NaN
      if (i >= period) {
        const prevVol = dataList[i - period].volume ?? 0
        const curVol = dataList[i].volume ?? 0
        // n 期前成交量为零时除法无意义
        if (prevVol !== 0) {
          vroc = ((curVol - prevVol) / prevVol) * 100
        }
      }
      result[i] = { vroc }
    }
    return result
  },
}

export default vroc
