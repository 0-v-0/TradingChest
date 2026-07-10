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

type ConnorsRsiResult = {
  crsi: number | undefined
}

const connorsRsi: IndicatorTemplate = {
  name: 'ConnorsRSI',
  shortName: 'CRSI',
  calcParams: [3, 2, 100],
  figures: [
    { key: 'crsi', title: 'CRSI: ', type: 'line' },
  ],
  calc: (dataList: KLineData[], indicator) => {
    const params = indicator.calcParams
    const rsiPeriod = params[0] as number
    const streakRsiPeriod = params[1] as number
    const rankPeriod = params[2] as number

    // 1. 计算标准 RSI
    const gains: number[] = []
    const losses: number[] = []
    for (let i = 0; i < dataList.length; i++) {
      if (i === 0) {
        gains.push(0)
        losses.push(0)
      } else {
        const diff = dataList[i].close - dataList[i - 1].close
        gains.push(diff > 0 ? diff : 0)
        losses.push(diff < 0 ? -diff : 0)
      }
    }

    const avgGain = calcRMA(gains, rsiPeriod)
    const avgLoss = calcRMA(losses, rsiPeriod)

    // 2. 计算 Streak（连续涨跌天数）
    const streaks: number[] = []
    let streak = 0
    for (let i = 0; i < dataList.length; i++) {
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
      streaks.push(streak)
    }

    // 对 streak 取绝对值后做 RSI 计算
    const absStreaks = streaks.map(v => Math.abs(v))
    const streakGains: number[] = []
    const streakLosses: number[] = []
    for (let i = 0; i < absStreaks.length; i++) {
      if (i === 0) {
        streakGains.push(0)
        streakLosses.push(0)
      } else {
        const diff = absStreaks[i] - absStreaks[i - 1]
        streakGains.push(diff > 0 ? diff : 0)
        streakLosses.push(diff < 0 ? -diff : 0)
      }
    }

    const streakAvgGain = calcRMA(streakGains, streakRsiPeriod)
    const streakAvgLoss = calcRMA(streakLosses, streakRsiPeriod)

    // 3. 计算 Percent Rank
    const percentRanks: (number | null)[] = []
    for (let i = 0; i < dataList.length; i++) {
      if (i === 0) {
        percentRanks.push(null)
        continue
      }
      const currentChange = dataList[i].close - dataList[i - 1].close
      const lookback = Math.min(i, rankPeriod)
      let count = 0
      for (let j = i - lookback + 1; j <= i; j++) {
        if (j <= 0) continue
        const pastChange = dataList[j].close - dataList[j - 1].close
        if (pastChange <= currentChange) count++
      }
      percentRanks.push(lookback > 0 ? (count / lookback) * 100 : null)
    }

    // 汇总
    const result: ConnorsRsiResult[] = []
    for (let i = 0; i < dataList.length; i++) {
      const ag = avgGain[i]
      const al = avgLoss[i]
      if (ag === null || al === null) {
        result.push({ crsi: undefined })
        continue
      }

      // RSI
      const rs = al !== 0 ? ag / al : 0
      const rsi = 100 - 100 / (1 + rs)

      // Streak RSI
      const sag = streakAvgGain[i]
      const sal = streakAvgLoss[i]
      let streakRsi = 50
      if (sag !== null && sal !== null) {
        const srs = sal !== 0 ? sag / sal : 0
        streakRsi = 100 - 100 / (1 + srs)
      }

      // Percent Rank
      const pr = percentRanks[i]

      if (pr === null) {
        result.push({ crsi: undefined })
      } else {
        result.push({ crsi: (rsi + streakRsi + pr) / 3 })
      }
    }

    return result
  },
}

export default connorsRsi
