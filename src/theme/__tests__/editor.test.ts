import { describe, it, expect } from 'vitest'
import { exportTheme, importTheme } from '../editor'
import type { Styles } from 'klinecharts'

const mockStyles = {
  candle: { bar: { upColor: '#26a69a', downColor: '#ef5350' } },
  grid: { horizontal: { color: '#333' }, vertical: { color: '#333' } },
  xAxis: { tickText: { color: '#ccc' } },
  yAxis: { tickText: { color: '#ccc' } },
} as Styles

describe('exportTheme', () => {
  it('returns a JSON string', () => {
    const json = exportTheme(mockStyles, 'test')
    expect(typeof json).toBe('string')
    const parsed = JSON.parse(json)
    expect(parsed.version).toBe(1)
    expect(parsed.name).toBe('test')
    expect(parsed.styles).toEqual(mockStyles)
    expect(parsed.exportedAt).toBeTruthy()
  })

  it('uses default name when not provided', () => {
    const json = exportTheme(mockStyles)
    const parsed = JSON.parse(json)
    expect(parsed.name).toBe('custom-theme')
  })
})

describe('importTheme', () => {
  it('imports a valid ThemeExport JSON', () => {
    const data = { version: 1, name: 'test', styles: mockStyles, exportedAt: '' }
    const result = importTheme(JSON.stringify(data))
    expect(result).toEqual(mockStyles)
  })

  it('returns null for invalid JSON', () => {
    expect(importTheme('not json')).toBeNull()
  })

  it('returns null for JSON without version 1', () => {
    expect(importTheme(JSON.stringify({}))).toBeNull()
  })
})
