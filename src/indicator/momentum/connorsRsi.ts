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
import { calcRMA } from '../utils'

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
    const gains = new Array<number>(n)
    const losses = new Array<number>(n)
    for (let i = 0; i < n; i++) {
      if (i === 0) {
        gains[0] = 0
        losses[0] = 0
      } else {
        const diff = dataList[i].close - dataList[i - 1].close
        gains[i] = diff > 0 ? diff : 0
        losses[i] = diff < 0 ? -diff : 0
      }
    }

    const avgGain = calcRMA(gains, rsiPeriod)
    const avgLoss = calcRMA(losses, rsiPeriod)

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

    // 对 streak 取绝对值后做 RSI 计算
    const absStreaks = streaks.map(v => Math.abs(v))
    const streakGains = new Array<number>(n)
    const streakLosses = new Array<number>(n)
    for (let i = 0; i < n; i++) {
      if (i === 0) {
        streakGains[0] = 0
        streakLosses[0] = 0
      } else {
        const diff = absStreaks[i] - absStreaks[i - 1]
        streakGains[i] = diff > 0 ? diff : 0
        streakLosses[i] = diff < 0 ? -diff : 0
      }
    }

    const streakAvgGain = calcRMA(streakGains, streakRsiPeriod)
    const streakAvgLoss = calcRMA(streakLosses, streakRsiPeriod)

    // 3. 计算 Percent Rank
    // Current value should NOT be counted against itself — standard PercentRank
    // examines only the trailing window EXCLUDING the current value.
    const percentRanks = new Array<number>(n)
    for (let i = 0; i < n; i++) {
      if (i === 0) {
        percentRanks[0] = NaN
        continue
      }
      const currentChange = dataList[i].close - dataList[i - 1].close
      const lookback = Math.min(i, rankPeriod)
      let count = 0
      // j in [i - lookback, i - 1] — exclude the current bar (j === i)
      for (let j = i - lookback; j <= i - 1; j++) {
        if (j <= 0) continue
        const pastChange = dataList[j].close - dataList[j - 1].close
        if (pastChange <= currentChange) count++
      }
      percentRanks[i] = lookback > 0 ? (count / lookback) * 100 : NaN
    }

    // 汇总
    const result: ConnorsRsiResult[] = new Array(n)
    for (let i = 0; i < n; i++) {
      const ag = avgGain[i]
      const al = avgLoss[i]
      if (isNaN(ag) || isNaN(al)) {
        result[i] = { crsi: NaN }
        continue
      }

      // RSI
      const rs = al !== 0 ? ag / al : 0
      const rsi = 100 - 100 / (1 + rs)

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
