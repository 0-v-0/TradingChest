/**
 * Ulcer Index - 溃疡指数
 * 衡量价格从最高点回撤的深度和持续时间，反映下行风险
 * UI = sqrt(sum(pctDrawdown^2) / n)
 *
 * pctDrawdown[j] = (close[j] - H) / H * 100  (H = rolling max)
 * sumSquared = 10000 * Σ(close[j]/H - 1)²
 *            = 10000 * [Σ(close[j]²)/H² - 2*Σ(close[j])/H + n]
 * 只需维护滑动窗口 sumClose、sumCloseSq 和滚动最大值 H
 */
import type { IndicatorTemplate, KLineData } from 'klinecharts'

type UlcerIndexResult = { ui: number }

const ulcerIndex: IndicatorTemplate = {
  name: 'UI',
  shortName: 'UI',
  calcParams: [14],
  figures: [{ key: 'ui', title: 'UI: ', type: 'line' }],
  calc: (dataList: KLineData[], indicator) => {
    const params = indicator.calcParams
    const period = params[0] as number
    const result: UlcerIndexResult[] = []
    if (period <= 0) return dataList.map(() => ({ ui: NaN }))

    // Monotonic deque for rolling window max (same logic as calcHighest)
    const deque: number[] = []
    let head = 0
    let sumClose = 0
    let sumCloseSq = 0

    for (let i = 0; i < dataList.length; i++) {
      const close = dataList[i].close
      sumClose += close
      sumCloseSq += close * close
      if (i >= period) {
        const out = dataList[i - period].close
        sumClose -= out
        sumCloseSq -= out * out
      }

      while (deque.length > head && dataList[deque[deque.length - 1]].close <= close) {
        deque.pop()
      }
      deque.push(i)
      if (deque[head] <= i - period) head++

      if (i >= period - 1) {
        const H = dataList[deque[head]].close
        if (H <= 0) {
          result.push({ ui: NaN })
        } else {
          const H2 = H * H
          const variance = sumCloseSq / H2 - 2 * sumClose / H + period
          result.push({ ui: Math.sqrt(Math.max(variance / period, 0)) * 100 })
        }
      } else {
        result.push({ ui: NaN })
      }
    }
    return result
  },
}

export default ulcerIndex
