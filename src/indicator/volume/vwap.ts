/**
 * VWAP - 成交量加权平均价格
 * 基于交易时段内的累计典型价格乘以成交量除以累计成交量
 * 典型价格 = (最高价 + 最低价 + 收盘价) / 3
 */
import type { IndicatorTemplate, KLineData } from 'klinecharts'

type VwapResult = { vwap: number }

const vwap: IndicatorTemplate = {
  name: 'VWAP',
  shortName: 'VWAP',
  calcParams: [],
  figures: [{ key: 'vwap', title: 'VWAP: ', type: 'line' }],
  calc: (dataList: KLineData[]) => {
    const result: VwapResult[] = []
    // 累计典型价格 * 成交量
    let cumTpv = 0
    // 累计成交量
    let cumVol = 0

    for (let i = 0; i < dataList.length; i++) {
      const kline = dataList[i]
      const typicalPrice = (kline.high + kline.low + kline.close) / 3
      cumTpv += typicalPrice * (kline.volume ?? 0)
      cumVol += kline.volume ?? 0

      let vwap = NaN
      // 累计成交量为零时无法计算 VWAP
      if (cumVol !== 0) {
        vwap = cumTpv / cumVol
      }
      result.push({ vwap })
    }
    return result
  },
}

export default vwap
