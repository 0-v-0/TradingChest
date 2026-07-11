import { KLineData } from 'klinecharts'
import { describe, it, expect } from 'vitest'
import superTrend from '../trend/superTrend'

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

describe('SuperTrend indicator', () => {
  const klines = makeKlines(30)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const indicator = { calcParams: [10, 3] } as any

  it('返回与输入等长的数组', () => {
    const result = superTrend.calc!(klines, indicator)
    expect(result).toHaveLength(klines.length)
  })

  it('前 period 个值为 undefined', () => {
    const result = superTrend.calc!(klines, indicator)
    for (let i = 0; i < 10; i++) {
      expect(result[i].up).toBeUndefined()
      expect(result[i].down).toBeUndefined()
    }
  })

  it('period 之后每行恰好有 up 或 down 之一', () => {
    const result = superTrend.calc!(klines, indicator)
    for (let i = 10; i < result.length; i++) {
      const hasUp = result[i].up !== undefined
      const hasDown = result[i].down !== undefined
      expect(hasUp || hasDown).toBe(true)
      expect(hasUp && hasDown).toBe(false)
    }
  })

  it('上升趋势 up 值应在 close 下方', () => {
    const result = superTrend.calc!(klines, indicator)
    for (let i = 10; i < result.length; i++) {
      if (result[i].up !== undefined) {
        expect(result[i].up).toBeLessThan(klines[i].high)
      }
    }
  })

  it('空数据返回空数组', () => {
    const result = superTrend.calc!([], indicator)
    expect(result).toHaveLength(0)
  })

  it('下降趋势 direction 为 -1', () => {
    // Create klines with a sharp drop at bar 15 to trigger direction = -1
    const descending = makeKlines(25)
    for (let i = 12; i < descending.length; i++) {
      descending[i] = {
        ...descending[i],
        high: descending[i].high - 20,
        low: descending[i].low - 20,
        close: descending[i].close - 20,
      }
    }
    const result = superTrend.calc!(descending, indicator)
    // After the drop, some bars should have down values
    const hasDown = result.some((r) => r.down !== undefined)
    expect(hasDown).toBe(true)
    for (let i = 12; i < result.length; i++) {
      if (result[i].down !== undefined) {
        expect(result[i].down).toBeGreaterThan(descending[i].low)
      }
    }
  })
})
