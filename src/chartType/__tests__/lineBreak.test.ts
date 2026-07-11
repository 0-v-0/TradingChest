import { describe, it, expect } from 'vitest'
import { calcLineBreak } from '../lineBreak'

describe('calcLineBreak', () => {
  const makeKline = (open: number, high: number, low: number, close: number, timestamp = 0) => ({
    timestamp, open, high, low, close, volume: 0,
  })

  it('returns empty array for empty data', () => {
    expect(calcLineBreak([], 3)).toEqual([])
  })

  it('returns first line only for single K-line', () => {
    const data = [makeKline(100, 105, 95, 102)]
    const result = calcLineBreak(data, 3)
    expect(result).toEqual([
      { lbOpen: 102, lbClose: 102, lbHigh: 102, lbLow: 102, trend: 1, timestamp: 0 },
    ])
  })

  it('creates two lines for first up move', () => {
    const data = [
      makeKline(100, 105, 95, 102, 1000),
      makeKline(102, 108, 100, 106, 2000),
    ]
    const result = calcLineBreak(data, 3)
    expect(result.length).toBe(2)
    expect(result[0]).toEqual({ lbOpen: 102, lbClose: 102, lbHigh: 102, lbLow: 102, trend: 1, timestamp: 1000 })
    expect(result[1]).toEqual({ lbOpen: 102, lbClose: 106, lbHigh: 106, lbLow: 102, trend: 1, timestamp: 2000 })
  })

  it('creates two lines for first down move', () => {
    const data = [
      makeKline(100, 105, 95, 100, 1000),
      makeKline(100, 102, 94, 94, 2000),
    ]
    const result = calcLineBreak(data, 3)
    expect(result.length).toBe(2)
    expect(result[0]).toEqual({ lbOpen: 100, lbClose: 100, lbHigh: 100, lbLow: 100, trend: 1, timestamp: 1000 })
    expect(result[1]).toEqual({ lbOpen: 100, lbClose: 94, lbHigh: 100, lbLow: 94, trend: -1, timestamp: 2000 })
  })

  it('creates new white line when close breaks above N-line high', () => {
    const data = [
      makeKline(100, 105, 95, 102, 1000),
      makeKline(102, 108, 100, 106, 2000),
      makeKline(106, 118, 104, 115, 3000),
    ]
    const result = calcLineBreak(data, 3)
    expect(result.length).toBe(3)
    expect(result[2]).toEqual({ lbOpen: 106, lbClose: 115, lbHigh: 115, lbLow: 106, trend: 1, timestamp: 3000 })
  })

  it('creates new black line when close breaks below N-line low', () => {
    const data = [
      makeKline(100, 105, 95, 100, 1000),
      makeKline(100, 108, 100, 106, 2000),
      makeKline(106, 106, 92, 92, 3000),
    ]
    const result = calcLineBreak(data, 3)
    expect(result.length).toBe(3)
    expect(result[2]).toEqual({ lbOpen: 106, lbClose: 92, lbHigh: 106, lbLow: 92, trend: -1, timestamp: 3000 })
  })

  it('extends current line when close stays within range', () => {
    const data = [
      makeKline(100, 105, 95, 102, 1000),
      makeKline(102, 108, 100, 106, 2000),
      makeKline(106, 107, 103, 105, 3000),
    ]
    const result = calcLineBreak(data, 3)
    expect(result.length).toBe(2)
    expect(result[1].lbClose).toBe(105)
    expect(result[1].lbHigh).toBe(106)
    expect(result[1].lbLow).toBe(102)
    expect(result[1].timestamp).toBe(2000)
  })

  it('handles multiple direction breaks', () => {
    const data = [
      makeKline(100, 100, 100, 100, 1000),
      makeKline(100, 110, 100, 110, 2000),
      makeKline(110, 110, 80, 80, 3000),
      makeKline(80, 130, 80, 130, 4000),
    ]
    const result = calcLineBreak(data, 3)
    expect(result.length).toBe(4)
    expect(result[0].trend).toBe(1)
    expect(result[1].trend).toBe(1)
    expect(result[2].trend).toBe(-1)
    expect(result[3].trend).toBe(1)
  })

  it('preserves timestamp on new lines', () => {
    const data = [
      makeKline(100, 100, 100, 100, 1000),
      makeKline(100, 120, 100, 120, 2000),
    ]
    const result = calcLineBreak(data, 3)
    expect(result.length).toBe(2)
    expect(result[0].timestamp).toBe(1000)
    expect(result[1].timestamp).toBe(2000)
  })
})
