/**
 * Fisher Transform - 费舍尔变换
 *
 * 将价格归一化到 [-1, 1] 区间后，应用反双曲正切变换使其近似正态分布，
 * 从而更清晰地识别价格转折点。
 *
 * 中间价 = (high + low) / 2
 * 归一化 x = 2 * (midPrice - lowest) / (highest - lowest) - 1，钳制到 (-0.999, 0.999)
 * Fisher = 0.5 * ln((1 + x) / (1 - x))，使用 EMA 平滑的 x
 * Trigger = 前一根的 Fisher 值
 */
import type { IndicatorTemplate, KLineData } from 'klinecharts'

type FisherTransformResult = { fisher: number; trigger: number }

const fisherTransform: IndicatorTemplate<FisherTransformResult, number> = {
  name: 'FISHER',
  shortName: 'Fisher',
  calcParams: [9],
  figures: [
    { key: 'fisher', title: 'Fisher: ', type: 'line' },
    { key: 'trigger', title: 'Trigger: ', type: 'line' },
  ],
  calc: (dataList: KLineData[], { calcParams: [period] }) => {
    const len = dataList.length
    const result: FisherTransformResult[] = new Array(len)

    // 计算中间价序列
    const midPrices: number[] = Array(len)
    for (let i = 0; i < len; i++) {
      midPrices[i] = (dataList[i].high + dataList[i].low) / 2
    }

    let prevNorm = 0 // 前一根的归一化值（用于 EMA 平滑）
    let prevFisher = 0 // 前一根的 Fisher 值（即当前 trigger）

    // 单调队列：O(n) 滚动窗口内的最高/最低 midPrice
    const maxDeque: number[] = []
    const minDeque: number[] = []

    for (let i = 0; i < len; i++) {
      let fisher = NaN
      let trigger = NaN

      if (i >= period - 1) {
        // 维护单调递减队列：队首为窗口最大 midPrice
        while (maxDeque.length > 0 && maxDeque[0] <= i - period) maxDeque.shift()
        while (maxDeque.length > 1 && midPrices[maxDeque[maxDeque.length - 1]] <= midPrices[i]) {
          maxDeque.pop()
        }
        maxDeque.push(i)

        // 维护单调递增队列：队首为窗口最小 midPrice
        while (minDeque.length > 0 && minDeque[0] <= i - period) minDeque.shift()
        while (minDeque.length > 1 && midPrices[minDeque[minDeque.length - 1]] >= midPrices[i]) {
          minDeque.pop()
        }
        minDeque.push(i)

        const highest = midPrices[maxDeque[0]]
        const lowest = midPrices[minDeque[0]]

        // 归一化到 [-1, 1]
        let norm: number
        if (highest === lowest) {
          norm = 0
        } else {
          norm = 2 * (midPrices[i] - lowest) / (highest - lowest) - 1
        }

        // 钳制到 (-0.999, 0.999) 防止 ln 溢出
        norm = Math.max(-0.999, Math.min(0.999, norm))

        // EMA 平滑归一化值（系数 0.5）
        norm = 0.5 * norm + 0.5 * prevNorm

        // 再次钳制（平滑后仍可能接近边界）
        norm = Math.max(-0.999, Math.min(0.999, norm))

        // Fisher 变换
        fisher = 0.5 * Math.log((1 + norm) / (1 - norm))

        // trigger 是前一根的 fisher 值
        trigger = i === period - 1 ? NaN : prevFisher

        prevNorm = norm
        prevFisher = fisher
      }

      result[i] = { fisher, trigger }
    }

    return result
  },
}

export default fisherTransform
