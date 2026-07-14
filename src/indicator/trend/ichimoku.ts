/**
 * Ichimoku Cloud - 一目均衡图
 * 包含转换线、基准线、先行带A/B、迟行带五条线
 */
import type { IndicatorTemplate, KLineData } from 'klinecharts'
import { calcHighest, calcLowest } from '../utils'

type IchimokuResult = {
  tenkanSen: number
  kijunSen: number
  senkouSpanA: number
  senkouSpanB: number
  chikouSpan: number
}

const ichimoku: IndicatorTemplate<IchimokuResult, number> = {
  name: 'ICHIMOKU',
  shortName: 'Ichimoku',
  calcParams: [9, 26, 52, 26],
  figures: [
    { key: 'tenkanSen', title: '转换线: ', type: 'line' },
    { key: 'kijunSen', title: '基准线: ', type: 'line' },
    { key: 'senkouSpanA', title: '先行带A: ', type: 'line' },
    { key: 'senkouSpanB', title: '先行带B: ', type: 'line' },
    { key: 'chikouSpan', title: '迟行带: ', type: 'line' },
  ],
  calc: (dataList: KLineData[], { calcParams: [tenkanPeriod, kijunPeriod, senkouBPeriod, displacement] }) => {
    const n = dataList.length

    // 预提取 high/low 并用 O(n) 滑动窗口一次算出所有周期的 highest/lowest
    const highs = new Array<number>(n)
    const lows = new Array<number>(n)
    for (let i = 0; i < n; i++) {
      highs[i] = dataList[i].high
      lows[i] = dataList[i].low
    }
    const tenkanHigh = calcHighest(highs, tenkanPeriod)
    const tenkanLow = calcLowest(lows, tenkanPeriod)
    const kijunHigh = calcHighest(highs, kijunPeriod)
    const kijunLow = calcLowest(lows, kijunPeriod)
    const senkouBHigh = calcHighest(highs, senkouBPeriod)
    const senkouBLow = calcLowest(lows, senkouBPeriod)

    const tenkanArr = new Array<number>(n)
    const kijunArr = new Array<number>(n)
    const spanAArr = new Array<number>(n)
    const spanBArr = new Array<number>(n)

    for (let i = 0; i < n; i++) {
      const tenkan = !isNaN(tenkanHigh[i]) && !isNaN(tenkanLow[i])
        ? (tenkanHigh[i] + tenkanLow[i]) / 2
        : NaN
      const kijun = !isNaN(kijunHigh[i]) && !isNaN(kijunLow[i])
        ? (kijunHigh[i] + kijunLow[i]) / 2
        : NaN
      tenkanArr[i] = tenkan
      kijunArr[i] = kijun

      // 先行带 A = (转换线 + 基准线) / 2
      if (!isNaN(tenkan) && !isNaN(kijun)) {
        spanAArr[i] = (tenkan + kijun) / 2
      } else {
        spanAArr[i] = NaN
      }

      // 先行带 B = (senkouBPeriod 周期内最高价 + 最低价) / 2
      spanBArr[i] = !isNaN(senkouBHigh[i]) && !isNaN(senkouBLow[i])
        ? (senkouBHigh[i] + senkouBLow[i]) / 2
        : NaN
    }

    // 组装结果，先行带需要前移 displacement 个周期，迟行带需要后移 displacement 个周期
    const totalLength = n + displacement
    const result: IchimokuResult[] = new Array(totalLength)

    for (let i = 0; i < totalLength; i++) {
      const item: Partial<IchimokuResult> = {}

      if (i < n) {
        item.tenkanSen = tenkanArr[i]
        item.kijunSen = kijunArr[i]
      }

      // 先行带：当前位置的值来自 displacement 个周期之前
      const spanSrcIdx = i - displacement
      if (spanSrcIdx >= 0 && spanSrcIdx < n) {
        item.senkouSpanA = spanAArr[spanSrcIdx]
        item.senkouSpanB = spanBArr[spanSrcIdx]
      }

      // 迟行带：将当前收盘价显示在 displacement 个周期之前
      const chikouSrcIdx = i + displacement
      if (chikouSrcIdx < n) {
        item.chikouSpan = dataList[chikouSrcIdx].close
      }

      result[i] = item as IchimokuResult
    }

    return result
  },
}

export default ichimoku
