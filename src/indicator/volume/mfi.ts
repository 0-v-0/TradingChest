/**
 * MFI - 资金流量指数（Money Flow Index）
 * 基于典型价格和成交量的动量指标，也被称为"成交量加权 RSI"
 * 输出范围 0-100
 *
 * 计算步骤：
 * 1. 典型价格 = (最高价 + 最低价 + 收盘价) / 3
 * 2. 原始资金流量 = 典型价格 * 成交量
 * 3. 正资金流量：典型价格上升时的原始资金流量之和（过去 n 期）
 * 4. 负资金流量：典型价格下降时的原始资金流量之和（过去 n 期）
 * 5. 资金流量比率 = 正资金流量 / 负资金流量
 * 6. MFI = 100 - 100 / (1 + 资金流量比率)
 *
 * 实现为 O(n) 通过维护最近 period 根 K 线内的正/负资金流量滚动和，
 * 滑动出窗口或典型价格方向反转时增量更新两个累计值。
 */
import type { IndicatorTemplate, KLineData } from 'klinecharts'

type MfiResult = { mfi: number }

const mfi: IndicatorTemplate<MfiResult, number> = {
  name: 'MFI',
  shortName: 'MFI',
  calcParams: [14],
  figures: [{ key: 'mfi', title: 'MFI: ', type: 'line' }],
  calc: (dataList: KLineData[], { calcParams: [period] }) => {
    const n = dataList.length
    const result: MfiResult[] = new Array(n)

    // 预先计算典型价格 / 原始资金流量（每个一根）
    const tp = new Array<number>(n)
    const rmf = new Array<number>(n)
    for (let i = 0; i < n; i++) {
      const k = dataList[i]
      const t = (k.high + k.low + k.close) / 3
      tp[i] = t
      rmf[i] = t * (k.volume ?? 0)
    }

    let positiveFlow = 0
    let negativeFlow = 0

    for (let i = 0; i < n; i++) {
      if (i >= 1) {
        const dir = tp[i] - tp[i - 1]
        const inRange = i <= period
        if (dir > 0 && inRange) positiveFlow += rmf[i]
        else if (dir < 0 && inRange) negativeFlow += rmf[i]

        if (i > period) {
          const outDir = tp[i - period] - tp[i - period - 1]
          if (outDir > 0) positiveFlow -= rmf[i - period]
          else if (outDir < 0) negativeFlow -= rmf[i - period]
        }
      }

      let mfi: number
      if (i >= period) {
        if (negativeFlow === 0) {
          mfi = 100
        } else {
          mfi = 100 - 100 / (1 + positiveFlow / negativeFlow)
        }
      } else {
        mfi = NaN
      }
      result[i] = { mfi }
    }
    return result
  },
}

export default mfi
