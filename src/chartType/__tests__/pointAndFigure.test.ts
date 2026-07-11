import { describe, it, expect } from 'vitest'
import { calcPointAndFigure } from '../pointAndFigure'

describe('calcPointAndFigure', () => {
  const makeKline = (open: number, high: number, low: number, close: number, timestamp = 0) => ({
    timestamp, open, high, low, close, volume: 0,
  })

  it('returns empty array for empty data', () => {
    expect(calcPointAndFigure([], 10, 3)).toEqual([])
  })

  it('creates first column trending up when close >= open', () => {
    const data = [makeKline(100, 120, 98, 110, 1000)]
    const cols = calcPointAndFigure(data, 10, 3)
    expect(cols.length).toBe(1)
    expect(cols[0].trend).toBe(1)
    expect(cols[0].boxes.length).toBe(2)
    expect(cols[0].boxes[0].priceLevel).toBe(110)
    expect(cols[0].boxes[1].priceLevel).toBe(120)
    expect(cols[0].startPrice).toBe(110)
    expect(cols[0].endPrice).toBe(120)
  })

  it('creates first column trending down when close < open', () => {
    const data = [makeKline(100, 105, 80, 90, 1000)]
    const cols = calcPointAndFigure(data, 10, 3)
    expect(cols.length).toBe(1)
    expect(cols[0].trend).toBe(-1)
    expect(cols[0].boxes.length).toBe(2)
    expect(cols[0].boxes[0].priceLevel).toBe(90)
    expect(cols[0].boxes[1].priceLevel).toBe(80)
    expect(cols[0].startPrice).toBe(90)
    expect(cols[0].endPrice).toBe(80)
  })

  it('adds X boxes when uptrend continues', () => {
    const data = [
      makeKline(100, 105, 98, 102, 1000),
      makeKline(102, 125, 110, 125, 2000),
    ]
    const cols = calcPointAndFigure(data, 10, 3)
    expect(cols.length).toBe(1)
    expect(cols[0].trend).toBe(1)
    expect(cols[0].boxes.length).toBe(3)
    expect(cols[0].endPrice).toBe(120)
  })

  it('adds O boxes when downtrend continues', () => {
    const data = [
      makeKline(100, 102, 95, 98, 1000),
      makeKline(98, 100, 75, 80, 2000),
    ]
    const cols = calcPointAndFigure(data, 10, 3)
    expect(cols.length).toBe(1)
    expect(cols[0].trend).toBe(-1)
    expect(cols[0].boxes.length).toBe(3)
    expect(cols[0].endPrice).toBe(80)
  })

  it('reverses from X to O when low drops enough', () => {
    const data = [
      makeKline(100, 120, 100, 120, 1000),
      makeKline(120, 120, 70, 75, 2000),
    ]
    const cols = calcPointAndFigure(data, 10, 3)
    expect(cols.length).toBe(2)
    expect(cols[0].trend).toBe(1)
    expect(cols[1].trend).toBe(-1)
    expect(cols[1].boxes.length).toBe(5)
    expect(cols[1].startPrice).toBe(110)
    expect(cols[1].endPrice).toBe(70)
  })

  it('reverses from O to X when high rises enough', () => {
    const data = [
      makeKline(120, 120, 80, 80, 1000),
      makeKline(80, 150, 80, 150, 2000),
    ]
    const cols = calcPointAndFigure(data, 10, 3)
    expect(cols.length).toBe(2)
    expect(cols[0].trend).toBe(-1)
    expect(cols[1].trend).toBe(1)
    expect(cols[1].boxes.length).toBe(7)
    expect(cols[1].startPrice).toBe(90)
    expect(cols[1].endPrice).toBe(150)
  })

  it('produces multiple columns from volatile data', () => {
    const data = [
      makeKline(100, 110, 100, 110, 1000),
      makeKline(110, 110, 70, 75, 2000),
      makeKline(75, 160, 75, 160, 3000),
      makeKline(160, 160, 100, 105, 4000),
    ]
    const cols = calcPointAndFigure(data, 10, 3)
    expect(cols.length).toBe(4)
    expect(cols[0].trend).toBe(1)
    expect(cols[1].trend).toBe(-1)
    expect(cols[2].trend).toBe(1)
    expect(cols[3].trend).toBe(-1)
    expect(cols[0].boxes.length).toBe(1)
    expect(cols[1].boxes.length).toBe(4)
    expect(cols[2].boxes.length).toBe(9)
    expect(cols[3].boxes.length).toBe(6)
  })

  it('preserves timestamp from the triggering K-line', () => {
    const data = [
      makeKline(100, 120, 100, 120, 1000),
      makeKline(120, 120, 70, 75, 2000),
    ]
    const cols = calcPointAndFigure(data, 10, 3)
    expect(cols.length).toBe(2)
    cols[0].boxes.forEach(b => expect(b.timestamp).toBe(1000))
    cols[1].boxes.forEach(b => expect(b.timestamp).toBe(2000))
  })
})
