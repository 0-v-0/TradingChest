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

type T3Result = { t3: number }

const t3: IndicatorTemplate<T3Result, number> = {
  name: 'T3',
  shortName: 'T3',
  calcParams: [5, 0.7],
  figures: [{ key: 't3', title: 'T3: ', type: 'line' }],
  calc: (dataList: KLineData[], { calcParams: [period, vf] }) => {
    const n = dataList.length
    const k = 2 / (period + 1)

    // T3 系数（基于 volume factor）
    const c1 = -(vf * vf * vf)
    const c2 = 3 * vf * vf + 3 * vf * vf * vf
    const c3 = -6 * vf * vf - 3 * vf - 3 * vf * vf * vf
    const c4 = 1 + 3 * vf + vf * vf * vf + 3 * vf * vf

    // 6 层 EMA
    const e1 = new Array<number>(n)
    const e2 = new Array<number>(n)
    const e3 = new Array<number>(n)
    const e4 = new Array<number>(n)
    const e5 = new Array<number>(n)
    const e6 = new Array<number>(n)

    for (let i = 0; i < n; i++) {
      const close = dataList[i].close

      if (i === 0) {
        e1[i] = close
        e2[i] = close
        e3[i] = close
        e4[i] = close
        e5[i] = close
        e6[i] = close
      } else {
        const v1 = close * k + e1[i - 1] * (1 - k)
        e1[i] = v1
        const v2 = v1 * k + e2[i - 1] * (1 - k)
        e2[i] = v2
        const v3 = v2 * k + e3[i - 1] * (1 - k)
        e3[i] = v3
        const v4 = v3 * k + e4[i - 1] * (1 - k)
        e4[i] = v4
        const v5 = v4 * k + e5[i - 1] * (1 - k)
        e5[i] = v5
        const v6 = v5 * k + e6[i - 1] * (1 - k)
        e6[i] = v6
      }
    }

    // 需要足够数据让 6 层 EMA 都收敛，大约需要 6 * (period - 1) 个数据点
    const minBars = 6 * (period - 1)

    const result: T3Result[] = new Array(n)
    for (let i = 0; i < n; i++) {
      result[i] = i < minBars ? { t3: NaN } : { t3: c1 * e6[i] + c2 * e5[i] + c3 * e4[i] + c4 * e3[i] }
    }
    return result
  },
}

export default t3
