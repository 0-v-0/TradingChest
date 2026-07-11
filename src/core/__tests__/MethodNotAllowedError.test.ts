import { describe, it, expect } from 'vitest'
import { MethodNotAllowedError } from '../MethodNotAllowedError'

describe('MethodNotAllowedError', () => {
  it('creates error with correct message', () => {
    const error = new MethodNotAllowedError('getData')
    expect(error.message).toBe('[TradingChest] getData must be called on KLineChartPro instance')
    expect(error.name).toBe('MethodNotAllowedError')
  })

  it('is an instance of Error', () => {
    const error = new MethodNotAllowedError('test')
    expect(error).toBeInstanceOf(Error)
  })
})