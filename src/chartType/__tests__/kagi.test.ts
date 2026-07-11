import { describe, it, expect } from 'vitest'
import { calcKagi } from '../kagi'

describe('calcKagi', () => {
  const makeKline = (open: number, high: number, low: number, close: number, timestamp = 0) => ({
    timestamp, open, high, low, close, volume: 0,
  })

  it('returns empty array for empty data', () => {
    expect(calcKagi([], 10)).toEqual([])
  })

  it('returns empty array for single K-line', () => {
    expect(calcKagi([makeKline(100, 100, 100, 100)], 10)).toEqual([])
  })

  it('creates yang segment when close rises by reversal amount', () => {
    const data = [
      makeKline(100, 100, 100, 100, 1000),
      makeKline(100, 115, 105, 115, 2000),
    ]
    const segments = calcKagi(data, 10)
    expect(segments.length).toBe(1)
    expect(segments[0].kagiOpen).toBe(100)
    expect(segments[0].kagiClose).toBe(110)
    expect(segments[0].kagiHigh).toBe(110)
    expect(segments[0].kagiLow).toBe(100)
    expect(segments[0].trend).toBe(1)
  })

  it('creates yin segment when close falls by reversal amount', () => {
    const data = [
      makeKline(100, 100, 100, 100, 1000),
      makeKline(100, 100, 85, 85, 2000),
    ]
    const segments = calcKagi(data, 10)
    expect(segments.length).toBe(2)
    expect(segments[0].trend).toBe(0)
    expect(segments[0].kagiOpen).toBe(100)
    expect(segments[1].trend).toBe(-1)
    expect(segments[1].kagiOpen).toBe(100)
    expect(segments[1].kagiClose).toBe(90)
  })

  it('reversal direction triggers hinge then yin segment', () => {
    const data = [
      makeKline(100, 100, 100, 100, 1000),
      makeKline(100, 115, 105, 115, 2000),
      makeKline(115, 115, 95, 95, 3000),
    ]
    const segments = calcKagi(data, 10)
    expect(segments.length).toBe(3)
    expect(segments[0].trend).toBe(1)
    expect(segments[1].trend).toBe(0)
    expect(segments[2].trend).toBe(-1)
  })

  it('creates multiple segments for large price moves', () => {
    const data = [
      makeKline(100, 100, 100, 100, 1000),
      makeKline(100, 145, 130, 145, 2000),
    ]
    const segments = calcKagi(data, 10)
    expect(segments.length).toBe(4)
    segments.forEach((s) => expect(s.trend).toBe(1))
    expect(segments[0].kagiClose).toBe(110)
    expect(segments[3].kagiClose).toBe(140)
  })

  it('preserves timestamp from the triggering K-line', () => {
    const data = [
      makeKline(100, 100, 100, 100, 1000),
      makeKline(100, 135, 120, 135, 2000),
    ]
    const segments = calcKagi(data, 10)
    expect(segments.length).toBe(3)
    expect(segments[0].timestamp).toBe(2000)
    expect(segments[1].timestamp).toBe(2000)
    expect(segments[2].timestamp).toBe(2000)
  })
})
