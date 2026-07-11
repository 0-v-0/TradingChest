import { describe, it, expect } from 'vitest'
import { calcRenkoBricks } from '../renko'

describe('calcRenkoBricks', () => {
  const makeKline = (open: number, high: number, low: number, close: number, timestamp = 0) => ({
    timestamp, open, high, low, close, volume: 0,
  })

  it('returns empty array for empty data', () => {
    expect(calcRenkoBricks([], 10)).toEqual([])
  })

  it('returns no bricks when price stays within brick size', () => {
    const data = [
      makeKline(100, 105, 98, 102),
      makeKline(102, 104, 101, 103),
    ]
    const bricks = calcRenkoBricks(data, 10)
    expect(bricks.length).toBe(0)
  })

  it('creates one up brick when price goes up by brick size', () => {
    const data = [
      makeKline(100, 100, 98, 100),
      makeKline(100, 115, 108, 115),
    ]
    const bricks = calcRenkoBricks(data, 10)
    expect(bricks.length).toBe(1)
    expect(bricks[0].brickOpen).toBe(100)
    expect(bricks[0].brickClose).toBe(110)
    expect(bricks[0].trend).toBe(1)
  })

  it('creates one down brick when price goes down by brick size', () => {
    const data = [
      makeKline(100, 100, 98, 100),
      makeKline(100, 100, 85, 85),
    ]
    const bricks = calcRenkoBricks(data, 10)
    expect(bricks.length).toBe(1)
    expect(bricks[0].brickOpen).toBe(100)
    expect(bricks[0].brickClose).toBe(90)
    expect(bricks[0].trend).toBe(-1)
  })

  it('creates multiple bricks for large price moves', () => {
    const data = [
      makeKline(100, 100, 98, 100),
      makeKline(100, 145, 132, 145),
    ]
    const bricks = calcRenkoBricks(data, 10)
    expect(bricks.length).toBe(4)
    bricks.forEach((b) => expect(b.trend).toBe(1))
    expect(bricks[0].brickClose).toBe(110)
    expect(bricks[3].brickClose).toBe(140)
  })

  it('preserves timestamp from the triggering K-line', () => {
    const data = [
      makeKline(100, 100, 98, 100, 1000),
      makeKline(100, 125, 115, 125, 2000),
    ]
    const bricks = calcRenkoBricks(data, 10)
    expect(bricks.length).toBe(2)
    expect(bricks[0].timestamp).toBe(2000)
    expect(bricks[1].timestamp).toBe(2000)
  })
})
