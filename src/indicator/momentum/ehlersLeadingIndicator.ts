/**
 * Ehlers Leading Indicator - 埃勒斯领先指标
 * John Ehlers 设计的领先指标
 *
 * 算法：
 *   对 close 做 2-pole Butterworth 高通滤波（移除低频趋势）
 *   对滤波结果做 EMA 平滑
 *   计算导数（一阶差分）作为领先信号
 *   Lead = Smooth + K * Derivative
 *
 * 参数: period, K(导数增益系数)
 */
import type { IndicatorTemplate, KLineData } from 'klinecharts'
import { calcEMA } from '../utils'

type EhlersLeadingResult = {
  lead: number
  signal: number
}

const ehlersLeadingIndicator: IndicatorTemplate<EhlersLeadingResult, number> = {
  name: 'EhlersLeading',
  shortName: 'EhlersLead',
  calcParams: [10, 1.0],
  figures: [
    { key: 'lead', title: 'Lead: ', type: 'line' },
    { key: 'signal', title: 'Signal: ', type: 'line' },
  ],
  calc: (dataList: KLineData[], { calcParams: [period, k] }) => {
    const n = dataList.length
    const close = dataList.map(d => d.close)

    // 2-pole Butterworth 高通滤波
    // 角频率
    const alpha = (1 - Math.sin(2 * Math.PI / period)) / Math.cos(2 * Math.PI / period)
    // 实际滤波系数
    const c1 = (1 + alpha) / 2
    const c2 = (1 + alpha) / 2
    const c3 = alpha

    const hp = new Array<number>(n)
    for (let i = 0; i < n; i++) {
      if (i < 2) {
        hp[i] = 0
      } else {
        hp[i] =
          c1 * close[i] - 2 * c1 * close[i - 1] + c2 * close[i - 2]
          + c3 * 2 * hp[i - 1] - c3 * c3 * hp[i - 2]
      }
    }

    // EMA 平滑高通滤波结果
    const smooth = calcEMA(hp, Math.max(Math.round(period / 2), 2))

    // 计算导数（一阶差分）
    const derivative = new Array<number>(n)
    for (let i = 0; i < n; i++) {
      derivative[i] =
        (i === 0 || isNaN(smooth[i]) || isNaN(smooth[i - 1])) ? NaN :
          smooth[i] - smooth[i - 1]
    }

    // Lead = Smooth + K * Derivative
    const result: EhlersLeadingResult[] = new Array(n)
    for (let i = 0; i < n; i++) {
      const s = smooth[i]
      const d = derivative[i]
      if (isNaN(s)) {
        result[i] = { lead: NaN, signal: NaN }
      } else {
        const lead = !isNaN(d) ? s + k * d : s
        result[i] = { lead, signal: s }
      }
    }

    return result
  },
}

export default ehlersLeadingIndicator
