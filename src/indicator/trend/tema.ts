/**
 * TEMA - 三重指数移动平均线
 * TEMA = 3 * EMA - 3 * EMA(EMA) + EMA(EMA(EMA))
 * 进一步减少滞后，比 DEMA 响应更快
 */
import type { IndicatorTemplate, KLineData } from 'klinecharts'

type TemaResult = { tema: number }

const tema: IndicatorTemplate<TemaResult, number> = {
  name: 'TEMA',
  shortName: 'TEMA',
  calcParams: [21],
  figures: [{ key: 'tema', title: 'TEMA: ', type: 'line' }],
  calc: (dataList: KLineData[], { calcParams: [period] }) => {
    const n = dataList.length
    const k = 2 / (period + 1)

    const ema1 = new Array<number>(n)
    const ema2 = new Array<number>(n)
    const ema3 = new Array<number>(n)

    for (let i = 0; i < n; i++) {
      const close = dataList[i].close

      if (i === 0) {
        ema1[i] = close
        ema2[i] = close
        ema3[i] = close
      } else {
        const e1 = close * k + ema1[i - 1] * (1 - k)
        ema1[i] = e1
        const e2 = e1 * k + ema2[i - 1] * (1 - k)
        ema2[i] = e2
        const e3 = e2 * k + ema3[i - 1] * (1 - k)
        ema3[i] = e3
      }
    }

    const result: TemaResult[] = new Array(n)
    for (let i = 0; i < n; i++) {
      if (i < period - 1) {
        result[i] = { tema: NaN }
      } else {
        result[i] = { tema: 3 * ema1[i] - 3 * ema2[i] + ema3[i] }
      }
    }
    return result
  },
}

export default tema
