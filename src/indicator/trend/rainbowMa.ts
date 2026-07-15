/**
 * Rainbow MA - 彩虹均线
 * 递归 SMA 堆叠
 * Level 1 = SMA(close, period)
 * Level 2 = SMA(Level1, period)
 * ...递归 depth 次
 *
 * 参数: depth(递归层数), period(SMA周期)
 */
import type { IndicatorTemplate, KLineData } from 'klinecharts'
import { calcSMA } from '../utils'

type RainbowMaResult = { ma1: number; ma2: number; ma3: number; ma4: number; ma5: number; ma6: number }

const MAX_LEVELS = 6

const rainbowMa: IndicatorTemplate<RainbowMaResult, number> = {
  name: 'RainbowMA',
  shortName: 'Rainbow',
  calcParams: [2, 10],
  figures: [
    { key: 'ma1', title: 'MA1: ', type: 'line' },
    { key: 'ma2', title: 'MA2: ', type: 'line' },
    { key: 'ma3', title: 'MA3: ', type: 'line' },
    { key: 'ma4', title: 'MA4: ', type: 'line' },
    { key: 'ma5', title: 'MA5: ', type: 'line' },
    { key: 'ma6', title: 'MA6: ', type: 'line' },
  ],
  calc: (dataList: KLineData[], { calcParams: [depthParam, period] }) => {
    const n = dataList.length
    const depth = Math.min(depthParam, MAX_LEVELS)

    const close = dataList.map(k => k.close)

    // 递归 SMA 堆叠
    const levels: number[][] = new Array(depth)
    let current = close
    for (let level = 0; level < depth; level++) {
      const sma = calcSMA(current, period)
      levels[level] = sma
      // Replace NaN with 0 in-place for next recursion level (avoids allocating a new array)
      current = sma
      for (let i = 0; i < n; i++) {
        if (isNaN(current[i])) current[i] = 0
      }
    }

    // 填充不足 depth 的层
    for (let i = levels.length; i < MAX_LEVELS; i++) {
      levels[i] = Array(n).fill(NaN)
    }

    const result: RainbowMaResult[] = new Array(n)
    for (let i = 0; i < n; i++) {
      result[i] = {
        ma1: levels[0][i],
        ma2: levels[1][i],
        ma3: levels[2][i],
        ma4: levels[3][i],
        ma5: levels[4][i],
        ma6: levels[5][i],
      }
    }
    return result
  },
}

export default rainbowMa
