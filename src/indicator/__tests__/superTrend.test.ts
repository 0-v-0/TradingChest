import { KLineData } from 'klinecharts'
import { describe, it, expect } from 'vitest'
import superTrend from '../trend/superTrend'

type SuperTrendResult = { up: number; down: number; direction: number }

function makeKlines(count: number): KLineData[] {
  const base = 100
  return Array.from({ length: count }, (_, i) => ({
    timestamp: 1700000000000 + i * 60000,
    open: base + i * 0.5,
    high: base + i * 0.5 + 2,
    low: base + i * 0.5 - 1,
    close: base + i * 0.5 + 1,
    volume: 1000 + i * 10,
    turnover: 0,
  }))
}

// calc 返回类型包含 Promise 联合，但实际同步执行；断言为具体数组类型
function calc(dataList: KLineData[], indicator: { calcParams: number[] }): SuperTrendResult[] {
  return superTrend.calc!(dataList, indicator as any) as SuperTrendResult[]
}

describe('SuperTrend indicator', () => {
  const klines = makeKlines(30)
  const indicator = { calcParams: [10, 3] }

  it('返回与输入等长的数组', () => {
    const result = calc(klines, indicator)
    expect(result).toHaveLength(klines.length)
  })

  it('前 period-1 个值为 NaN', () => {
    const result = calc(klines, indicator)
    for (let i = 0; i < 9; i++) {
      expect(result[i].up).toBeNaN()
      expect(result[i].down).toBeNaN()
    }
  })

  it('period-1 之后每行恰好有 up 或 down 之一', () => {
    const result = calc(klines, indicator)
    for (let i = 9; i < result.length; i++) {
      const hasUp = !isNaN(result[i].up)
      const hasDown = !isNaN(result[i].down)
      expect(hasUp || hasDown).toBe(true)
      expect(hasUp && hasDown).toBe(false)
    }
  })

  it('上升趋势 up 值应在 close 下方', () => {
    const result = calc(klines, indicator)
    for (let i = 9; i < result.length; i++) {
      if (!isNaN(result[i].up)) {
        expect(result[i].up).toBeLessThan(klines[i].high)
      }
    }
  })

  it('空数据返回空数组', () => {
    const result = calc([], indicator)
    expect(result).toHaveLength(0)
  })

  it('下降趋势 direction 为 -1', () => {
    const descending = makeKlines(25)
    for (let i = 12; i < descending.length; i++) {
      descending[i] = {
        ...descending[i],
        high: descending[i].high - 20,
        low: descending[i].low - 20,
        close: descending[i].close - 20,
      }
    }
    const result = calc(descending, indicator)
    // After the drop, some bars should have down values
    const hasDown = result.some((r) => !isNaN(r.down))
    expect(hasDown).toBe(true)
    for (let i = 11; i < result.length; i++) {
      if (!isNaN(result[i].down)) {
        expect(result[i].down).toBeGreaterThan(descending[i].low)
      }
    }
  })
})
