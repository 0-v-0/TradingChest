/**
 * 技术指标计算工具函数集
 *
 * 所有函数接受 number[] 输入，返回 number[]。
 * 数据不足的位置填充 NaN，确保输出数组长度与输入一致。
 * 本模块用于金融交易系统，数值精度至关重要。
 */

/**
 * 简单移动平均（Simple Moving Average）
 * SMA = 区间内数据的算术平均值
 */
export function calcSMA(data: number[], period: number): number[] {
  const n = data.length
  const result = new Array<number>(n)
  // 维护滑动窗口的累加和，避免重复求和
  let windowSum = 0
  for (let i = 0; i < n; i++) {
    windowSum += data[i]
    if (i >= period - 1) {
      if (i >= period) {
        // 滑出窗口最旧的一个值
        windowSum -= data[i - period]
      }
      result[i] = windowSum / period
    } else {
      result[i] = NaN
    }
  }
  return result
}

/**
 * 指数移动平均（Exponential Moving Average）
 * 权重因子 k = 2 / (period + 1)
 * 首个有效值使用 SMA 作为种子
 */
export function calcEMA(data: number[], period: number): number[] {
  const n = data.length
  const result = new Array<number>(n)
  const k = 2 / (period + 1)
  let prevEma = NaN

  for (let i = 0; i < n; i++) {
    if (i === period - 1) {
      // 用前 period 个数据的 SMA 作为 EMA 种子值
      let sum = 0
      for (let j = 0; j < period; j++) {
        sum += data[j]
      }
      prevEma = sum / period
      result[i] = prevEma
    } else if (i >= period) {
      // EMA = 前值 + k * (当前值 - 前值)
      prevEma = data[i] * k + prevEma * (1 - k)
      result[i] = prevEma
    } else {
      result[i] = NaN
    }
  }
  return result
}

/**
 * 加权移动平均（Weighted Moving Average）
 * 最新数据权重最大：权重 = 1, 2, 3, ..., period
 * WMA = Σ(data[i] * weight[i]) / Σ(weight)
 */
export function calcWMA(data: number[], period: number): number[] {
  const n = data.length
  const result = new Array<number>(n)
  // 权重总和 = period * (period + 1) / 2
  const weightSum = (period * (period + 1)) / 2

  for (let i = 0; i < n; i++) {
    if (i >= period - 1) {
      let weighted = 0
      for (let j = 0; j < period; j++) {
        // 窗口内第 j 个元素的权重为 j + 1（越新权重越大）
        weighted += data[i - period + 1 + j] * (j + 1)
      }
      result[i] = weighted / weightSum
    } else {
      result[i] = NaN
    }
  }
  return result
}

/**
 * 真实波幅（True Range）
 * TR = max(high - low, |high - prevClose|, |low - prevClose|)
 * 第一根 K 线无前收盘价，TR = high - low
 */
export function calcTR(high: number[], low: number[], close: number[]): number[] {
  const n = high.length
  const result = new Array<number>(n)
  for (let i = 0; i < n; i++) {
    if (i === 0) {
      // 第一根 K 线没有前一根收盘价，直接用 high - low
      result[i] = high[i] - low[i]
    } else {
      const prevClose = close[i - 1]
      const hl = high[i] - low[i]
      const hc = Math.abs(high[i] - prevClose)
      const lc = Math.abs(low[i] - prevClose)
      result[i] = Math.max(hl, hc, lc)
    }
  }
  return result
}

/**
 * 标准差（Standard Deviation）
 * 使用总体标准差（除以 N），与大多数技术分析平台一致（如布林带）
 *
 * 实现细节：维护滑动窗口的 sum 与 sumSq，常数时间计算方差
 * `variance = sumSq / period - (sum / period)^2`，由于浮点误差偶尔小于 0 时取 max。
 * 这与原本逐条重算的 O(n*period) 算法数值等价但更快。
 */
export function calcStdDev(data: number[], period: number): number[] {
  const n = data.length
  const result = new Array<number>(n)
  let sum = 0
  let sumSq = 0
  for (let i = 0; i < n; i++) {
    const v = data[i]
    sum += v
    sumSq += v * v
    if (i >= period) {
      const out = data[i - period]
      sum -= out
      sumSq -= out * out
    }
    if (i >= period - 1) {
      const mean = sum / period
      const variance = sumSq / period - mean * mean
      result[i] = Math.sqrt(Math.max(variance, 0))
    } else {
      result[i] = NaN
    }
  }
  return result
}

/**
 * 区间最高值（Highest value in period）
 * 返回过去 period 根 K 线内的最大值
 * 使用单调双端队列实现 O(n) 滑动窗口最大值
 */
export function calcHighest(data: number[], period: number): number[] {
  const n = data.length
  const result: number[] = new Array(n).fill(NaN)
  console.assert(period > 0, 'calcHighest: period must be > 0')
  const deque: number[] = []
  let head = 0
  for (let i = 0; i < n; i++) {
    while (deque.length > head && data[deque[deque.length - 1]] <= data[i]) {
      deque.pop()
    }
    deque.push(i)
    if (deque[head] <= i - period) head++
    if (i >= period - 1) {
      result[i] = data[deque[head]]
    }
  }
  return result
}

/**
 * 区间最低值（Lowest value in period）
 * 返回过去 period 根 K 线内的最小值
 * 使用单调双端队列实现 O(n) 滑动窗口最小值
 */
export function calcLowest(data: number[], period: number): number[] {
  const n = data.length
  const result: number[] = new Array(n).fill(NaN)
  console.assert(period > 0, 'calcLowest: period must be > 0')
  const deque: number[] = []
  let head = 0
  for (let i = 0; i < n; i++) {
    while (deque.length > head && data[deque[deque.length - 1]] >= data[i]) {
      deque.pop()
    }
    deque.push(i)
    if (deque[head] <= i - period) head++
    if (i >= period - 1) {
      result[i] = data[deque[head]]
    }
  }
  return result
}

/**
 * 递归移动平均 / Wilder 平滑（RMA / SMMA / Wilder's Smoothing）
 * 广泛用于 RSI、ATR 等指标
 * RMA = (prevRMA * (period - 1) + currentValue) / period
 * 首个有效值使用 SMA 作为种子
 */
export function calcRMA(data: number[], period: number): number[] {
  const n = data.length
  const result = new Array<number>(n)
  let prevRma = NaN

  for (let i = 0; i < n; i++) {
    if (i === period - 1) {
      // 用前 period 个数据的 SMA 作为种子
      let sum = 0
      for (let j = 0; j < period; j++) {
        sum += data[j]
      }
      prevRma = sum / period
      result[i] = prevRma
    } else if (i >= period) {
      // Wilder 递归公式
      prevRma = (prevRma * (period - 1) + data[i]) / period
      result[i] = prevRma
    } else {
      result[i] = NaN
    }
  }
  return result
}

/**
 * NaN 感知的 RMA：在可达 `period` 个连续有效值后才初始化种子，
 * 之后的 Wilder 递归同样跳过 NaN 输入（保持先前的 `prevRma`）。
 * 用于将含 NaN 的输入（如前置未成熟区间）平滑到正确的累计序列，
 * 避免 NaN→0 替换污染累计和。
 */
export function calcRMA_NaNAware(data: number[], period: number): number[] {
  const n = data.length
  const result = new Array<number>(n)
  let prevRma = NaN
  let winSum = 0
  let winCount = 0

  for (let i = 0; i < n; i++) {
    const v = data[i]
    if (Number.isNaN(v)) {
      result[i] = NaN
      continue
    }
    winSum += v
    winCount++
    if (winCount < period) {
      result[i] = NaN
      continue
    }
    if (winCount === period) {
      prevRma = winSum / period
      winSum = 0
    } else {
      prevRma = (prevRma * (period - 1) + v) / period
    }
    result[i] = prevRma
  }
  return result
}

/**
 * 滚动求和（Rolling Sum）
 * 返回过去 period 个数据点的累加和
 */
export function calcSum(data: number[], period: number): number[] {
  const n = data.length
  const result = new Array<number>(n)
  let windowSum = 0

  for (let i = 0; i < n; i++) {
    windowSum += data[i]
    if (i >= period - 1) {
      if (i >= period) {
        windowSum -= data[i - period]
      }
      result[i] = windowSum
    } else {
      result[i] = NaN
    }
  }
  return result
}

/**
 * 变化量（Change / Difference）
 * change[i] = data[i] - data[i-1]
 * 第一个元素无前值，返回 NaN
 */
export function calcChange(data: number[]): number[] {
  const n = data.length
  if (n === 0) return []
  const result = new Array<number>(n)
  result[0] = NaN
  for (let i = 1; i < n; i++) {
    result[i] = data[i] - data[i - 1]
  }
  return result
}

/**
 * 正变化（Gain）
 * 当 data[i] > data[i-1] 时返回差值，否则返回 0
 * 第一个元素返回 NaN
 */
export function calcGain(data: number[]): number[] {
  const n = data.length
  if (n === 0) return []
  const result = new Array<number>(n)
  result[0] = NaN
  for (let i = 1; i < n; i++) {
    result[i] = Math.max(data[i] - data[i - 1], 0)
  }
  return result
}

/**
 * 负变化的绝对值（Loss）
 * 当 data[i] < data[i-1] 时返回差值的绝对值，否则返回 0
 * 第一个元素返回 NaN
 */
export function calcLoss(data: number[]): number[] {
  const n = data.length
  if (n === 0) return []
  const result = new Array<number>(n)
  result[0] = NaN
  for (let i = 1; i < n; i++) {
    result[i] = Math.max(-(data[i] - data[i - 1]), 0)
  }
  return result
}

/**
 * 最小二乘线性回归（Least-Squares Linear Regression，滑动窗口）
 *
 * 对于等距 x=0..period-1 的窗口，sumX 与 sumX2 是常量：
 *   sumX  = n(n-1) / 2
 *   sumX2 = (n-1)n(2n-1) / 6
 * 所以滚动场景下只需维护 sumY、sumY2、sumXY 三个滑动和，
 * 每个增量 O(1)，避免原来对每个 i 重新遍历窗口的 O(n*period) 计算。
 *
 * 返回与 data 等长的数组，每项 { slope, intercept, stdResid }：
 *   slope     — 斜率 b
 *   intercept — 截距 a
 *   stdResid  — 残差总体标准差 = sqrt(Σ(y - ŷ)² / n)
 * 窗口尚未填满的索引处三项均为 NaN。
 */
export interface LinRegResult {
  slope: number
  intercept: number
  stdResid: number
}

export function calcLinReg(data: number[], period: number): LinRegResult[] {
  const n = data.length
  const result: LinRegResult[] = new Array(n)
  console.assert(period >= 2, 'calcLinReg: period must be >= 2')
  const sumX = (period * (period - 1)) / 2
  const sumX2 = ((period - 1) * period * (2 * period - 1)) / 6
  const denom = period * sumX2 - sumX * sumX

  let sumY = 0
  let sumY2 = 0
  let sumXY = 0

  for (let i = 0; i < n; i++) {
    const y = data[i]
    if (i < period) {
      sumY += y
      sumY2 += y * y
      sumXY += i * y
    } else {
      const yIn = y
      const yOut = data[i - period]
      sumXY = sumXY - (sumY - yOut) + (period - 1) * yIn
      sumY += yIn - yOut
      sumY2 += yIn * yIn - yOut * yOut
    }

    if (i >= period - 1) {
      const slope = denom !== 0 ? (period * sumXY - sumX * sumY) / denom : 0
      const intercept = (sumY - slope * sumX) / period
      const yMean = sumY / period
      const xMean = sumX / period
      const variance =
        sumY2 / period - yMean * yMean -
        slope * slope * (sumX2 / period - xMean * xMean)
      const stdResid = Math.sqrt(Math.max(variance, 0))
      result[i] = { slope, intercept, stdResid }
    } else {
      result[i] = { slope: NaN, intercept: NaN, stdResid: NaN }
    }
  }
  return result
}
