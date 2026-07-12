import { describe, it, expect } from 'vitest'
import type { KLineData } from 'klinecharts'
import { calcVolumeProfile } from '../other/volumeProfile'

function makeKLine(high: number, low: number, volume: number): KLineData {
  return { high, low, open: low, close: high, volume, timestamp: 0, turnover: 0 }
}

describe('volumeProfile', () => {
  it('should return correct number of bins', () => {
    const data = [
      makeKLine(110, 90, 100),
      makeKLine(108, 92, 200),
      makeKLine(105, 95, 150),
    ]
    const result = calcVolumeProfile(data, 10)
    expect(result.bins).toHaveLength(10)
  })

  it('should identify POC as the bin with highest volume', () => {
    const data = [
      makeKLine(100, 90, 100),
      makeKLine(100, 90, 200),
      makeKLine(100, 90, 300),
      makeKLine(100, 90, 400),
    ]
    const result = calcVolumeProfile(data, 5)
    const pocVol = result.bins[result.pocIndex].volume
    const maxVol = Math.max(...result.bins.map(b => b.volume))
    expect(pocVol).toBe(maxVol)
  })

  it('should handle zero volume data', () => {
    const data = [
      makeKLine(110, 90, 0),
      makeKLine(108, 92, 0),
    ]
    const result = calcVolumeProfile(data, 5)
    expect(result.bins).toHaveLength(5)
    expect(result.bins.every(b => b.volume === 0)).toBe(true)
  })

  it('should calculate total volume', () => {
    const data = [
      makeKLine(110, 90, 1000),
      makeKLine(108, 92, 2000),
    ]
    const result = calcVolumeProfile(data, 10)
    expect(result.totalVolume).toBeGreaterThan(0)
    expect(result.totalVolume).toBeCloseTo(3000, -1)
  })

  it('should have value area within bounds', () => {
    const data = [
      makeKLine(100, 90, 100),
      makeKLine(100, 90, 100),
      makeKLine(100, 90, 100),
      makeKLine(100, 90, 100),
      makeKLine(100, 90, 100),
    ]
    const result = calcVolumeProfile(data, 5)
    expect(result.vaLow).toBeGreaterThanOrEqual(0)
    expect(result.vaHigh).toBeLessThanOrEqual(result.bins.length - 1)
    expect(result.vaLow).toBeLessThanOrEqual(result.vaHigh)
  })

  it('should handle single K-line data', () => {
    const data = [makeKLine(100, 90, 500)]
    const result = calcVolumeProfile(data, 8)
    expect(result.bins).toHaveLength(8)
    expect(result.totalVolume).toBeCloseTo(500, 0)
    expect(result.pocIndex).toBeGreaterThanOrEqual(0)
  })
})
