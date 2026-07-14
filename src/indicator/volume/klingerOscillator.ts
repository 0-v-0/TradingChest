/**
 * KVO - 克林格成交量振荡器（Klinger Volume Oscillator）
 * 通过成交量和价格趋势的关系预测价格反转
 *
 * 计算步骤：
 * 1. 趋势方向：当前典型价格 > 前一典型价格时为 +1，否则为 -1
 *    典型价格 = (最高价 + 最低价 + 收盘价) / 3（此处简化用 HLC 之和）
 * 2. dm = 最高价 - 最低价
 * 3. cm = 如果趋势方向不变则 cm = 前一 cm + dm，否则 cm = 前一 dm + dm
 * 4. 成交量力度（Volume Force）= volume * |2 * dm/cm - 1| * trend * 100
 *    当 cm 为零时，成交量力度为 0
 * 5. KVO = EMA(VF, 快线周期) - EMA(VF, 慢线周期)
 * 6. 信号线 = EMA(KVO, 信号周期)
 */
import { calcEMA } from '../utils'
import type { IndicatorTemplate, KLineData } from 'klinecharts'

type KlingerOscillatorResult = { kvo: number; signal: number }

const klingerOscillator: IndicatorTemplate<KlingerOscillatorResult, number> = {
  name: 'KVO',
  shortName: 'KVO',
  calcParams: [34, 55, 13],
  figures: [
    { key: 'kvo', title: 'KVO: ', type: 'line' },
    { key: 'signal', title: 'Signal: ', type: 'line' },
  ],
  calc: (dataList: KLineData[], { calcParams: [fastPeriod, slowPeriod, signalPeriod] }) => {
    const n = dataList.length
    const result: KlingerOscillatorResult[] = new Array(n)
    console.assert(n > 0, 'KlingerOscillator: dataList should not be empty')

    // 第一步：计算成交量力度数组
    const vf = new Array<number>(n)
    let prevTrend = 0
    let prevDm = 0
    let cm = 0

    for (let i = 0; i < n; i++) {
      const kline = dataList[i]
      // 使用 HLC 之和作为典型价格的代理（单调性相同）
      const hlc = kline.high + kline.low + kline.close
      const dm = kline.high - kline.low

      if (i === 0) {
        // 第一根 K 线无法判断趋势方向
        prevTrend = 0
        prevDm = dm
        cm = dm
        vf[0] = 0
      } else {
        const prevHlc = dataList[i - 1].high + dataList[i - 1].low + dataList[i - 1].close
        const trend = hlc > prevHlc ? 1 : -1

        // cm 累积：趋势方向不变时累加，方向改变时重置
        if (trend === prevTrend) {
          cm = cm + dm
        } else {
          cm = prevDm + dm
        }

        // 计算成交量力度
        vf[i] = cm === 0 ? 0 : (kline.volume ?? 0) * Math.abs(2 * (dm / cm) - 1) * trend * 100

        prevTrend = trend
        prevDm = dm
      }
    }

    // 第二步：计算快慢 EMA
    const fastEma = calcEMA(vf, fastPeriod)
    const slowEma = calcEMA(vf, slowPeriod)

    // 第三步：计算 KVO 和信号线
    // 在快慢 EMA 都未成熟之前，输出 NaN 而非 0，避免污染下游信号线。
    const kvoValues = new Array<number>(n)
    for (let i = 0; i < n; i++) {
      kvoValues[i] = (!isNaN(fastEma[i]) && !isNaN(slowEma[i])) ? fastEma[i] - slowEma[i] : NaN
    }

    // 信号线：对 KVO 值做 EMA（同样要求快慢 EMA 都已成熟）
    // 信号线的起点需要等 KVO 有效后才开始计算
    const slowStart = slowPeriod - 1
    const validLen = n - slowStart
    const validKvo = new Array<number>(validLen)
    for (let i = 0; i < validLen; i++) {
      validKvo[i] = kvoValues[i + slowStart]
    }
    const signalEma = calcEMA(validKvo, signalPeriod)

    for (let i = 0; i < n; i++) {
      let kvo = NaN
      let signal = NaN
      if (!isNaN(fastEma[i]) && !isNaN(slowEma[i])) {
        kvo = kvoValues[i]
        const signalIdx = i - slowStart
        signal =
          signalIdx >= 0 && signalIdx < signalEma.length ? signalEma[signalIdx] : NaN
      }
      result[i] = { kvo, signal }
    }
    return result
  },
}

export default klingerOscillator
