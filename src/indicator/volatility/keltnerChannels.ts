/**
 * Keltner Channels - 肯特纳通道
 * 以 EMA 为中轨，ATR 乘以倍数为上下轨的波动率通道指标
 */
import type { IndicatorTemplate, KLineData } from 'klinecharts'

type KeltnerChannelsResult = {
  middle: number | undefined
  upper: number | undefined
  lower: number | undefined
}

const keltnerChannels: IndicatorTemplate = {
  name: 'KC',
  shortName: 'KC',
  calcParams: [20, 1.5],
  figures: [
    { key: 'middle', title: 'MID: ', type: 'line' },
    { key: 'upper', title: 'UP: ', type: 'line' },
    { key: 'lower', title: 'LOW: ', type: 'line' },
  ],
  calc: (dataList: KLineData[], indicator) => {
    const params = indicator.calcParams
    const emaPeriod = params[0] as number
    const atrMultiplier = params[1] as number
    const result: KeltnerChannelsResult[] = []

    // EMA 平滑系数
    const emaK = 2 / (emaPeriod + 1)

    // ATR 使用 Wilder 平滑（RMA）
    let emaValue = 0
    let atrValue = 0
    let emaCumSum = 0
    let atrCumSum = 0

    for (let i = 0; i < dataList.length; i++) {
      const kline = dataList[i]

      // 计算真实波幅（True Range）
      let tr: number
      if (i === 0) {
        tr = kline.high - kline.low
      } else {
        const prevClose = dataList[i - 1].close
        tr = Math.max(
          kline.high - kline.low,
          Math.abs(kline.high - prevClose),
          Math.abs(kline.low - prevClose),
        )
      }

      let middle = undefined
      let upper = undefined
      let lower = undefined

      if (i < emaPeriod) {
        // 累积阶段：收集前 emaPeriod 个数据
        emaCumSum += kline.close
        atrCumSum += tr

        if (i === emaPeriod - 1) {
          // 首个 EMA 值为 SMA
          emaValue = emaCumSum / emaPeriod
          // 首个 ATR 值为 TR 的简单平均
          atrValue = atrCumSum / emaPeriod
          middle = emaValue
          upper = emaValue + atrMultiplier * atrValue
          lower = emaValue - atrMultiplier * atrValue
        }
      } else {
        // EMA 递推
        emaValue = kline.close * emaK + emaValue * (1 - emaK)
        // ATR Wilder 平滑
        atrValue = (atrValue * (emaPeriod - 1) + tr) / emaPeriod
        middle = emaValue
        upper = emaValue + atrMultiplier * atrValue
        lower = emaValue - atrMultiplier * atrValue
      }
      result.push({ middle, upper, lower })
    }
    return result
  },
}

export default keltnerChannels
