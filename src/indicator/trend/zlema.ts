/**
 * ZLEMA - 零滞后指数移动平均线
 * ZLEMA = EMA(close + (close - close[lag]), period)
 * 其中 lag = floor((period - 1) / 2)
 * 通过补偿滞后来使 EMA 更贴近当前价格
 */
import type { IndicatorTemplate, KLineData } from 'klinecharts'

type ZlemaResult = { zlema: number }

const zlema: IndicatorTemplate<ZlemaResult, number> = {
  name: 'ZLEMA',
  shortName: 'ZLEMA',
  calcParams: [21],
  figures: [{ key: 'zlema', title: 'ZLEMA: ', type: 'line' }],
  calc: (dataList: KLineData[], { calcParams: [period] }) => {
    const lag = Math.floor((period - 1) / 2)
    const k = 2 / (period + 1)

    const result: ZlemaResult[] = []
    let prevZlema = 0

    for (let i = 0; i < dataList.length; i++) {
      const close = dataList[i].close
      // 获取滞后补偿价格
      const lagClose = i >= lag ? dataList[i - lag].close : close
      // 修正后的价格 = close + (close - close[lag])
      const adjusted = close + (close - lagClose)

      prevZlema = i === 0 ? adjusted : adjusted * k + prevZlema * (1 - k)
      result.push({ zlema: i >= period - 1 ? prevZlema : NaN })
    }

    return result
  },
}

export default zlema
