/**
 * Ichimoku Cloud - 一目均衡图
 * 包含转换线、基准线、先行带A/B、迟行带五条线
 */
import type { IndicatorTemplate, KLineData } from 'klinecharts'

type IchimokuResult = {
  tenkanSen: number
  kijunSen: number
  senkouSpanA: number
  senkouSpanB: number
  chikouSpan: number
}

/**
 * 计算指定区间内的最高价与最低价的中间值
 */
function midPoint(dataList: KLineData[], endIndex: number, period: number): number {
  if (endIndex < period - 1) return NaN
  let high = -Infinity
  let low = Infinity
  for (let i = endIndex - period + 1; i <= endIndex; i++) {
    if (dataList[i].high > high) high = dataList[i].high
    if (dataList[i].low < low) low = dataList[i].low
  }
  return (high + low) / 2
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

    // 先计算各条线的原始值
    const tenkanArr = new Array<number>(n)
    const kijunArr = new Array<number>(n)
    const spanAArr = new Array<number>(n)
    const spanBArr = new Array<number>(n)

    for (let i = 0; i < n; i++) {
      const tenkan = midPoint(dataList, i, tenkanPeriod)
      const kijun = midPoint(dataList, i, kijunPeriod)
      tenkanArr[i] = tenkan
      kijunArr[i] = kijun

      // 先行带 A = (转换线 + 基准线) / 2
      if (!isNaN(tenkan) && !isNaN(kijun)) {
        spanAArr[i] = (tenkan + kijun) / 2
      } else {
        spanAArr[i] = NaN
      }

      // 先行带 B = (senkouBPeriod 周期内最高价 + 最低价) / 2
      spanBArr[i] = midPoint(dataList, i, senkouBPeriod)
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
