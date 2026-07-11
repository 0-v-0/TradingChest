import { describe, it, expect } from 'vitest'
import { calcRangeBars } from '../rangeBars'

describe('calcRangeBars', () => {
  const makeKline = (open: number, high: number, low: number, close: number, timestamp = 0) => ({
    timestamp, open, high, low, close, volume: 0,
  })

  it('returns empty array for empty data', () => {
    expect(calcRangeBars([], 10)).toEqual([])
  })

  it('returns no bars when price stays within range size', () => {
    const data = [
      makeKline(100, 105, 98, 102),
      makeKline(102, 104, 101, 103),
    ]
    const bars = calcRangeBars(data, 10)
    expect(bars.length).toBe(0)
  })

  it('creates one up bar when high reaches range', () => {
    const data = [
      makeKline(100, 100, 100, 100, 1000),
      makeKline(100, 115, 108, 115, 2000),
    ]
    const bars = calcRangeBars(data, 10)
    expect(bars.length).toBe(1)
    expect(bars[0].barOpen).toBe(100)
    expect(bars[0].barClose).toBe(110)
    expect(bars[0].trend).toBe(1)
    expect(bars[0].timestamp).toBe(2000)
  })

  it('creates one down bar when low reaches range', () => {
    const data = [
      makeKline(100, 100, 100, 100, 1000),
      makeKline(100, 100, 85, 85, 2000),
    ]
    const bars = calcRangeBars(data, 10)
    expect(bars.length).toBe(1)
    expect(bars[0].barOpen).toBe(100)
    expect(bars[0].barClose).toBe(90)
    expect(bars[0].trend).toBe(-1)
    expect(bars[0].timestamp).toBe(2000)
  })

  it('creates multiple bars for large move in one direction', () => {
    const data = [
      makeKline(100, 100, 100, 100, 1000),
      makeKline(100, 145, 132, 145, 2000),
    ]
    const bars = calcRangeBars(data, 10)
    expect(bars.length).toBe(4)
    bars.forEach((b) => expect(b.trend).toBe(1))
    expect(bars[0].barOpen).toBe(100)
    expect(bars[0].barClose).toBe(110)
    expect(bars[3].barOpen).toBe(130)
    expect(bars[3].barClose).toBe(140)
    bars.forEach((b) => expect(b.timestamp).toBe(2000))
  })

  it('creates bars in both directions from volatile K-line', () => {
    const data = [
      makeKline(100, 100, 100, 100, 1000),
      makeKline(100, 115, 90, 102, 2000),
    ]
    const bars = calcRangeBars(data, 10)
    expect(bars.length).toBe(3)
    expect(bars[0].barOpen).toBe(100)
    expect(bars[0].barClose).toBe(110)
    expect(bars[0].trend).toBe(1)
    expect(bars[1].barOpen).toBe(110)
    expect(bars[1].barClose).toBe(100)
    expect(bars[1].trend).toBe(-1)
    expect(bars[2].barOpen).toBe(100)
    expect(bars[2].barClose).toBe(90)
    expect(bars[2].trend).toBe(-1)
    bars.forEach((b) => expect(b.timestamp).toBe(2000))
  })
})
