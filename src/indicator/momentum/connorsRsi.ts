/**
 * Connors RSI - 康纳斯RSI
 * ConnorsRSI = (RSI + StreakRSI + PercentRank) / 3
 *
 * 算法：
 *   RSI(close, rsiPeriod) — 标准 RSI
 *   Streak RSI(连续涨跌天数, streakRsiPeriod) — 对连续涨/跌计数做 RSI
 *   Percent Rank(当日涨跌, rankPeriod) — 涨跌幅在过去 N 日中的百分位
 *
 * 参数: rsiPeriod, streakRsiPeriod, rankPeriod
 */
import type { IndicatorTemplate, KLineData } from 'klinecharts'
import { calcRMA, calcRSI, extractField, bisectLeft, bisectRight } from '../utils'

type ConnorsRsiResult = { crsi: number }

const connorsRsi: IndicatorTemplate<ConnorsRsiResult, number> = {
  name: 'ConnorsRSI',
  shortName: 'CRSI',
  calcParams: [3, 2, 100],
  figures: [
    { key: 'crsi', title: 'CRSI: ', type: 'line' },
  ],
  calc: (dataList: KLineData[], { calcParams: [rsiPeriod, streakRsiPeriod, rankPeriod] }) => {
    const n = dataList.length

    // 1. 计算标准 RSI
    const closes = extractField(dataList, 'close')
    const rsiValues = calcRSI(closes, rsiPeriod)

    // 2. 计算 Streak（连续涨跌天数）
    const streaks = new Array<number>(n)
    let streak = 0
    for (let i = 0; i < n; i++) {
      if (i === 0) {
        streak = 0
      } else {
        const diff = dataList[i].close - dataList[i - 1].close
        if (diff > 0) {
          streak = streak > 0 ? streak + 1 : 1
        } else if (diff < 0) {
          streak = streak < 0 ? streak - 1 : -1
        }
        // diff === 0 时 streak 不变
      }
      streaks[i] = streak
    }

    // 对 streak 取绝对值后做 RSI 计算（内联 Math.abs 避免中间数组）
    const streakGains = new Array<number>(n)
    const streakLosses = new Array<number>(n)
    streakGains[0] = 0
    streakLosses[0] = 0
    let prevAbs = Math.abs(streaks[0])
    for (let i = 1; i < n; i++) {
      const cur = Math.abs(streaks[i])
      const diff = cur - prevAbs
      streakGains[i] = diff > 0 ? diff : 0
      streakLosses[i] = diff < 0 ? -diff : 0
      prevAbs = cur
    }

    const streakAvgGain = calcRMA(streakGains, streakRsiPeriod)
    const streakAvgLoss = calcRMA(streakLosses, streakRsiPeriod)

    // 3. 计算 Percent Rank — O(n log n) via sorted sliding window + binary search
    // Current value should NOT be counted against itself — standard PercentRank
    // examines only the trailing window EXCLUDING the current value.
    const percentRanks = new Array<number>(n)
    // 预先计算所有 change 值（change[i] = close[i] - close[i-1]）
    const changes = new Array<number>(n)
    changes[0] = NaN
    for (let i = 1; i < n; i++) {
      changes[i] = dataList[i].close - dataList[i - 1].close
    }
    // 有序窗口：维护窗口内 change 值的排序副本，支持 O(log n) 插入/删除/排名
    const sortedWindow: number[] = []
    for (let i = 0; i < n; i++) {
      if (i === 0) {
        percentRanks[0] = NaN
        continue
      }
      const currentChange = changes[i]
      // 窗口范围 [i - rankPeriod, i - 1]，但 j >= 1 才有有效 change
      // 滑出：窗口超出 rankPeriod 时移除最旧的值
      if (i > rankPeriod + 1) {
        const outIdx = i - rankPeriod - 1
        const outVal = changes[outIdx]
        if (!isNaN(outVal)) {
          const pos = bisectLeft(sortedWindow, outVal)
          sortedWindow.copyWithin(pos, pos + 1)
          sortedWindow.length--
        }
      }
      // 插入上一根 bar 的 change（i-1 进入窗口）
      const inVal = changes[i - 1]
      if (!isNaN(inVal)) {
        const pos = bisectRight(sortedWindow, inVal)
        sortedWindow.length++
        sortedWindow.copyWithin(pos + 1, pos)
        sortedWindow[pos] = inVal
      }
      // 排名 = 窗口内 <= currentChange 的个数
      const count = bisectRight(sortedWindow, currentChange)
      percentRanks[i] = sortedWindow.length > 0 ? (count / sortedWindow.length) * 100 : NaN
    }

    // 汇总
    const result: ConnorsRsiResult[] = new Array(n)
    for (let i = 0; i < n; i++) {
      // RSI (from calcRSI)
      const rsi = rsiValues[i]

      // Streak RSI
      const sag = streakAvgGain[i]
      const sal = streakAvgLoss[i]
      let streakRsi = 50
      if (!isNaN(sag) && !isNaN(sal)) {
        const srs = sal !== 0 ? sag / sal : 0
        streakRsi = 100 - 100 / (1 + srs)
      }

      // Percent Rank
      result[i] = { crsi: (rsi + streakRsi + percentRanks[i]) / 3 }
    }

    return result
  },
}

export default connorsRsi
