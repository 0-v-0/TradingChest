/**
 * 指标计算性能基准测试
 *
 * 用法: npx vitest run src/indicator/__tests__/perf/benchmark.test.ts
 *
 * 测试 utils.ts 核心函数和完整指标 calc 函数在不同数据规模下的执行耗时。
 */
import { describe, it } from 'vitest'
import {
  calcSMA,
  calcEMA,
  calcWMA,
  calcRMA,
  calcRMA_NaNAware,
  calcTR,
  calcStdDev,
  calcHighest,
  calcLowest,
  calcSum,
  calcChange,
  calcGain,
  calcLoss,
  calcLinReg,
} from '../../utils'
import type { KLineData } from 'klinecharts'

// ---------------------------------------------------------------------------
// 数据生成
// ---------------------------------------------------------------------------

/** 生成模拟 K 线数据 */
function generateKLineData(count: number): KLineData[] {
  const data: KLineData[] = []
  let price = 100
  const baseTs = 1700000000000

  for (let i = 0; i < count; i++) {
    const change = (Math.random() - 0.48) * 2
    const open = price
    const close = price + change
    const high = Math.max(open, close) + Math.random() * 1.5
    const low = Math.min(open, close) - Math.random() * 1.5
    const volume = 1000 + Math.random() * 9000

    data.push({
      timestamp: baseTs + i * 60_000,
      open,
      high,
      low,
      close,
      volume,
      turnover: volume * close,
    })
    price = close
  }
  return data
}

/** 从 K 线数据提取 number[] 序列（预分配） */
function extractField(dataList: KLineData[], field: 'close' | 'high' | 'low' | 'open' | 'volume'): number[] {
  const n = dataList.length
  const arr = new Array<number>(n)
  for (let i = 0; i < n; i++) arr[i] = dataList[i][field]
  return arr
}

// ---------------------------------------------------------------------------
// 高精度计时
// ---------------------------------------------------------------------------

/** 执行 fn 多次并返回平均耗时（ms），warmup 轮预热 */
function bench(
  fn: () => void,
  iterations = 100,
  warmup = 10,
): { avg: number; min: number; median: number; runs: number } {
  // warmup
  for (let i = 0; i < warmup; i++) fn()

  const samples: number[] = []
  for (let i = 0; i < iterations; i++) {
    const t0 = performance.now()
    fn()
    const t1 = performance.now()
    samples.push(t1 - t0)
  }

  samples.sort((a, b) => a - b)
  const sum = samples.reduce((a, b) => a + b, 0)
  return {
    avg: sum / samples.length,
    min: samples[0],
    median: samples[Math.floor(samples.length / 2)],
    runs: iterations,
  }
}

/** 格式化输出 */
function fmtResult(name: string, r: { avg: number; min: number; median: number; runs: number }, dataLen: number) {
  return `${name} (${dataLen} pts): avg=${r.avg.toFixed(4)}ms  min=${r.min.toFixed(4)}ms  med=${r.median.toFixed(4)}ms  (${r.runs} runs)`
}

// ---------------------------------------------------------------------------
// 测试数据规模
// ---------------------------------------------------------------------------

const SIZES = [1_000, 5_000, 10_000, 50_000]

// ---------------------------------------------------------------------------
// Utils 函数基准测试
// ---------------------------------------------------------------------------

describe('Utils performance benchmark', () => {
  for (const size of SIZES) {
    describe(`data size = ${size}`, () => {
      const klines = generateKLineData(size)
      const closes = extractField(klines, 'close')
      const highs = extractField(klines, 'high')
      const lows = extractField(klines, 'low')

      it(`calcSMA(14) — ${size} pts`, () => {
        const r = bench(() => calcSMA(closes, 14))
        console.log(fmtResult('calcSMA(14)', r, size))
      })

      it(`calcEMA(14) — ${size} pts`, () => {
        const r = bench(() => calcEMA(closes, 14))
        console.log(fmtResult('calcEMA(14)', r, size))
      })

      it(`calcWMA(14) — ${size} pts`, () => {
        const r = bench(() => calcWMA(closes, 14))
        console.log(fmtResult('calcWMA(14)', r, size))
      })

      it(`calcRMA(14) — ${size} pts`, () => {
        const r = bench(() => calcRMA(closes, 14))
        console.log(fmtResult('calcRMA(14)', r, size))
      })

      it(`calcRMA_NaNAware(14) — ${size} pts`, () => {
        const r = bench(() => calcRMA_NaNAware(closes, 14))
        console.log(fmtResult('calcRMA_NaNAware(14)', r, size))
      })

      it(`calcTR — ${size} pts`, () => {
        const r = bench(() => calcTR(highs, lows, closes))
        console.log(fmtResult('calcTR', r, size))
      })

      it(`calcStdDev(20) — ${size} pts`, () => {
        const r = bench(() => calcStdDev(closes, 20))
        console.log(fmtResult('calcStdDev(20)', r, size))
      })

      it(`calcHighest(14) — ${size} pts`, () => {
        const r = bench(() => calcHighest(closes, 14))
        console.log(fmtResult('calcHighest(14)', r, size))
      })

      it(`calcLowest(14) — ${size} pts`, () => {
        const r = bench(() => calcLowest(closes, 14))
        console.log(fmtResult('calcLowest(14)', r, size))
      })

      it(`calcSum(14) — ${size} pts`, () => {
        const r = bench(() => calcSum(closes, 14))
        console.log(fmtResult('calcSum(14)', r, size))
      })

      it(`calcChange — ${size} pts`, () => {
        const r = bench(() => calcChange(closes))
        console.log(fmtResult('calcChange', r, size))
      })

      it(`calcGain — ${size} pts`, () => {
        const r = bench(() => calcGain(closes))
        console.log(fmtResult('calcGain', r, size))
      })

      it(`calcLoss — ${size} pts`, () => {
        const r = bench(() => calcLoss(closes))
        console.log(fmtResult('calcLoss', r, size))
      })

      it(`calcLinReg(20) — ${size} pts`, () => {
        const r = bench(() => calcLinReg(closes, 20))
        console.log(fmtResult('calcLinReg(20)', r, size))
      })
    })
  }
})

// ---------------------------------------------------------------------------
// 完整指标基准测试（预分配 number[] 版本）
// ---------------------------------------------------------------------------

describe('Full indicator calc performance benchmark', () => {
  for (const size of SIZES) {
    describe(`data size = ${size}`, () => {
      const klines = generateKLineData(size)

      // ATR — 内联 RMA
      it(`ATR(14) — ${size} pts`, () => {
        const atrCalc = (dataList: KLineData[]) => {
          const period = 14
          const n = dataList.length
          const result: { atr: number }[] = new Array(n)
          let prevAtr = 0
          for (let i = 0; i < n; i++) {
            const kline = dataList[i]
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
            let atr = NaN
            if (i < period) {
              prevAtr += tr
              if (i === period - 1) {
                prevAtr = prevAtr / period
                atr = prevAtr
              }
            } else {
              prevAtr = (prevAtr * (period - 1) + tr) / period
              atr = prevAtr
            }
            result[i] = { atr }
          }
          return result
        }
        const r = bench(() => atrCalc(klines))
        console.log(fmtResult('ATR(14)', r, size))
      })

      // DEMA — 双层 EMA（预分配 number[]）
      it(`DEMA(21) — ${size} pts`, () => {
        const demaCalc = (dataList: KLineData[]) => {
          const period = 21
          const k = 2 / (period + 1)
          const n = dataList.length
          const ema1 = new Array<number>(n)
          const ema2 = new Array<number>(n)
          for (let i = 0; i < n; i++) {
            const close = dataList[i].close
            if (i === 0) {
              ema1[0] = close
              ema2[0] = close
            } else {
              const e1 = close * k + ema1[i - 1] * (1 - k)
              ema1[i] = e1
              const e2 = e1 * k + ema2[i - 1] * (1 - k)
              ema2[i] = e2
            }
          }
          const result: { dema: number }[] = new Array(n)
          for (let i = 0; i < n; i++) {
            result[i] = i < period - 1 ? { dema: NaN } : { dema: 2 * ema1[i] - ema2[i] }
          }
          return result
        }
        const r = bench(() => demaCalc(klines))
        console.log(fmtResult('DEMA(21)', r, size))
      })

      // BBW — 使用 calcSMA + calcStdDev（预分配 number[]）
      it(`BBW(20,2) — ${size} pts`, () => {
        const bbwCalc = (dataList: KLineData[]) => {
          const period = 20
          const stddevMultiplier = 2
          const n = dataList.length
          const closes = new Array<number>(n)
          for (let i = 0; i < n; i++) closes[i] = dataList[i].close
          const smas = calcSMA(closes, period)
          const stddevs = calcStdDev(closes, period)
          const result: { bbw: number }[] = new Array(n)
          for (let i = 0; i < n; i++) {
            const sma = smas[i]
            const stddev = stddevs[i]
            if (Number.isNaN(sma) || Number.isNaN(stddev)) { result[i] = { bbw: NaN }; continue }
            result[i] = { bbw: sma === 0 ? 0 : ((2 * stddevMultiplier * stddev) / sma) * 100 }
          }
          return result
        }
        const r = bench(() => bbwCalc(klines))
        console.log(fmtResult('BBW(20,2)', r, size))
      })

      // SuperTrend — ATR + 方向判断（预分配 number[]）
      it(`SuperTrend(10,3) — ${size} pts`, () => {
        const stCalc = (dataList: KLineData[]) => {
          const period = 10
          const multiplier = 3
          const n = dataList.length
          const result: { up: number; down: number }[] = new Array(n)
          const atrValues = new Array<number>(n)
          for (let i = 0; i < n; i++) atrValues[i] = NaN
          let rma = 0
          for (let i = 0; i < n; i++) {
            const kline = dataList[i]
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
            if (i < period) {
              rma += tr
            } else if (i === period) {
              rma = (rma + tr) / period
              atrValues[i] = rma
            } else {
              rma = (rma * (period - 1) + tr) / period
              atrValues[i] = rma
            }
          }

          let prevUpperBand = NaN
          let prevLowerBand = NaN
          let direction = 0

          for (let i = 0; i < n; i++) {
            let up = NaN
            let down = NaN
            if (i >= period) {
              const kline = dataList[i]
              const atrVal = atrValues[i]
              const hl2 = (kline.high + kline.low) / 2
              let upperBand = hl2 + multiplier * atrVal
              let lowerBand = hl2 - multiplier * atrVal
              if (i > period) {
                if (lowerBand <= prevLowerBand && dataList[i - 1].close >= prevLowerBand) {
                  lowerBand = prevLowerBand
                }
                if (upperBand >= prevUpperBand && dataList[i - 1].close <= prevUpperBand) {
                  upperBand = prevUpperBand
                }
              }
              if (direction === 0) {
                direction = kline.close <= upperBand ? 1 : -1
              } else if (direction === -1) {
                if (kline.close > upperBand) direction = 1
              } else if (direction === 1) {
                if (kline.close < lowerBand) direction = -1
              }
              const superTrendVal = direction === 1 ? lowerBand : upperBand
              up = direction === 1 ? superTrendVal : NaN
              down = direction === -1 ? superTrendVal : NaN
              prevUpperBand = upperBand
              prevLowerBand = lowerBand
            }
            result[i] = { up, down }
          }
          return result
        }
        const r = bench(() => stCalc(klines))
        console.log(fmtResult('SuperTrend(10,3)', r, size))
      })

      // ADX — 三重 RMA + 方向运动（预分配 number[]）
      it(`ADX(14) — ${size} pts`, () => {
        const adxCalc = (dataList: KLineData[]) => {
          const period = 14
          const len = dataList.length
          const result: { adx: number; plusDi: number; minusDi: number }[] = new Array(len)
          if (len === 0) return result

          const plusDmRaw = new Array<number>(len).fill(0)
          const minusDmRaw = new Array<number>(len).fill(0)
          const trRaw = new Array<number>(len).fill(0)

          for (let i = 0; i < len; i++) {
            if (i === 0) {
              trRaw[i] = dataList[i].high - dataList[i].low
            } else {
              const prevClose = dataList[i - 1].close
              const prevHigh = dataList[i - 1].high
              const prevLow = dataList[i - 1].low
              const high = dataList[i].high
              const low = dataList[i].low
              trRaw[i] = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose))
              const upMove = high - prevHigh
              const downMove = prevLow - low
              if (upMove > downMove && upMove > 0) plusDmRaw[i] = upMove
              if (downMove > upMove && downMove > 0) minusDmRaw[i] = downMove
            }
          }

          let smoothPlusDm = 0
          let smoothMinusDm = 0
          let smoothTr = 0
          let adxSmooth = 0
          let adxCount = 0

          for (let i = 0; i < len; i++) {
            let adx = NaN
            let plusDi = NaN
            let minusDi = NaN
            if (i < period) {
              smoothPlusDm += plusDmRaw[i]
              smoothMinusDm += minusDmRaw[i]
              smoothTr += trRaw[i]
              if (i === period - 1) {
                smoothPlusDm /= period
                smoothMinusDm /= period
                smoothTr /= period
                plusDi = smoothTr !== 0 ? (100 * smoothPlusDm) / smoothTr : 0
                minusDi = smoothTr !== 0 ? (100 * smoothMinusDm) / smoothTr : 0
                const diSum = plusDi + minusDi
                const dx = diSum !== 0 ? (100 * Math.abs(plusDi - minusDi)) / diSum : 0
                adxSmooth += dx
                adxCount = 1
              }
            } else {
              smoothPlusDm = (smoothPlusDm * (period - 1) + plusDmRaw[i]) / period
              smoothMinusDm = (smoothMinusDm * (period - 1) + minusDmRaw[i]) / period
              smoothTr = (smoothTr * (period - 1) + trRaw[i]) / period
              plusDi = smoothTr !== 0 ? (100 * smoothPlusDm) / smoothTr : 0
              minusDi = smoothTr !== 0 ? (100 * smoothMinusDm) / smoothTr : 0
              const diSum = plusDi + minusDi
              const dx = diSum !== 0 ? (100 * Math.abs(plusDi - minusDi)) / diSum : 0
              adxCount++
              if (adxCount < period) {
                adxSmooth += dx
              } else if (adxCount === period) {
                adxSmooth = (adxSmooth + dx) / period
                adx = adxSmooth
              } else {
                adxSmooth = (adxSmooth * (period - 1) + dx) / period
                adx = adxSmooth
              }
            }
            result[i] = { adx, plusDi, minusDi }
          }
          return result
        }
        const r = bench(() => adxCalc(klines))
        console.log(fmtResult('ADX(14)', r, size))
      })
    })
  }
})
