/**
 * DEMA - 双重指数移动平均线
 * DEMA = 2 * EMA(close) - EMA(EMA(close))
 * 比普通 EMA 更贴近价格，滞后更小
 */
import type { IndicatorTemplate, KLineData } from 'klinecharts'

type DemaResult = { dema: number }

const dema: IndicatorTemplate<DemaResult, number> = {
  name: 'DEMA',
  shortName: 'DEMA',
  calcParams: [21],
  figures: [{ key: 'dema', title: 'DEMA: ', type: 'line' }],
  calc: (dataList: KLineData[], { calcParams: [period] }) => {
    const n = dataList.length
    const k = 2 / (period + 1)

    // 第一层 EMA
    const ema1 = new Array<number>(n)
    // 第二层 EMA（对第一层 EMA 再做 EMA）
    const ema2 = new Array<number>(n)

    for (let i = 0; i < n; i++) {
      const close = dataList[i].close

      if (i === 0) {
        ema1[i] = close
        ema2[i] = close
      } else {
        const e1 = close * k + ema1[i - 1] * (1 - k)
        ema1[i] = e1
        const e2 = e1 * k + ema2[i - 1] * (1 - k)
        ema2[i] = e2
      }
    }

    const result: DemaResult[] = new Array(n)
    for (let i = 0; i < n; i++) {
      result[i] = i < period - 1 ? { dema: NaN } : { dema: 2 * ema1[i] - ema2[i] }
    }
    return result
  },
}

export default dema
